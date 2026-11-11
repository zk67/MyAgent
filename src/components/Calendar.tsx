'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '@/styles/calendar.css';
import { CalendarModal } from './CalendarModal';
import { CalendarEvent } from '@/types/types';
import { getCalendarEvents } from '@/lib/api/calendarClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

type CalendarChange = { type: 'created' | 'deleted'; event: CalendarEvent };

type CalendarProps = {
  refreshKey: number;
  createdEvent?: CalendarEvent;
  onUnauthorized?: () => void;
  onEventsChanged?: (change: CalendarChange) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

// An event with its position in the grid.
type PlacedEvent = {
  event: CalendarEvent;
  top: number;
  height: number;
  width: number;
  left: number;
  color: string;
};

const HOUR_HEIGHT = 64; // pixels for one hour
const DISPLAY_START_HOUR = 6; // the grid starts at 6 AM...
const DISPLAY_HOURS = 18; // ...and ends at midnight
const ONE_HOUR_MS = 3_600_000;
const MIN_EVENT_HEIGHT = 30;
const COMPACT_EVENT_HEIGHT = 48; // below this, an event only shows its title
const EVENT_COLORS = ['violet', 'blue', 'green', 'coral'];

// ---------- Date helpers ----------

function getMonday(date: Date) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function getTimezoneLabel() {
  const offset = new Date().getTimezoneOffset() / 60;
  return `GMT ${offset <= 0 ? '+' : '-'}${Math.abs(offset)}`;
}

function formatHourLabel(hour: number) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric' });
}

// ---------- Event helpers ----------

function getEventId(event: CalendarEvent) {
  return event.id || event.eventId;
}

function getEventStart(event: CalendarEvent): Date | null {
  const value = event.start.dateTime || event.start.date;
  if (!value) return null;

  // All-day events only have a date: they start at midnight.
  const date = new Date(event.start.dateTime || `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Events without an end time last one hour.
function getEventEnd(event: CalendarEvent, start: Date) {
  return event.end.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + ONE_HOUR_MS);
}

function formatEventTime(event: CalendarEvent) {
  if (event.start.date) return 'All day';

  const start = getEventStart(event);
  if (!start) return '';

  const startText = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (!event.end.dateTime) return startText;

  const endText = new Date(event.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${startText} – ${endText}`;
}

// The events of one day, sorted by start time.
function getEventsForDay(events: CalendarEvent[], date: Date) {
  return events
    .filter((event) => {
      const start = getEventStart(event);
      return start !== null && isSameDay(start, date);
    })
    .sort((first, second) => (getEventStart(first)?.getTime() ?? 0) - (getEventStart(second)?.getTime() ?? 0));
}

// ---------- Grid layout ----------

// Computes where each event of a day is drawn.
// Events that overlap share the width of the day column.
function placeEventsForDay(dayEvents: CalendarEvent[], date: Date): PlacedEvent[] {
  const gridStart = new Date(date);
  gridStart.setHours(DISPLAY_START_HOUR, 0, 0, 0);
  const gridEnd = addDays(date, 1);
  gridEnd.setHours(0, 0, 0, 0);

  // Keep the timed events that are visible between 6 AM and midnight.
  const timedEvents: { event: CalendarEvent; start: Date; end: Date }[] = [];
  for (const event of dayEvents) {
    if (!event.start.dateTime) continue; // all-day events are not drawn in the grid

    const start = new Date(event.start.dateTime);
    const end = getEventEnd(event, start);
    if (end > gridStart && start < gridEnd) timedEvents.push({ event, start, end });
  }

  return timedEvents.map(({ event, start, end }, index) => {
    const overlapping = timedEvents.filter((other) => other.start < end && other.end > start);
    const slot = overlapping.findIndex((other) => other.event === event);

    // Cut the parts before 6 AM or after midnight.
    const visibleStart = start < gridStart ? gridStart : start;
    const visibleEnd = end > gridEnd ? gridEnd : end;
    const hoursFromGridStart = visibleStart.getHours() + visibleStart.getMinutes() / 60 - DISPLAY_START_HOUR;
    const durationInHours = (visibleEnd.getTime() - visibleStart.getTime()) / ONE_HOUR_MS;

    return {
      event,
      top: hoursFromGridStart * HOUR_HEIGHT,
      height: Math.max(MIN_EVENT_HEIGHT, durationInHours * HOUR_HEIGHT),
      width: 100 / overlapping.length,
      left: (slot * 100) / overlapping.length,
      color: EVENT_COLORS[index % EVENT_COLORS.length],
    };
  });
}

// One event drawn in the grid. A 1px gap keeps neighbouring events from touching.
function EventBlock({ placed, onSelect }: { placed: PlacedEvent; onSelect: () => void }) {
  const { event, top, height, width, left, color } = placed;
  const title = event.summary || 'Untitled event';
  const isCompact = height < COMPACT_EVENT_HEIGHT;

  return (
    <motion.button
      type="button"
      className={`timeline-event ${color}${isCompact ? ' is-compact' : ''}`}
      title={title}
      style={{ top: top + 1, height: height - 2, width: `calc(${width}% - 2px)`, left: `calc(${left}% + 1px)` }}
      whileHover={{ scale: 1.025, zIndex: 4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
    >
      <strong>{title}</strong>
      {!isCompact && <span>{formatEventTime(event)}</span>}
    </motion.button>
  );
}

// ---------- Calendar ----------

export function Calendar({ refreshKey, createdEvent, onUnauthorized, onEventsChanged, selectedDate, onSelectedDateChange }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the events of the selected week.
  useEffect(() => {
    const monday = getMonday(selectedDate);

    getCalendarEvents(monday, addDays(monday, 7))
      .then((calendarEvents) => setEvents(calendarEvents))
      .catch((error) => {
        if (error instanceof Error && error.message.includes('expired')) {
          onUnauthorized?.();
        }
        console.error('Unable to load calendar events', error);
        setEvents([]);
      });
  }, [refreshKey, selectedDate, onUnauthorized]);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // An event that was just created may not be loaded yet: show it right away.
  const createdEventIsMissing = createdEvent && !events.some((event) => getEventId(event) === getEventId(createdEvent));
  const displayedEvents = createdEvent && createdEventIsMissing ? [...events, createdEvent] : events;

  const weekStart = getMonday(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: DISPLAY_HOURS }, (_, index) => DISPLAY_START_HOUR + index);
  const today = new Date();

  function moveWeek(direction: number) {
    onSelectedDateChange(addDays(selectedDate, direction * 7));
  }

  function handleEventChanged(change: CalendarChange) {
    const changedId = getEventId(change.event);
    if (!changedId) return;

    setEvents((currentEvents) => {
      if (change.type === 'created') {
        const alreadyShown = currentEvents.some((event) => getEventId(event) === changedId);
        return alreadyShown ? currentEvents : [...currentEvents, change.event];
      }
      return currentEvents.filter((event) => getEventId(event) !== changedId);
    });
    onEventsChanged?.(change);
  }

  return (
    <div className="panel calendar-window week-calendar">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>{weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        </div>

        <div className="week-actions">
          <button onClick={() => onSelectedDateChange(new Date())}>Back to today</button>
          <div className="calendar-nav-arrows">
            <button onClick={() => moveWeek(-1)} aria-label="Previous week"><ChevronLeft size={16} /></button>
            <button onClick={() => moveWeek(1)} aria-label="Next week"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="timeline-scroll" ref={scrollRef}>
        {/* Day names across the top */}
        <div className="timeline-header">
          <div className="timezone">{getTimezoneLabel()}</div>
          {weekDays.map((date) => (
            <button
              key={date.toISOString()}
              className={isSameDay(date, today) ? 'is-today' : ''}
              onClick={() => onSelectedDateChange(date)}
            >
              <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <strong>{date.getDate()}</strong>
            </button>
          ))}
        </div>

        <motion.div
          key={weekStart.toISOString()}
          className="timeline-canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ height: DISPLAY_HOURS * HOUR_HEIGHT }}
        >
          {/* Hour labels on the left (the first one is hidden) */}
          <div className="time-axis">
            {hours.map((hour, index) => index > 0 && (
              <span key={hour} style={{ top: index * HOUR_HEIGHT }}>{formatHourLabel(hour)}</span>
            ))}
          </div>

          {/* One column per day, with its hour lines and events */}
          <div className="day-columns">
            {weekDays.map((date) => (
              <div key={date.toISOString()} className={`timeline-day ${isSameDay(date, today) ? 'is-today' : ''}`}>
                {hours.map((hour, index) => (
                  <i key={hour} className="hour-line" style={{ top: index * HOUR_HEIGHT }} />
                ))}

                {placeEventsForDay(getEventsForDay(displayedEvents, date), date).map((placed) => (
                  <EventBlock
                    key={getEventId(placed.event) || `${placed.event.summary}-${placed.top}`}
                    placed={placed}
                    onSelect={() => setSelectedEvent(placed.event)}
                  />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {selectedEvent && (
        <CalendarModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDeleted={() => handleEventChanged({ type: 'deleted', event: selectedEvent })}
        />
      )}
    </div>
  );
}
