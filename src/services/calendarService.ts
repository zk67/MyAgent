import { createOAuth2client } from '@/lib/google/auth';
import { CalendarEvent, CalendarTokens } from '@/types/types';
import { google } from 'googleapis';

const sessions = new Map<string, CalendarTokens>();

export function saveTokens(sessionId: string, tokens: CalendarTokens) {
  sessions.set(sessionId, tokens);
}

export function getTokens(sessionId: string) {
  return sessions.get(sessionId);
}

export function deleteTokens(sessionId: string) {
  sessions.delete(sessionId);
}

export function getCalendarClient(sessionId: string) {
  const tokens = getTokens(sessionId);

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
    saveTokens(sessionId, {
      accessToken: refreshedTokens.access_token || tokens.accessToken,
      refreshToken: refreshedTokens.refresh_token || tokens.refreshToken,
      expiresAt: refreshedTokens.expiry_date || tokens.expiresAt,
    });
  });

  return google.calendar({ version: 'v3', auth: authClient });
}

export async function getGoogleUserProfile(sessionId: string) {
  const tokens = getTokens(sessionId);

  if (!tokens) {
    throw new Error('No tokens found for the given session ID.');
  }

  const authClient = createOAuth2client();
  authClient.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt,
  });

  const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
  const response = await oauth2.userinfo.get();
  return response.data;
}

function addOneHour(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const nextHour = (hours + 1) % 24;
  return `${nextHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export async function newEvent(
  sessionId: string,
  title: string,
  startTime: string,
  startDate: string,
  description?: string,
  endTime?: string,
  reminder?: number
) {
  
  const calendar = getCalendarClient(sessionId);
  const eventEndTime = endTime || addOneHour(startTime);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description: description || '',
      start: {
        dateTime: `${startDate}T${startTime}:00`,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: `${startDate}T${eventEndTime}:00`,
        timeZone: 'America/Toronto',
      },
      reminders: reminder
        ? {
            useDefault: false,
            overrides: [{ method: 'email', minutes: reminder }],
          }
        : undefined,
    },
  });

  return response.data;
}

export async function getEvents(sessionId: string, timeMin: string, timeMax: string) {
  const calendar = getCalendarClient(sessionId);
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
  const calendar = getCalendarClient(sessionId);
  const { eventId, ...eventData } = { ...event, ...update };

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: eventData,
  });

  return response.data;
}

export async function deleteEvent(sessionId: string, eventIds: string[]) {
  const calendar = getCalendarClient(sessionId);

  for (const eventId of eventIds) {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }
}
