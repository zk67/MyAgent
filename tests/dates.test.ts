import { describe, it, expect } from 'vitest';
import {
  getEventId,
  getEventStart,
  startOfDay,
  startOfWeek,
  addDays,
  isSameDay,
  formatTime,
  formatEventTime,
  getEventsOnDay,
} from '@/lib/dates';
import type { CalendarEvent } from '@/types/types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'evt-1',
    summary: 'Test event',
    start: { dateTime: '2025-03-15T10:00:00-04:00' },
    end: { dateTime: '2025-03-15T11:00:00-04:00' },
    ...overrides,
  } as CalendarEvent;
}

describe('getEventId', () => {
  it('returns id when present', () => {
    expect(getEventId(makeEvent({ id: 'abc' }))).toBe('abc');
  });

  it('falls back to eventId', () => {
    expect(getEventId(makeEvent({ id: undefined, eventId: 'xyz' } as unknown as Partial<CalendarEvent>))).toBe('xyz');
  });
});

describe('getEventStart', () => {
  it('parses dateTime', () => {
    const start = getEventStart(makeEvent());
    expect(start).toBeInstanceOf(Date);
    expect(start!.getHours()).toBeGreaterThanOrEqual(0);
  });

  it('parses all-day date', () => {
    const start = getEventStart(makeEvent({ start: { date: '2025-03-15' } }));
    expect(start).toBeInstanceOf(Date);
  });

  it('returns null for empty start', () => {
    const start = getEventStart(makeEvent({ start: {} }));
    expect(start).toBeNull();
  });
});

describe('startOfDay', () => {
  it('resets time to midnight', () => {
    const result = startOfDay(new Date(2025, 2, 15, 14, 30));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('startOfWeek', () => {
  it('returns Monday for a Wednesday', () => {
    // March 12, 2025 is a Wednesday
    const result = startOfWeek(new Date(2025, 2, 12));
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(10);
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    const base = new Date(2025, 0, 1);
    const result = addDays(base, 5);
    expect(result.getDate()).toBe(6);
  });

  it('subtracts with negative days', () => {
    const base = new Date(2025, 0, 10);
    const result = addDays(base, -3);
    expect(result.getDate()).toBe(7);
  });
});

describe('isSameDay', () => {
  it('returns true for same day different times', () => {
    const a = new Date(2025, 2, 15, 10, 0);
    const b = new Date(2025, 2, 15, 23, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for different days', () => {
    const a = new Date(2025, 2, 15);
    const b = new Date(2025, 2, 16);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe('formatTime', () => {
  it('formats a date as HH:mm', () => {
    const result = formatTime(new Date(2025, 2, 15, 14, 30));
    expect(result).toMatch(/14:30/);
  });
});

describe('formatEventTime', () => {
  it('returns "All day" for all-day events', () => {
    const event = makeEvent({ start: { date: '2025-03-15' } });
    expect(formatEventTime(event)).toBe('All day');
  });

  it('returns formatted time for timed events', () => {
    const result = formatEventTime(makeEvent());
    expect(result).toBeTruthy();
  });
});

describe('getEventsOnDay', () => {
  it('filters and sorts events by day', () => {
    const events = [
      makeEvent({ id: '1', start: { dateTime: '2025-03-15T14:00:00' }, summary: 'Afternoon' }),
      makeEvent({ id: '2', start: { dateTime: '2025-03-15T09:00:00' }, summary: 'Morning' }),
      makeEvent({ id: '3', start: { dateTime: '2025-03-16T10:00:00' }, summary: 'Next day' }),
    ];

    const day = new Date(2025, 2, 15);
    const result = getEventsOnDay(events, day);

    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe('Morning');
    expect(result[1].summary).toBe('Afternoon');
  });
});
