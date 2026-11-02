import { cookies } from 'next/headers';
import { runAgentStream } from '@/agent-utils/agentStream';
import { isSessionError } from '@/services/calendarService';
import { allowChatRequest } from '@/services/sessionService';
import { getUserIdFromSession } from '@/services/preferencesService';
import { createConversation, addMessage, logAction } from '@/services/conversationService';
import { ChatMessage } from '@/types/types';

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 60;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof content === 'string';
}

export async function POST(request: Request) {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Please connect Google Calendar first.' }, { status: 401 });
  }

  const formData = await request.formData();
  const messagesValue = formData.get('messages');
  const file = formData.get('file');
  const conversationId = formData.get('conversationId') as string | null;

  if (typeof messagesValue !== 'string') {
    return Response.json({ error: 'Invalid conversation.' }, { status: 400 });
  }

  let messages: unknown;
  try {
    messages = JSON.parse(messagesValue);
  } catch {
    return Response.json({ error: 'Invalid conversation format.' }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES || !messages.every(isChatMessage)) {
    return Response.json({ error: 'Invalid conversation.' }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.content.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
  }

  if (file !== null && !(file instanceof File)) {
    return Response.json({ error: 'Invalid file.' }, { status: 400 });
  }
  if (file && file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 415 });
  }
  if (file && file.size > MAX_PDF_SIZE) {
    return Response.json({ error: 'PDF file must be 10 MB or smaller.' }, { status: 413 });
  }
  if (file) {
    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44
      && header[3] === 0x46 && header[4] === 0x2D;
    if (!isPdf) {
      return Response.json({ error: 'The file does not appear to be a valid PDF.' }, { status: 415 });
    }
  }

  try {
    if (!(await allowChatRequest(sessionId))) {
      return Response.json({ error: 'Too many chat requests. Please wait a minute.' }, { status: 429 });
    }

    // Persist the conversation and user message in the background.
    const userId = await getUserIdFromSession(sessionId);
    let activeConversationId = conversationId;

    if (userId) {
      try {
        if (!activeConversationId) {
          // First message — create a conversation.
          const preview = lastMessage.content.slice(0, 80);
          activeConversationId = await createConversation(userId, preview);
        }
        const fileName = file instanceof File ? file.name : undefined;
        await addMessage(activeConversationId, 'user', lastMessage.content, fileName);
      } catch (err) {
        // Don't block the chat if persistence fails.
        console.error('Conversation persistence error:', err);
      }
    }

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the conversation ID so the client can pass it back next time.
          if (activeConversationId) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: activeConversationId })}\n\n`));
          }

          await runAgentStream(messages as ChatMessage[], sessionId, file ?? undefined, (event) => {
            if (event.type === 'token') {
              fullResponse += event.text;
            }
            if (event.type === 'tool_done') {
              // Log calendar actions for undo.
              if (userId && activeConversationId) {
                const toolName = (event as { name?: string }).name;
                if (toolName && ['create_event', 'create_events', 'update_event', 'delete_event'].includes(toolName)) {
                  logAction(userId, toolName, undefined, (event as { result?: unknown }).result, activeConversationId).catch(() => {});
                }
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          });

          // Persist the assistant response.
          if (userId && activeConversationId && fullResponse) {
            addMessage(activeConversationId, 'assistant', fullResponse).catch((err) =>
              console.error('Failed to save assistant message:', err),
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          const sessionIsGone = message.includes('violates foreign key');
          const errorEvent = isSessionError(message) || sessionIsGone
            ? { type: 'error', error: 'Calendar connection expired. Please reconnect.', code: 401 }
            : { type: 'error', error: 'Unable to process the request.', code: 500 };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error POST /api/chat/stream:', message);
    return Response.json({ error: 'Unable to process the request.' }, { status: 500 });
  }
}
