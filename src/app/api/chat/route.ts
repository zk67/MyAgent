import { cookies } from 'next/headers';
import { runAgent } from '@/agent-utils/agent';
import { isSessionError } from '@/services/calendarService';
import { allowChatRequest } from '@/services/sessionService';
import { ChatMessage } from '@/types/types';

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 60;

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;

  const { role, content } = value as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof content === 'string';
}

// Reads the conversation sent by the browser.
function readMessages(value: FormDataEntryValue | null): { messages: ChatMessage[] } | { error: string } {
  if (typeof value !== 'string') return { error: 'Invalid conversation.' };

  let messages: unknown;
  try {
    messages = JSON.parse(value);
  } catch {
    return { error: 'Invalid conversation format.' };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'The conversation cannot be empty.' };
  }
  if (messages.length > MAX_MESSAGES || !messages.every(isChatMessage)) {
    return { error: 'Invalid conversation.' };
  }
  return { messages };
}

// Returns an error response if the file is not a PDF we accept, otherwise null.
async function checkPdf(file: File) {
  if (file.type !== 'application/pdf') return errorResponse('Only PDF files are accepted.', 415);
  if (file.size > MAX_PDF_SIZE) return errorResponse('PDF files must be 10 MB or smaller.', 413);

  // A real PDF starts with "%PDF-", even if someone renamed another file.
  const start = await file.slice(0, 5).text();
  if (start !== '%PDF-') return errorResponse('The file does not appear to be a valid PDF.', 415);

  return null;
}

export async function POST(request: Request) {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return errorResponse('Please connect Google Calendar first.', 401);

  const formData = await request.formData();

  const conversation = readMessages(formData.get('messages'));
  if ('error' in conversation) return errorResponse(conversation.error, 400);
  const { messages } = conversation;

  if (messages[messages.length - 1].content.length > MAX_MESSAGE_LENGTH) {
    return errorResponse(`The message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }

  const file = formData.get('file');
  if (file !== null && !(file instanceof File)) return errorResponse('Invalid file.', 400);
  if (file) {
    const pdfError = await checkPdf(file);
    if (pdfError) return pdfError;
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
