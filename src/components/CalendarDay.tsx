'use client';

import { useState } from 'react';
import "@/styles/calendarday.css";
import { CalendarEvent } from "@/types/types";

type CalendarDayProps = {
  day: number | null;
  events: CalendarEvent[];
  isToday: boolean;
};

export function CalendarDay({ day, events, isToday }: CalendarDayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!day) {
    return <div className="calendar-day-empty" />;
  }

  // Trie les événements par heure pour que le premier de la journée s'affiche en premier
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.start?.dateTime ?? a.start?.date ?? '';
    const timeB = b.start?.dateTime ?? b.start?.date ?? '';
    return timeA.localeCompare(timeB);
  });

  const formatTime = (dateTimeStr?: string, dateStr?: string) => {
    if (dateStr) return 'Toute la journée';
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedEvents.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < sortedEvents.length - 1 ? prev + 1 : 0));
  };

  const classes = ['calendar-day'];
  if (sortedEvents.length > 0) classes.push('has-events');
  if (isToday) classes.push('is-today');

  const currentEvent = sortedEvents[currentIndex];

  return (
    <div className={classes.join(' ')}>
      <div className="day-header">
        <span className="day-number">{day}</span>

        {sortedEvents.length > 0 && (
          <span className="event-count-badge">{sortedEvents.length}</span>
        )}
      </div>

      <div className="day-events-container">
        {sortedEvents.length > 0 && currentEvent && (
          <div className="calendar-event-card">
            <span className="event-time">
              {formatTime(currentEvent.start?.dateTime, currentEvent.start?.date)}
            </span>
            <span className="event-title">
              {currentEvent.summary}
            </span>
          </div>
        )}

        {sortedEvents.length > 1 && (
          <div className="event-nav-arrows">
            <button type="button" onClick={handlePrev} aria-label="Précédent">
              ‹
            </button>
            <button type="button" onClick={handleNext} aria-label="Suivant">
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}