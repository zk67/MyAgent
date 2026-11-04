'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '@/styles/calendar.css';
import { CalendarModal } from './CalendarModal';
import { CalendarEvent } from '@/types/types';
import { getCalendarEvents } from '@/lib/api/calendarClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

type CalendarProps = {
  refreshKey: number;
  createdEvent?: CalendarEvent;
  onUnauthorized?: () => void;
  onEventsChanged?: (change: { type: 'created' | 'deleted'; event: CalendarEvent }) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

const HOUR_HEIGHT = 64;
const DISPLAY_START_HOUR = 6;
const DISPLAY_HOURS = 18;
const EVENT_COLORS = ['violet', 'blue', 'green', 'coral'];

export function Calendar({ refreshKey, createdEvent, onUnauthorized, onEventsChanged, selectedDate, onSelectedDateChange }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const periodStart = new Date(selectedDate);
    periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 6) % 7));
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 7);

    getCalendarEvents(periodStart, periodEnd)
      .then((calendarEvents) => setEvents(calendarEvents))
      .catch((error) => {
        if (error instanceof Error && error.message.includes('expired')) {
          onUnauthorized?.();
        }
        console.error('Unable to load calendar events', error);
        setEvents([]);
      });
  }, [refreshKey, selectedDate, onUnauthorized]);

  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, []);

  const displayedEvents = createdEvent
    ? events.some((event) => (event.id || event.eventId) === (createdEvent.id || createdEvent.eventId))
      ? events
      : [...events, createdEvent]
    : events;

  function moveDate(direction: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + direction * 7);
    onSelectedDateChange(nextDate);
  }

  function getEventDate(event: CalendarEvent): Date | null {
    const value = event.start.dateTime || event.start.date;
    if (!value) return null;
    const date = new Date(event.start.dateTime || `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function eventsForDate(date: Date): CalendarEvent[] {
    return displayedEvents.filter((event) => {

      const eventDate = getEventDate(event);
      return eventDate !== null 
        && eventDate.getFullYear() === date.getFullYear()
        && eventDate.getMonth() === date.getMonth()
        && eventDate.getDate() === date.getDate();
    }).sort((first, second) => {
      const firstDate = getEventDate(first)?.getTime() || 0;
      const secondDate = getEventDate(second)?.getTime() || 0;
      return firstDate - secondDate;
    });
  }

  function formatEventTime(event: CalendarEvent): string {
    if (event.start.date) return 'All day';

    const date = getEventDate(event);
    return date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  }

  function handleEventChanged(change: { type: 'created' | 'deleted'; event: CalendarEvent }) {
    const changedId = change.event.id || change.event.eventId;

    if (!changedId) {
      return;
    }

    setEvents((currentEvents) => {
      if (change.type === 'created') {
        return changedId && currentEvents.some((event) => (event.id || event.eventId) === changedId)
          ? currentEvents
          : [...currentEvents, change.event];
      }

      return currentEvents.filter((event) => {
        const eventId = event.id || event.eventId;
        return eventId !== changedId;
      });
    });
    onEventsChanged?.(change);
  }

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });
  
  const hours = Array.from({ length: DISPLAY_HOURS }, (_, index) => index + DISPLAY_START_HOUR);

  function laidOutEvents(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(DISPLAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setHours(0, 0, 0, 0);
    const timed = eventsForDate(date).filter((event) => {
      if (!event.start.dateTime) return false;
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + 3_600_000);
      return end > dayStart && start < dayEnd;
    });
    return timed.map((event, index) => {

      const start = new Date(event.start.dateTime!);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + HOUR_HEIGHT * 60_000);

      const overlapping = timed.filter((candidate) => {
        if (!candidate.start.dateTime) return false;
        const candidateStart = new Date(candidate.start.dateTime);
        const candidateEnd = candidate.end.dateTime ? new Date(candidate.end.dateTime) : new Date(candidateStart.getTime() + 3_600_000);
        return candidateStart < end && candidateEnd > start;
      });
      
      const slot = overlapping.findIndex((candidate) => candidate === event);
      const visibleStart = start < dayStart ? dayStart : start;
      const visibleEnd = end > dayEnd ? dayEnd : end;
      return { event, top: ((visibleStart.getHours() + visibleStart.getMinutes() / 60) - DISPLAY_START_HOUR) * HOUR_HEIGHT, height: Math.max(30, (visibleEnd.getTime() - visibleStart.getTime()) / 3_600_000 * HOUR_HEIGHT), width: 100 / overlapping.length, left: (Math.max(0, slot) * 100) / overlapping.length, color: EVENT_COLORS[index % EVENT_COLORS.length] };
    });
  }

  return (
    <div className="panel calendar-window week-calendar">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>{startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        </div>

        <div className="week-actions">
          <button onClick={() => onSelectedDateChange(new Date())}>Back to today</button>
          <div className="calendar-nav-arrows"><button onClick={() => moveDate(-1)} aria-label="Previous week"><ChevronLeft size={16} /></button><button onClick={() => moveDate(1)} aria-label="Next week"><ChevronRight size={16} /></button></div>
        </div>
      </div>

      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline-header"><div className="timezone">GMT {new Date().getTimezoneOffset() <= 0 ? '+' : '-'}{Math.abs(new Date().getTimezoneOffset() / 60)}</div>{weekDays.map((date) => <button key={date.toISOString()} className={date.toDateString() === new Date().toDateString() ? 'is-today' : ''} onClick={() => onSelectedDateChange(date)}><span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>{date.getDate()}</strong></button>)}</div>
        <motion.div key={startOfWeek.toISOString()} className="timeline-canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: DISPLAY_HOURS * HOUR_HEIGHT }}>
          <div className="time-axis">{hours.map((hour, index) => index === 0 ? null : <span key={hour} style={{ top: index * HOUR_HEIGHT }}>{new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric' })}</span>)}</div>
          <div className="day-columns">{weekDays.map((date) => <div className={`timeline-day ${date.toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={date.toISOString()}>{hours.map((hour, index) => <i className="hour-line" style={{ top: index * HOUR_HEIGHT }} key={hour} />)}{laidOutEvents(date).map(({ event, top, height, width, left, color }) => <motion.button whileHover={{ scale: 1.025, zIndex: 4 }} whileTap={{ scale: 0.985 }} type="button" className={`timeline-event ${color}`} key={event.id || event.eventId || `${event.summary}-${top}`} style={{ top, height, width: `calc(${width}% - 4px)`, left: `${left}%` }} onClick={() => setSelectedEvent(event)}><strong>{event.summary || 'Untitled event'}</strong><span>{formatEventTime(event)}{event.end.dateTime ? ` – ${new Date(event.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}</span></motion.button>)}</div>)}</div>
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
