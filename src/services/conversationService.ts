import { randomUUID } from 'node:crypto';
import { query } from '@/lib/server/database';
import type { ChatMessage } from '@/types/types';

/** Create a new conversation and return its ID. */
export async function createConversation(userId: string, title?: string): Promise<string> {
  const id = randomUUID();
  await query(
    'INSERT INTO conversations (id, user_id, title) VALUES ($1, $2, $3)',
    [id, userId, title ?? null],
  );
  return id;
}

/** Append a message to an existing conversation. */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  fileName?: string,
) {
  await query(
    `INSERT INTO conversation_messages (id, conversation_id, role, content, file_name)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), conversationId, role, content, fileName ?? null],
  );
}

/** Load all messages for a conversation, oldest first. */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const result = await query<{ role: string; content: string; file_name: string | null }>(
    `SELECT role, content, file_name
     FROM conversation_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId],
  );

  return result.rows.map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
    fileName: row.file_name ?? undefined,
  }));
}

/** Log an action (create, update, delete) for audit / undo. */
export async function logAction(
  userId: string,
  action: string,
  eventId?: string,
  eventData?: unknown,
  conversationId?: string,
) {
  await query(
    `INSERT INTO action_log (id, user_id, conversation_id, action, event_id, event_data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), userId, conversationId ?? null, action, eventId ?? null, eventData ? JSON.stringify(eventData) : null],
  );
}

/** List recent actions for a user (for undo). */
export async function getRecentActions(userId: string, limit = 20) {
  const result = await query<{
    id: string;
    action: string;
    event_id: string | null;
    event_data: unknown;
    created_at: Date;
  }>(
    `SELECT id, action, event_id, event_data, created_at
     FROM action_log
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}
