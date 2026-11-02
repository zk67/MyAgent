'use client';

import { useEffect, useState } from 'react';
import '@/styles/calendar.css';
import { CalendarDay } from './CalendarDay';
import { CalendarModal } from './CalendarModal';
import { getCalendarEvents } from '@/lib/api/calendarClient';
import {
  addDays,
  formatEventTime,
  getEventId,
  getEventsOnDay,
  isSameDay,
  startOfDay,
  startOfWeek,
} from '@/lib/dates';
import { CalendarEvent } from '@/types/types';
import { t, type Locale } from '@/lib/i18n';

type View = 'month' | 'week' | 'day';

type CalendarProps = {
  refreshKey: number;
  locale: Locale;
  onChange: () => void;
  onUnauthorized: () => void;
};

function getPeriod(date: Date, view: View) {
  if (view === 'month') {
    return { start: new Date(date.getFullYear(), date.getMonth(), 1), end: new Date(date.getFullYear(), date.getMonth() + 1, 1) };
  }
  if (view === 'week') {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfDay(date);
  return { start, end: addDays(start, 1) };
}

function getTitle(date: Date, view: View, locale: Locale) {
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-US';
  if (view === 'month') {
    return date.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    const weekStart = startOfWeek(date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
    return locale === 'fr' ? `Semaine du ${weekStart}` : `Week of ${weekStart}`;
  }
  return date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function Calendar({ refreshKey, locale, onChange, onUnauthorized }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekdayKeys: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const viewKeys: Record<View, 'month' | 'week' | 'day'> = { month: 'month', week: 'week', day: 'day' };

  useEffect(() => {
    const { start, end } = getPeriod(currentDate, view);

    getCalendarEvents(start, end)
      .then(setEvents)
      .catch((error) => {
        console.error('Unable to load calendar events', error);
        if (error instanceof Error && error.message.includes('expired')) onUnauthorized();
        setEvents([]);
      });
  }, [refreshKey, currentDate, view, onUnauthorized]);

  function moveDate(direction: 1 | -1) {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else {
      setCurrentDate(addDays(currentDate, direction * (view === 'week' ? 7 : 1)));
    }
  }

  function changeView(nextView: View) {
    setView(nextView);
    if (nextView !== 'month') setCurrentDate(new Date());
  }

  function handleDeleted(deletedEvent: CalendarEvent) {
    const deletedId = getEventId(deletedEvent);
    setEvents((current) => current.filter((event) => getEventId(event) !== deletedId));
    onChange();
  }

  function renderEventButton(event: CalendarEvent) {
    return (
      <button
        type="button"
        className="calendar-event-card calendar-event-card--list"
        key={getEventId(event)}
        onClick={() => setSelectedEvent(event)}
      >
        <span className="event-time">{formatEventTime(event)}</span>
        <span className="event-title">{event.summary || 'Untitled event'}</span>
      </button>
    );
  }

  const today = new Date();
  const { start: periodStart } = getPeriod(currentDate, view);
  const emptyCellsBeforeFirstDay = (periodStart.getDay() + 6) % 7;
  const daysInMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => addDays(periodStart, index));
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(currentDate), index));
  const dayEvents = getEventsOnDay(events, currentDate);
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-US';

  return (
    <div className="panel calendar-window">
      <div className="calendar-header">
        <div className="calendar-title-group">
          <div className="calendar-nav-arrows">
            <button type="button" onClick={() => moveDate(-1)} aria-label="Previous period">‹</button>
            <button type="button" onClick={() => moveDate(1)} aria-label="Next period">›</button>
          </div>
          <h2>{getTitle(currentDate, view, locale)}</h2>
        </div>

        <div className="view-toggle" role="group" aria-label="Calendar view">
          {(['month', 'week', 'day'] as View[]).map((name) => (
            <button
              type="button"
              key={name}
              className={view === name ? 'active' : ''}
              aria-pressed={view === name}
              onClick={() => changeView(name)}
            >
              {t(viewKeys[name], locale)}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <>
          <div className="calendar-weekdays">
            {weekdayKeys.map((key) => <div key={key}>{t(key, locale)}</div>)}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: emptyCellsBeforeFirstDay }, (_, index) => (
              <div className="calendar-day-empty" key={`empty-${index}`} />
            ))}
            {monthDays.map((date) => (
              <CalendarDay
                key={date.toISOString()}
                date={date}
                events={getEventsOnDay(events, date)}
                isToday={isSameDay(date, today)}
                onSelectEvent={setSelectedEvent}
              />
            ))}
          </div>
        </>
      )}

      {view === 'week' && (
        <div className="calendar-week-view">
          {weekDays.map((date) => (
            <div
              className={`calendar-week-column ${isSameDay(date, today) ? 'is-today' : ''}`}
              key={date.toISOString()}
            >
              <div className="calendar-week-day-header">
                <span>{date.toLocaleDateString(dateLocale, { weekday: 'short' })}</span>
                <strong>{date.getDate()}</strong>
              </div>
              <div className="calendar-view-events">{getEventsOnDay(events, date).map(renderEventButton)}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="calendar-day-view">
          <div className="calendar-view-events">
            {dayEvents.map(renderEventButton)}
            {dayEvents.length === 0 && <p className="calendar-empty-message">{t('noEventsToday', locale)}</p>}
          </div>
        </div>
      )}

      {selectedEvent && (
        <CalendarModal
          event={selectedEvent}
          locale={locale}
          onClose={() => setSelectedEvent(null)}
          onDeleted={() => handleDeleted(selectedEvent)}
        />
      )}
    </div>
  );
}
