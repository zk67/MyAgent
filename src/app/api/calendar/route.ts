import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { deleteEvent, deleteTokens, getEvents, isSessionError, newEvent } from '@/services/calendarService';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type NewEventInput = {
  title: string;
  startDate: string;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
  reminder?: number;
  showInUpcoming: boolean;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function getSessionId() {
  return (await cookies()).get('session_id')?.value;
}

// Turns an error from the calendar service into a response.
async function handleError(error: unknown, sessionId: string, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('API error /api/calendar:', message);

  if (isSessionError(message)) {
    // A broken Google connection is removed so the user can reconnect.
    // "No tokens found" is different: the session may be waiting for the Google
    // sign-in to finish, and deleting it would make that sign-in fail.
    if (!message.includes('No tokens found')) await deleteTokens(sessionId);
    return errorResponse('Calendar connection expired. Please reconnect.', 401);
  }
  return errorResponse(fallbackMessage, 500);
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

// Reads and checks the body of a "create event" request. Returns null if it is invalid.
function parseNewEvent(body: Record<string, unknown>): NewEventInput | null {
  const title = readText(body.title) ?? '';
  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  const startTime = typeof body.startTime === 'string' ? body.startTime : '';
  const endTime = typeof body.endTime === 'string' && body.endTime ? body.endTime : undefined;
  const description = readText(body.description);
  const location = readText(body.location);
  const reminder = body.reminder === '' || body.reminder === undefined ? undefined : Number(body.reminder);
  const showInUpcoming = body.showInUpcoming !== false;

  const titleIsValid = title !== '' && title.length <= 100;
  const textsAreValid = (description?.length ?? 0) <= 500 && (location?.length ?? 0) <= 200;
  const dateIsValid = DATE_PATTERN.test(startDate) && !Number.isNaN(new Date(`${startDate}T00:00:00`).getTime());
  const timesAreValid = TIME_PATTERN.test(startTime)
    && (endTime === undefined || (TIME_PATTERN.test(endTime) && endTime > startTime));
  const reminderIsValid = reminder === undefined || Number.isFinite(reminder);

  if (!titleIsValid || !textsAreValid || !dateIsValid || !timesAreValid || !reminderIsValid) {
    return null;
  }
  return { title, startDate, startTime, endTime, description, location, reminder, showInUpcoming };
}

export async function GET(request: Request) {
  const sessionId = await getSessionId();
  if (!sessionId) return errorResponse('Missing session_id', 401);

  try {
    // Without "from" and "to", return the current month.
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const timeMin = new Date(searchParams.get('from') ?? startOfMonth).toISOString();
    const timeMax = new Date(searchParams.get('to') ?? startOfNextMonth).toISOString();
    const events = await getEvents(sessionId, timeMin, timeMax);

    return NextResponse.json({ events: events.items || [] });
  } catch (error) {
    return handleError(error, sessionId, 'Unable to load calendar events');
  }
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();
  if (!sessionId) return errorResponse('Missing session_id', 401);

  try {
    const input = parseNewEvent(await request.json());
    if (!input) return errorResponse('The event details are invalid', 400);

    const event = await newEvent(
      sessionId,
      input.title,
      input.startTime,
      input.startDate,
      input.description,
      input.endTime,
      input.reminder,
      input.location,
      input.showInUpcoming,
    );
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Daily event limit reached')) {
      return errorResponse('You have reached the daily event limit for this day.', 409);
    }
    return handleError(error, sessionId, 'Unable to create the calendar event');
  }
}

export async function DELETE(request: Request) {
  const sessionId = await getSessionId();
  if (!sessionId) return errorResponse('Missing session_id', 401);

  try {
    const body = await request.json();
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    if (!eventId) return errorResponse('Missing event ID', 400);

    if (body.confirmed !== true) {
      return errorResponse('Explicit confirmation is required before deleting an event.', 428);
    }

    await deleteEvent(sessionId, [eventId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    // An event that is already gone counts as deleted.
    if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
      return NextResponse.json({ success: true });
    }
    return handleError(error, sessionId, 'Unable to delete the calendar event');
  }
}
