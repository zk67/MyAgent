'use client';

import { useState } from 'react';
import '@/styles/calendarday.css';
import { formatEventTime } from '@/lib/dates';
import { CalendarEvent } from '@/types/types';

type CalendarDayProps = {
  date: Date;
  events: CalendarEvent[]; // already sorted by start time
  isToday: boolean;
  onSelectEvent: (event: CalendarEvent) => void;
};

export function CalendarDay({ date, events, isToday, onSelectEvent }: CalendarDayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // The day shows one event at a time; the arrows switch between them.
  const safeIndex = Math.min(currentIndex, Math.max(events.length - 1, 0));
  const currentEvent = events[safeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(safeIndex > 0 ? safeIndex - 1 : events.length - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(safeIndex < events.length - 1 ? safeIndex + 1 : 0);
  };

  const classes = ['calendar-day'];
  if (events.length > 0) classes.push('has-events');
  if (isToday) classes.push('is-today');

  return (
    <div className={classes.join(' ')} onClick={() => currentEvent && onSelectEvent(currentEvent)}>
      <div className="day-header">
        <span className="day-number">{date.getDate()}</span>
      </div>

      <div className={`day-events-container ${events.length > 1 ? 'has-multiple-events' : ''}`}>
        {currentEvent && (
          <div className="calendar-event-card calendar-event-card--month">
            <span className="event-time">{formatEventTime(currentEvent)}</span>
            <span className="event-title">{currentEvent.summary || 'Untitled event'}</span>
            {events.length > 1 && (
              <div className="event-nav-arrows" aria-label="Navigate between events">
                <button type="button" onClick={handlePrev} aria-label="Previous event">
                  ‹
                </button>
                <span>{safeIndex + 1} / {events.length}</span>
                <button type="button" onClick={handleNext} aria-label="Next event">
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
