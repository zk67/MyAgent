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
