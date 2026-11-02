import type { CalendarEvent } from '@/types/types';

// ---- Dates ----

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// The week starts on Monday (getDay(): Sunday = 0, Monday = 1, ...).
export function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -daysSinceMonday);
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ---- Events ----

export function getEventId(event: CalendarEvent): string {
  return event.id ?? event.eventId ?? '';
}

// Timed events have `start.dateTime`, all-day events only have `start.date`.
export function getEventStart(event: CalendarEvent): Date | null {
  if (event.start.dateTime) return new Date(event.start.dateTime);

  if (event.start.date) {
    const [year, month, day] = event.start.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return null;
}

export function formatEventTime(event: CalendarEvent): string {
  const start = getEventStart(event);
  if (!start || !event.start.dateTime) return 'All day';
  return formatTime(start);
}

// Events starting on `day`, earliest first.
export function getEventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .map((event) => ({ event, start: getEventStart(event) }))
    .filter(({ start }) => start !== null && isSameDay(start, day))
    .sort((a, b) => a.start!.getTime() - b.start!.getTime())
    .map(({ event }) => event);
}
