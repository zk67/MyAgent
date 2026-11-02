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

const COLORS = ['#a99bdb', '#8fbfda', '#e9aa80', '#dda0b2'];

function eventStart(event: CalendarEvent) {
  const value = event.start.dateTime || event.start.date;
  return value ? new Date(event.start.dateTime || `${value}T00:00:00`) : null;
}

function eventHours(event: CalendarEvent) {
  if (!event.start.dateTime || !event.end.dateTime) return 0;
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  const countedStart = new Date(start);
  countedStart.setHours(6, 0, 0, 0);
  const countedEnd = new Date(start);
  countedEnd.setDate(countedEnd.getDate() + 1);
  countedEnd.setHours(0, 0, 0, 0);
  const visibleStart = start < countedStart ? countedStart : start;
  const visibleEnd = end > countedEnd ? countedEnd : end;
  return Math.max(0, (visibleEnd.getTime() - visibleStart.getTime()) / 3_600_000);
}

export function ScheduleSidebar({ selectedDate, events, onSelectDate, onCreate }: Props) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });

  const moveMonth = (amount: number) => onSelectDate(new Date(year, month + amount, 1));
  const now = new Date();
  const upcoming = events
    .map((event) => ({ event, start: eventStart(event) }))
    .filter((item): item is { event: CalendarEvent; start: Date } => Boolean(
      item.start
      && item.start >= now
      && item.event.extendedProperties?.private?.myAgentShowInUpcoming !== 'false'
    ))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekEvents = events.filter((event) => {
    const start = eventStart(event);
    return start && start >= weekStart && start < weekEnd;
  });
  const occupied = weekEvents.reduce((total, event) => total + eventHours(event), 0);
  const weeklyHours = 18 * 7;
  const available = Math.max(0, weeklyHours - occupied);
  const occupiedPercent = Math.min(100, (occupied / weeklyHours) * 100);

  return (
    <aside className="schedule-sidebar">
      <section className="mini-calendar side-card">
        <div className="side-card-heading">
          <h2>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div><button onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={15} /></button><button onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={15} /></button></div>
        </div>
        <div className="mini-weekdays">{['M','T','W','T','F','S','S'].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}</div>
        <div className="mini-days">
          {days.map((date) => {
            const selected = date.toDateString() === selectedDate.toDateString();
            const today = date.toDateString() === now.toDateString();
            return <button key={date.toISOString()} className={`${date.getMonth() !== month ? 'outside' : ''} ${selected ? 'selected' : ''} ${today ? 'today' : ''}`} onClick={() => onSelectDate(date)}>{date.getDate()}</button>;
          })}
        </div>
      </section>

      <section className="side-card upcoming-card">
        <div className="side-card-heading"><h2>Upcoming events</h2><span>{upcoming.length} total</span></div>
        <div className="upcoming-list">
          {upcoming.map(({ event, start }, index) => (
            <motion.div className="upcoming-row" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 3 }} key={event.id || event.eventId || start.toISOString()}>
              <i style={{ background: COLORS[index % COLORS.length] }} />
              <div><strong>{event.summary || 'Untitled event'}</strong><span>{start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.start.date ? 'All day' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
            </motion.div>
          ))}
          {!upcoming.length && <p className="side-empty">No upcoming events.</p>}
        </div>
      </section>

      <section className="side-card breakdown-card">
        <div className="side-card-heading"><h2>Weekly time breakdown</h2></div>
        <div className="breakdown-main"><div className="donut" style={{ '--busy': `${occupiedPercent * 3.6}deg` } as React.CSSProperties}><strong>{occupied.toFixed(1)}h</strong><span>busy</span></div><div className="breakdown-legend"><p><i className="busy-dot" />Events <b>{occupied.toFixed(1)}h</b></p><p><i className="free-dot" />Free <b>{available.toFixed(1)}h</b></p><small>{weekEvents.length} event{weekEvents.length === 1 ? '' : 's'} this week</small></div></div>
      </section>

      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="new-event-button" onClick={onCreate}><Plus size={18} /> Create event</motion.button>
    </aside>
  );
}
