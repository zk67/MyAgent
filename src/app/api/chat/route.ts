
import { runAgent } from '@/agent-utils/agent';

const MAX_PDF_SIZE = 10 * 1024 * 1024;
import { cookies } from 'next/headers';
import { ChatMessage } from '@/types/types';

export async function POST(request: Request) {
  const formData = await request.formData();
  const messagesValue = formData.get('messages');
  const file = formData.get('file');

  if (typeof messagesValue !== 'string') {
    return Response.json({ error: 'Invalid conversation.' }, { status: 400 });
  }

  let messages: ChatMessage[];
  
  try {
    messages = JSON.parse(messagesValue);
  } catch {
    return Response.json({ error: 'Invalid conversation format.' }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'The conversation cannot be empty.' }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || typeof lastMessage !== 'object' || !('content' in lastMessage)
    || typeof lastMessage.content !== 'string') {
    return Response.json({ error: 'Invalid message.' }, { status: 400 });
  }

  if (lastMessage.content.length > 2000) {
    return Response.json(
      { error: 'The message cannot exceed 2000 characters.' },
      { status: 400 }
    );
  }

  if (file !== null && !(file instanceof File)) {
    return Response.json({ error: 'Invalid file.' }, { status: 400 });
  }

  if (file instanceof File && file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 415 });
  }

  if (file instanceof File && file.size > MAX_PDF_SIZE) {
    return Response.json({ error: 'PDF files must be 10 MB or smaller.' }, { status: 413 });
  }

  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) {
    return Response.json({ error: 'Please connect Google Calendar first.' }, { status: 401 });
  }

  try {
    const result = await runAgent(messages, sessionId, file instanceof File ? file : undefined,
    );
    return Response.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to process the request.';

    if (errorMessage.includes('Daily event limit reached')) {
      return Response.json({ error: 'You can create a maximum of 7 events per day.' }, { status: 409 });
    }

    console.error('API error POST /api/chat:', errorMessage);
    return Response.json({ error: 'Unable to process the request.' }, { status: 500 });
  }
}
