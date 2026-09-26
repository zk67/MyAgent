import { CalendarEvent, CreateCalendarEventInput } from '@/types/types';

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Calendar request failed.');
  }

  return data;
}

export async function getCalendarEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const response = await fetch(`/api/calendar?${params.toString()}`, {
    cache: 'no-store',
  });
  const data = await readResponse(response);
  return data.events || [];
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  const response = await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readResponse(response);
  return data.event;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const response = await fetch('/api/calendar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  await readResponse(response);
}
