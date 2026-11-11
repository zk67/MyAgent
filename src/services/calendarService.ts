import { createOAuth2client } from '@/services/authService';
import { CalendarEvent } from '@/types/types';
import { getTodayInMontreal } from '@/services/model';
import { google, calendar_v3 } from 'googleapis';
import {
  deleteSession,
  getSessionTokens,
  updateSessionTokens,
} from '@/services/sessionService';

const MAX_EVENTS_PER_DAY = 20;
const TIME_ZONE = 'America/Montreal';

// True when the error means the user must sign in with Google again.
export function isSessionError(message: string) {
  return (
    message.includes('No tokens found') ||
    message.includes('No refresh token') ||
    message.includes('invalid_grant')
  );
}

export const getTokens = getSessionTokens;
export const deleteTokens = deleteSession;

export async function getCalendarClient(sessionId: string) {
  const tokens = await getTokens(sessionId);

  if (!tokens) {
    throw new Error('No tokens found for the given session ID.');
  }

  if (!tokens.refreshToken) {
    throw new Error('No refresh token is set.');
  }

  const authClient = createOAuth2client();
  authClient.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt,
  });

  authClient.on('tokens', (refreshedTokens) => {
    void updateSessionTokens(sessionId, {
      accessToken: refreshedTokens.access_token || tokens.accessToken,
      refreshToken: refreshedTokens.refresh_token || tokens.refreshToken,
      expiresAt: refreshedTokens.expiry_date || tokens.expiresAt,
    }).catch((error) => console.error('Unable to persist refreshed Google tokens:', error));
  });

  return google.calendar({ version: 'v3', auth: authClient });
}

// "09:30" -> "10:30". The event must still end on the same day.
function addOneHour(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 60;
  if (totalMinutes >= 24 * 60) {
    throw new Error('Event end time must be on the same day as its start time.');
  }

  const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const newMinutes = String(totalMinutes % 60).padStart(2, '0');
  return `${newHours}:${newMinutes}`;
}

function validateEventInput(
  title: string,
  startDate: string,
  startTime: string,
  endTime?: string,
  description?: string,
  location?: string,
  reminder?: number,
) {
  if (!title.trim()) {
    throw new Error('Event title is required.');
  }
  if (title.length > 100) {
    throw new Error('Event title must be at most 100 characters.');
  }

  const dateMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(startDate);
  if (!dateMatch) throw new Error('Event date must use YYYY-MM-DD format.');
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  const dateIsValid = parsedDate.getUTCFullYear() === year
    && parsedDate.getUTCMonth() === month - 1
    && parsedDate.getUTCDate() === day;

  if (!dateIsValid) {
    throw new Error('Event date is invalid.');
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startTime)) {
    throw new Error('Start time must use HH:mm format.');
  }
  if (endTime !== undefined && !timePattern.test(endTime)) {
    throw new Error('End time must use HH:mm format.');
  }
  if (endTime !== undefined && endTime <= startTime) {
    throw new Error('Event end time must be after its start time.');
  }
  if (description !== undefined && description.length > 500) {
    throw new Error('Event description must be at most 500 characters.');
  }
  if (location !== undefined && location.length > 200) {
    throw new Error('Event location must be at most 200 characters.');
  }
  const reminderIsInvalid = reminder !== undefined
    && (!Number.isInteger(reminder) || reminder < 0 || reminder > 40320);
  if (reminderIsInvalid) {
    throw new Error('Reminder must be a whole number between 0 and 40320 minutes.');
  }

  // Both strings look like "2026-11-01 18:30", so they can be compared as text.
  if (`${startDate} ${startTime}` <= getNowInMontreal()) {
    throw new Error('Event start must be in the future.');
  }
}

function getNowInMontreal() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}

// The event as Google Calendar expects it. Without an end time, it lasts one hour.
function buildEventBody(
  title: string,
  startDate: string,
  startTime: string,
  endTime?: string,
  description?: string,
  location?: string,
  reminder?: number,
  showInUpcoming = true,
): calendar_v3.Schema$Event {
  const eventEndTime = endTime || addOneHour(startTime);

  return {
    summary: title,
    description: description || '',
    location: location || undefined,
    start: { dateTime: `${startDate}T${startTime}:00`, timeZone: TIME_ZONE },
    end: { dateTime: `${startDate}T${eventEndTime}:00`, timeZone: TIME_ZONE },
    reminders: reminder
      ? { useDefault: false, overrides: [{ method: 'email', minutes: reminder }] }
      : undefined,
    extendedProperties: {
      private: { myAgentShowInUpcoming: showInUpcoming ? 'true' : 'false' },
    },
  };
}

function getEventDate(event: CalendarEvent): string | null {
  if (event.start.date) return event.start.date;

  if (!event.start.dateTime) return null;

  const date = new Date(event.start.dateTime);
  if (Number.isNaN(date.getTime())) return null;

  return getTodayInMontreal(date);
}

export async function newEvent(
  sessionId: string,
  title: string,
  startTime: string,
  startDate: string,
  description?: string,
  endTime?: string,
  reminder?: number,
  location?: string,
  showInUpcoming = true,
) {
  validateEventInput(title, startDate, startTime, endTime, description, location, reminder);
  const dayStart = new Date(`${startDate}T00:00:00-12:00`).toISOString();
  const dayEnd = new Date(`${startDate}T23:59:59+14:00`).toISOString();
  const existingEvents = await getEvents(sessionId, dayStart, dayEnd);
  const eventsOnSelectedDay = (existingEvents.items || []).filter(
    (event) => getEventDate(event as CalendarEvent) === startDate
  );

  if (eventsOnSelectedDay.length >= MAX_EVENTS_PER_DAY) {
    throw new Error(`Daily event limit reached: maximum ${MAX_EVENTS_PER_DAY} events.`);
  }

  const calendar = await getCalendarClient(sessionId);
  const requestBody = buildEventBody(title, startDate, startTime, endTime, description, location, reminder, showInUpcoming);

  const response = await calendar.events.insert({ calendarId: 'primary', requestBody });
  return response.data;
}

export async function newEventWithRecurrence(
  sessionId: string,
  title: string,
  startTime: string,
  startDate: string,
  description?: string,
  endTime?: string,
  reminder?: number,
  location?: string,
  recurrence?: string,
  showInUpcoming = true,
) {
  validateEventInput(title, startDate, startTime, endTime, description, location, reminder);

  const calendar = await getCalendarClient(sessionId);
  const requestBody = buildEventBody(title, startDate, startTime, endTime, description, location, reminder, showInUpcoming);

  if (recurrence) {
    // Accept "RRULE:..." or just "FREQ=WEEKLY;COUNT=13" etc.
    const rule = recurrence.startsWith('RRULE:') ? recurrence : `RRULE:${recurrence}`;
    requestBody.recurrence = [rule];
  }

  const response = await calendar.events.insert({ calendarId: 'primary', requestBody });
  return response.data;
}

export async function getEvents(sessionId: string, timeMin: string, timeMax: string) {
  const calendar = await getCalendarClient(sessionId);
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
  });

  return response.data;
}

export async function updateEvent(sessionId: string, event: CalendarEvent, update: Partial<CalendarEvent>) {
  const eventId = event.id || event.eventId;
  if (!eventId) throw new Error('An event ID is required for updates.');
  if (Object.keys(update).length === 0) {
    throw new Error('At least one event field must be provided for an update.');
  }

  if (update.summary !== undefined && !update.summary.trim()) {
    throw new Error('Updated event title is required.');
  }
  if (update.summary !== undefined && update.summary.length > 100) {
    throw new Error('Updated event title must be at most 100 characters.');
  }
  if (update.description !== undefined && update.description.length > 500) {
    throw new Error('Event description must be at most 500 characters.');
  }
  if (update.location !== undefined && update.location.length > 200) {
    throw new Error('Event location must be at most 200 characters.');
  }
  const startValue = update.start?.dateTime;
  const endValue = update.end?.dateTime;
  const startTimestamp = startValue ? Date.parse(startValue) : undefined;
  const endTimestamp = endValue ? Date.parse(endValue) : undefined;

  if (startTimestamp !== undefined && Number.isNaN(startTimestamp)) {
    throw new Error('Updated event start is invalid.');
  }
  if (endTimestamp !== undefined && Number.isNaN(endTimestamp)) {
    throw new Error('Updated event end is invalid.');
  }
  if (startTimestamp !== undefined && startTimestamp <= Date.now()) {
    throw new Error('Updated event start must be in the future.');
  }
  if (startTimestamp !== undefined && endTimestamp !== undefined && endTimestamp <= startTimestamp) {
    throw new Error('Event end must be after its start.');
  }

  const calendar = await getCalendarClient(sessionId);
  const eventData = { ...event, ...update };
  delete eventData.id;
  delete eventData.eventId;

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: eventData,
  });

  return response.data;
}

export async function deleteEvent(sessionId: string, eventIds: string[]) {
  const uniqueEventIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueEventIds.length === 0) throw new Error('At least one valid event ID is required.');
  if (uniqueEventIds.length > 20) throw new Error('A maximum of 20 events can be deleted at once.');
  const calendar = await getCalendarClient(sessionId);

  for (const eventId of uniqueEventIds) {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }
}

export async function getEventsById(sessionId: string, eventIds: string[]) {
  const calendar = await getCalendarClient(sessionId);
  const events = [];

  for (const eventId of eventIds) {
    const response = await calendar.events.get({ calendarId: 'primary', eventId });
    if (response.data.id) {
      events.push({ id: response.data.id, title: response.data.summary || 'Untitled event' });
    }
  }

  return events;
}
