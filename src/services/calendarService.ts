import { CalendarTokens } from '@/types/types';
import { google } from 'googleapis';
import {createOAuth2client} from '@/lib/google/auth';
import { CalendarEvent } from '@/types/types';

//map to save tokens in memory for the session
const sessions = new Map<string, CalendarTokens>();

//tokens functions
export function saveTokens(sessionId: string, tokens: CalendarTokens) {
  sessions.set(sessionId, tokens);
}

export function getTokens(sessionId: string) {
  return sessions.get(sessionId);
}

export function deleteTokens(sessionId: string) {
  sessions.delete(sessionId);
}

//get the calendar client for the given session ID
export function getCalendarClient(sessionId: string) {

  const tokens = getTokens(sessionId);
  if (!tokens) {
    throw new Error('No tokens found for the given session ID.');
  }

  const authClient = createOAuth2client();
  authClient.setCredentials( {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt,
  });
  const calendar = google.calendar({ version: 'v3', auth: authClient });
  return calendar;
}

function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

//get the calendar events for the given session ID
export async function newEvent(
  sessionId: string,
  title: string,
  startTime: string, 
  startDate: string, 

  description?: string,
  endTime?: string, 
  reminder?: number) {

  const calendar = getCalendarClient(sessionId);

  if (!endTime) {
    endTime = addOneHour(startTime);
  }
  if (!description) {
    description = '';
  }

  const response  = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description: description,
      start: { 
        dateTime: `${startDate}T${startTime}:00`,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: `${startDate}T${endTime}:00`,
        timeZone: 'America/Toronto',
      },
      reminders: reminder ? {
        useDefault: false,
        overrides: [
          {
            method: 'email',
            minutes: reminder
          }
        ]
      } : undefined,
    }
  });

  return response.data;
}

//get the calendar events for the given session ID, and for the given date range
export async function getEvents(sessionId: string, timeMin: string, timeMax: string) {
  const calendar = getCalendarClient(sessionId);

  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
  });

  return events.data;
}

//update an event for the given session ID, takes the event object and a partial event object with the fields to update
export async function updateEvent(sessionId: string, event: CalendarEvent, update: Partial<CalendarEvent>) {
  const calendar = getCalendarClient(sessionId);

  const { eventId, ...eventData } = {
  ...event,
  ...update,
  };
    
  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: eventData,
  });
  return response.data;
}

//could use await Promise.all(eventIds.map(id => deleteEvent(sessionId, id))) when calling this function to delete multiple events in parallel
//just make sure to remove the for loop in the function
export async function deleteEvent(sessionId: string, eventId: string[]) {
  const calendar = getCalendarClient(sessionId);
  for (const id of eventId) {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: id,
    });
  }
}




