import { ChatMessage } from '@/types/types';

export async function sendChatMessage(messages: ChatMessage[], file?: File | null) {
  const formData = new FormData();
  formData.append('messages', JSON.stringify(messages));

  if (file) {
    formData.append('file', file);
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Chat request failed.');
  }

  return data;
}

type StreamCallbacks = {
  onToken: (text: string) => void;
  onDone: (data: { messages: ChatMessage[]; calendarModified: boolean; pendingDeletion?: unknown }) => void;
  onError: (error: string) => void;
};

/**
 * Send a chat message and stream the response via SSE.
 * Falls back to the non-streaming endpoint if SSE fails.
 */
export async function sendChatMessageStream(
  messages: ChatMessage[],
  file: File | null | undefined,
  callbacks: StreamCallbacks,
) {
  const formData = new FormData();
  formData.append('messages', JSON.stringify(messages));
  if (file) formData.append('file', file);

  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Chat request failed.');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Stream not available.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();

      if (payload === '[DONE]') return;

      try {
        const event = JSON.parse(payload);
        switch (event.type) {
          case 'token':
            callbacks.onToken(event.text);
            break;
          case 'done':
            callbacks.onDone(event);
            break;
          case 'pending_deletion':
            callbacks.onDone(event);
            break;
          case 'error':
            callbacks.onError(event.error);
            break;
        }
      } catch {
        // Ignore malformed SSE lines.
      }
    }
  }
}

export async function respondToDeletion(requestId: string, confirm: boolean) {
  const response = await fetch('/api/chat/deletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, confirm }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Unable to process confirmation.');
  return data;
}
