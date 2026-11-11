'use client';

import { CalendarEvent } from '@/types/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import '@/styles/schedule-sidebar.css';

type Props = {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onCreate: () => void;
};

const COLORS = ['var(--event-lapis-ink)', 'var(--event-verdigris-ink)', 'var(--event-ochre-ink)', 'var(--event-madder-ink)'];
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_START_HOUR = 6; // free time is counted from 6 AM to midnight
const HOURS_PER_WEEK = 18 * 7;
const ONE_HOUR_MS = 3_600_000;

// ---------- Helpers ----------

function getEventStart(event: CalendarEvent) {
  const value = event.start.dateTime || event.start.date;
  return value ? new Date(event.start.dateTime || `${value}T00:00:00`) : null;
}

// Hours an event takes between 6 AM and midnight on its start day.
function getEventHours(event: CalendarEvent) {
  if (!event.start.dateTime || !event.end.dateTime) return 0;

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  const dayStart = new Date(start);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(start);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setHours(0, 0, 0, 0);

  const visibleStart = start < dayStart ? dayStart : start;
  const visibleEnd = end > dayEnd ? dayEnd : end;
  return Math.max(0, (visibleEnd.getTime() - visibleStart.getTime()) / ONE_HOUR_MS);
}

function getMonday(date: Date) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// The 42 days (6 weeks) shown in the mini calendar, starting on a Monday.
function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = getMonday(firstOfMonth);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

// Future events shown in the "Upcoming" list, soonest first.
// Events created with "show in upcoming" turned off are hidden.
function getUpcomingEvents(events: CalendarEvent[], now: Date) {
  const upcoming: { event: CalendarEvent; start: Date }[] = [];

  for (const event of events) {
    const start = getEventStart(event);
    const isHidden = event.extendedProperties?.private?.myAgentShowInUpcoming === 'false';
    if (start && start >= now && !isHidden) upcoming.push({ event, start });
  }

  return upcoming.sort((first, second) => first.start.getTime() - second.start.getTime());
}

function formatUpcomingDate(event: CalendarEvent, start: Date) {
  const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = event.start.date ? 'all day' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}

// ---------- Sidebar ----------

export function ScheduleSidebar({ selectedDate, events, onSelectDate, onCreate }: Props) {
  const now = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthDays = getMonthGrid(year, month);
  const upcoming = getUpcomingEvents(events, now);

  // Weekly breakdown: busy hours vs free hours in the selected week.
  const weekStart = getMonday(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekEvents = events.filter((event) => {
    const start = getEventStart(event);
    return start && start >= weekStart && start < weekEnd;
  });

  let busyHours = 0;
  for (const event of weekEvents) busyHours += getEventHours(event);

  const freeHours = Math.max(0, HOURS_PER_WEEK - busyHours);
  const busyPercent = Math.min(100, (busyHours / HOURS_PER_WEEK) * 100);

  function moveMonth(amount: number) {
    onSelectDate(new Date(year, month + amount, 1));
  }

  return (
    <aside className="schedule-sidebar">
      <section className="mini-calendar side-card">
        <div className="side-card-heading">
          <h2>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div className="side-card-arrows">
            <button type="button" className="icon-button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={15} /></button>
            <button type="button" className="icon-button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={15} /></button>
          </div>
        </div>

        <div className="mini-weekdays">
          {WEEKDAY_LETTERS.map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
        </div>

        <div className="mini-days">
          {monthDays.map((date) => {
            const classes = [
              date.getMonth() !== month ? 'outside' : '',
              date.toDateString() === selectedDate.toDateString() ? 'selected' : '',
              date.toDateString() === now.toDateString() ? 'today' : '',
            ];

            return (
              <button key={date.toISOString()} className={classes.join(' ')} onClick={() => onSelectDate(date)}>
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      <section className="side-card upcoming-card">
        <div className="side-card-heading">
          <h2>Upcoming</h2>
          <span>{upcoming.length}</span>
        </div>

        <div className="upcoming-list">
          {upcoming.map(({ event, start }, index) => (
            <motion.div
              key={event.id || event.eventId || start.toISOString()}
              className="upcoming-row"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <i style={{ background: COLORS[index % COLORS.length] }} />
              <div>
                <strong>{event.summary || 'Untitled event'}</strong>
                <span>{formatUpcomingDate(event, start)}</span>
              </div>
            </motion.div>
          ))}
          {upcoming.length === 0 && <p className="side-empty">No upcoming events.</p>}
        </div>
      </section>

      <section className="side-card breakdown-card">
        <div className="side-card-heading">
          <h2>This week</h2>
        </div>

        <div className="breakdown-main">
          <div className="donut" style={{ '--busy': `${busyPercent * 3.6}deg` } as React.CSSProperties}>
            <strong>{busyHours.toFixed(1)}h</strong>
            <span>busy</span>
          </div>

          <div className="breakdown-legend">
            <p><i className="busy-dot" />Events <b>{busyHours.toFixed(1)}h</b></p>
            <p><i className="free-dot" />Free <b>{freeHours.toFixed(1)}h</b></p>
            <small>{weekEvents.length} event{weekEvents.length === 1 ? '' : 's'} this week</small>
          </div>
        </div>
      </section>

      <motion.button whileTap={{ scale: 0.98 }} className="button-primary new-event-button" onClick={onCreate}>
        <Plus size={18} /> New event
      </motion.button>
    </aside>
  );
}
