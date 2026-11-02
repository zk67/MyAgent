import { randomUUID } from 'node:crypto';
import { query } from '@/lib/server/database';

export type ExtractedEvent = {
  id: string;
  title: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  recurrence?: string;
  createdEventId?: string;
};

/** Save a PDF upload record. Returns the new document ID. */
export async function saveDocument(
  userId: string,
  fileName: string,
  fileSize: number,
  mimeType = 'application/pdf',
): Promise<string> {
  const id = randomUUID();
  await query(
    `INSERT INTO documents (id, user_id, file_name, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, fileName, fileSize, mimeType],
  );
  return id;
}

/** Save events extracted from a PDF so the user can preview them before creating. */
export async function saveExtractedEvents(
  documentId: string,
  events: Omit<ExtractedEvent, 'id' | 'createdEventId'>[],
): Promise<ExtractedEvent[]> {
  const saved: ExtractedEvent[] = [];

  for (const event of events) {
    const id = randomUUID();
    await query(
      `INSERT INTO extracted_events (id, document_id, title, start_date, start_time, end_time, description, location, recurrence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, documentId, event.title, event.startDate, event.startTime ?? null, event.endTime ?? null, event.description ?? null, event.location ?? null, event.recurrence ?? null],
    );
    saved.push({ id, ...event });
  }

  return saved;
}

/** Load extracted events for a document. */
export async function getExtractedEvents(documentId: string): Promise<ExtractedEvent[]> {
  const result = await query<{
    id: string;
    title: string;
    start_date: string;
    start_time: string | null;
    end_time: string | null;
    description: string | null;
    location: string | null;
    recurrence: string | null;
    created_event_id: string | null;
  }>(
    `SELECT id, title, start_date, start_time, end_time, description, location, recurrence, created_event_id
     FROM extracted_events
     WHERE document_id = $1
     ORDER BY start_date ASC, start_time ASC`,
    [documentId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    recurrence: row.recurrence ?? undefined,
    createdEventId: row.created_event_id ?? undefined,
  }));
}

/** Mark an extracted event as created in Google Calendar. */
export async function markEventCreated(extractedEventId: string, googleEventId: string) {
  await query(
    'UPDATE extracted_events SET created_event_id = $1 WHERE id = $2',
    [googleEventId, extractedEventId],
  );
}

/** List documents uploaded by a user, newest first. */
export async function getUserDocuments(userId: string, limit = 20) {
  const result = await query<{
    id: string;
    file_name: string;
    file_size: number;
    uploaded_at: Date;
  }>(
    `SELECT id, file_name, file_size, uploaded_at
     FROM documents
     WHERE user_id = $1
     ORDER BY uploaded_at DESC
     LIMIT $2`,
    [userId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
  }));
}
