import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { deleteEvent, deleteTokens, getEvents, newEvent } from '@/services/calendarService';

function isSessionError(message: string) {
  return (
    message.includes('No tokens found') ||
    message.includes('No refresh token') ||
    message.includes('invalid_grant')
  );
}

function sessionErrorResponse() {
  return NextResponse.json(
    { error: 'Calendar connection expired. Please reconnect.' },
    { status: 401 }
  );
}

function dailyLimitResponse() {
  return NextResponse.json(
    { error: 'You can create a maximum of 7 events per day.' },
    { status: 409 }
  );
}

async function getSessionId() {
  return (await cookies()).get('session_id')?.value;
}

export async function GET(request: Request) {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 401 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const year = Number(url.searchParams.get('year')) || now.getFullYear();
    const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
    const rangeStart = url.searchParams.get('from');
    const rangeEnd = url.searchParams.get('to');
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);
    const timeMin = rangeStart ? new Date(rangeStart).toISOString() : startOfMonth.toISOString();
    const timeMax = rangeEnd ? new Date(rangeEnd).toISOString() : startOfNextMonth.toISOString();
    const events = await getEvents(sessionId, timeMin, timeMax);

    return NextResponse.json({ events: events.items || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error /api/calendar:', message);

    if (isSessionError(message)) {
      const sessionId = await getSessionId();
      
      if (sessionId) deleteTokens(sessionId);
      return sessionErrorResponse();
    }
    return NextResponse.json({ error: 'Unable to load calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const startDate = typeof body.startDate === 'string' ? body.startDate : '';
    const startTime = typeof body.startTime === 'string' ? body.startTime : '';
    const endTime = typeof body.endTime === 'string' && body.endTime ? body.endTime : undefined;
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    const location = typeof body.location === 'string' ? body.location.trim() : undefined;
    const reminder = body.reminder === '' || body.reminder === undefined ? undefined : Number(body.reminder);

    const hasTooManyCharacters = title.length > 100
      || (description !== undefined && description.length > 500)
      || (location !== undefined && location.length > 200);

    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      && !Number.isNaN(new Date(`${startDate}T00:00:00`).getTime());
    const validStartTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime);
    const validEndTime = endTime === undefined || /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime);

    if (
      !title ||
      !validDate ||
      !validStartTime ||
      !validEndTime ||
      (endTime !== undefined && endTime <= startTime) ||
      hasTooManyCharacters ||
      (reminder !== undefined && !Number.isFinite(reminder))
    ) {
      return NextResponse.json({ error: 'The event details are invalid' }, { status: 400 });
    }

    const event = await newEvent(sessionId, title, startTime, startDate, description, endTime, reminder, location);
    return NextResponse.json({ event }, { status: 201 });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error POST /api/calendar:', message);

    if (message.includes('Daily event limit reached')) {
      return dailyLimitResponse();
    }

    if (isSessionError(message)) {
      const sessionId = await getSessionId();
      if (sessionId) deleteTokens(sessionId);
      return sessionErrorResponse();
    }
    return NextResponse.json({ error: 'Unable to create the calendar event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 401 });
    }

    const body = await request.json();
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    if (!eventId) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    await deleteEvent(sessionId, [eventId]);
    return NextResponse.json({ success: true });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error DELETE /api/calendar:', message);

    if (isSessionError(message)) {
      const sessionId = await getSessionId();
      if (sessionId) deleteTokens(sessionId);
      return sessionErrorResponse();
    }
    return NextResponse.json({ error: 'Unable to delete the calendar event' }, { status: 500 });
  }
}
