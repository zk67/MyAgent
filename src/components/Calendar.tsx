'use client';

import { useEffect, useState } from 'react';
import "@/styles/calendar.css";
import { CalendarDay } from './CalendarDay'; 
import { CalendarModal } from './CalendarModal';
import { CalendarEvent } from "@/types/types";

type CalendarProps = {
  refreshKey: number;
  onUnauthorized?: () => void;
};

export function Calendar({ refreshKey, onUnauthorized }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Récupère les événements du mois affiché à chaque fois qu'on change de mois
  // ou qu'un événement vient d'être créé (refreshKey change)
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const query = `year=${year}&month=${month}`;

    fetch(`/api/calendar?${query}`, { cache: 'no-store' })
      .then((response) => {
        if (response.status === 401) {
          onUnauthorized?.();
          return null;
        }
        if (!response.ok) {
          throw new Error(`Calendar request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return;
        setEvents(data.events || []);
      })
      .catch((error) => {
        console.error('Unable to load calendar events', error);
        setEvents([]);
      });
  }, [refreshKey, currentDate, view, onUnauthorized]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Étape 1 : calculer combien de cases vides mettre avant le jour 1 ---
  // getDay() renvoie 0 pour Dimanche, 1 pour Lundi, etc.
  // Comme notre semaine commence un Lundi, on doit décaler ce chiffre.
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  let emptyCellsBeforeFirstDay: number;
  if (firstDayOfMonth === 0) {
    // Le mois commence un Dimanche → il faut 6 cases vides avant (Lun à Sam)
    emptyCellsBeforeFirstDay = 6;
  } else {
    // Sinon, le nombre de cases vides = position du jour - 1
    emptyCellsBeforeFirstDay = firstDayOfMonth - 1;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // --- Étape 2 : construire la liste complète des cases à afficher ---
  // On met "null" pour les cases vides, et le numéro du jour pour les vraies cases
  const days: (number | null)[] = [];

  for (let i = 0; i < emptyCellsBeforeFirstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // --- Nom du mois affiché en haut, ex: "Octobre 2026" ---
  const monthNameRaw = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const firstLetter = monthNameRaw.charAt(0).toUpperCase();
  const restOfName = monthNameRaw.slice(1);
  const monthName = firstLetter + restOfName;

  function previousMonth() {
    moveDate(-1);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function moveDate(direction: number) {
    const nextDate = new Date(currentDate);
    if (view === 'month') {
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + direction);
    }
    if (view === 'week') nextDate.setDate(nextDate.getDate() + direction * 7);
    if (view === 'day') nextDate.setDate(nextDate.getDate() + direction);

    if (direction < 0) {
      const firstOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      firstOfCurrentMonth.setHours(0, 0, 0, 0);

      if (view === 'month' && nextDate < firstOfCurrentMonth) return;
      if (view !== 'month' && nextDate < firstOfCurrentMonth) {
        nextDate.setTime(firstOfCurrentMonth.getTime());
      }
    }

    setCurrentDate(nextDate);
  }

  function getPeriodStart(date: Date, period: 'month' | 'week' | 'day' = view): Date {
    const periodStart = new Date(date);

    if (period === 'month') {
      periodStart.setDate(1);
    } else if (period === 'week') {
      periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 6) % 7));
    }

    periodStart.setHours(0, 0, 0, 0);
    return periodStart;
  }

  const firstOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  firstOfCurrentMonth.setHours(0, 0, 0, 0);
  const isAtEarliestPeriod = view === 'month'
    ? getPeriodStart(currentDate, view).getTime() <= firstOfCurrentMonth.getTime()
    : currentDate.getTime() <= firstOfCurrentMonth.getTime();

  // Trouve tous les événements qui tombent sur un jour précis du mois affiché
  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      let eventDate: Date | null = null;

      if (event.start.dateTime) {
        // Événement avec une heure précise (ex: réunion à 14h)
        eventDate = new Date(event.start.dateTime);
      } else if (event.start.date) {
        // Événement "journée entière" (juste une date, pas d'heure)
        eventDate = new Date(`${event.start.date}T00:00:00`);
      }

      if (!eventDate) return false;
      if (Number.isNaN(eventDate.getTime())) return false;

      const sameYear = eventDate.getFullYear() === year;
      const sameMonth = eventDate.getMonth() === month;
      const sameDay = eventDate.getDate() === day;

      return sameYear && sameMonth && sameDay;
    });
  }

  // Vérifie si un jour donné du mois affiché correspond à la date d'aujourd'hui
  function checkIsToday(day: number): boolean {
    const today = new Date();

    const sameYear = today.getFullYear() === year;
    const sameMonth = today.getMonth() === month;
    const sameDay = today.getDate() === day;

    return sameYear && sameMonth && sameDay;
  }

  function getEventDate(event: CalendarEvent): Date | null {
    const value = event.start.dateTime || event.start.date;
    if (!value) return null;
    const date = new Date(event.start.dateTime || `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function eventsForDate(date: Date): CalendarEvent[] {
    return events.filter((event) => {
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

  function changeView(nextView: 'month' | 'week' | 'day') {
    setView(nextView);
    if (nextView === 'week' || nextView === 'day') {
      setCurrentDate(new Date());
    }
  }

  function renderEvent(event: CalendarEvent) {
    return (
      <button
        type="button"
        className="calendar-event-card calendar-event-card--list"
        key={event.id || event.eventId || `${event.summary}-${formatEventTime(event)}`}
        onClick={() => setSelectedEvent(event)}
      >
        <span className="event-time">{formatEventTime(event)}</span>
        <span className="event-title">{event.summary || 'Untitled event'}</span>
      </button>
    );
  }

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });
  const title = view === 'month'
    ? monthName
    : view === 'week'
      ? `Week of ${startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
      : currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="panel calendar-window">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="calendar-nav-arrows">
            <button
              onClick={() => view === 'month' ? previousMonth() : moveDate(-1)}
              aria-label="Previous period"
              disabled={isAtEarliestPeriod}
            >
              ‹
            </button>
            <button onClick={() => view === 'month' ? nextMonth() : moveDate(1)} aria-label="Next period">›</button>
          </div>
          <h2>{title}</h2>
        </div>

        <div className="view-toggle">
          <button className={view === 'month' ? 'active' : ''} onClick={() => changeView('month')}>Month</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => changeView('week')}>Week</button>
          <button className={view === 'day' ? 'active' : ''} onClick={() => changeView('day')}>Day</button>
        </div>
      </div>

      {view === 'month' && <>
        <div className="calendar-weekdays">
          <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
        </div>
        <div className="calendar-grid">
          {days.map((day, index) => day === null ? (
            <div className="calendar-day-empty" key={`empty-${index}`} />
          ) : (
            <CalendarDay
              key={`${year}-${month}-${day}`}
              day={day}
              events={getEventsForDay(day)}
              isToday={checkIsToday(day)}
            />
          ))}
        </div>
      </>}

      {view === 'week' && <div className="calendar-week-view">
        {weekDays.map((date) => (
          <div className={`calendar-week-column ${date.toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={date.toISOString()}>
            <div className="calendar-week-day-header">
              <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <strong>{date.getDate()}</strong>
            </div>
            <div className="calendar-view-events">{eventsForDate(date).map(renderEvent)}</div>
          </div>
        ))}
      </div>}

      {view === 'day' && <div className="calendar-day-view">
        <div className="calendar-day-view-header">{currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="calendar-view-events">
          {eventsForDate(currentDate).map(renderEvent)}
          {eventsForDate(currentDate).length === 0 && <p className="calendar-empty-message">No events scheduled.</p>}
        </div>
      </div>}

      {selectedEvent && (
        <CalendarModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}