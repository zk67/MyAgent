import { cookies } from 'next/headers';
import { runAgent } from '@/agent-utils/agent';
import { isSessionError } from '@/services/calendarService';
import { allowChatRequest } from '@/services/sessionService';
import { ChatMessage } from '@/types/types';

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 60;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;

  const { role, content } = value as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof content === 'string';
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) {
    return errorResponse('Please connect Google Calendar first.', 401);
  }

  const formData = await request.formData();
  const messagesValue = formData.get('messages');
  const file = formData.get('file');

  if (typeof messagesValue !== 'string') {
    return errorResponse('Invalid conversation.', 400);
  }

  let messages: unknown;
  try {
    messages = JSON.parse(messagesValue);
  } catch {
    return errorResponse('Invalid conversation format.', 400);
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse('The conversation cannot be empty.', 400);
  }
  if (messages.length > MAX_MESSAGES || !messages.every(isChatMessage)) {
    return errorResponse('Invalid conversation.', 400);
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.content.length > MAX_MESSAGE_LENGTH) {
    return errorResponse(`The message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }

  if (file !== null && !(file instanceof File)) {
    return errorResponse('Invalid file.', 400);
  }
  if (file && file.type !== 'application/pdf') {
    return errorResponse('Only PDF files are accepted.', 415);
  }
  if (file && file.size > MAX_PDF_SIZE) {
    return errorResponse('PDF files must be 10 MB or smaller.', 413);
  }
  // Check the first bytes to make sure it's really a PDF, not just a renamed file.
  if (file) {
    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44
      && header[3] === 0x46 && header[4] === 0x2D; // %PDF-
    if (!isPdf) {
      return errorResponse('The file does not appear to be a valid PDF.', 415);
    }
  }

  try {
    if (!(await allowChatRequest(sessionId))) {
      return errorResponse('Too many chat requests. Please wait a minute and try again.', 429);
    }

    const result = await runAgent(messages, sessionId, file ?? undefined);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error POST /api/chat:', message);

    // The session no longer exists in the database (expired or logged out).
    const sessionIsGone = message.includes('violates foreign key');
    if (isSessionError(message) || sessionIsGone) {
      return errorResponse('Calendar connection expired. Please reconnect.', 401);
    }
    return errorResponse('Unable to process the request.', 500);
  }
}
