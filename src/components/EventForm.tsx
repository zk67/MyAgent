'use client';

import { FormEvent, useState } from 'react';
import '@/styles/eventform.css';
import { CalendarEvent } from '@/types/types';
import { createCalendarEvent } from '@/lib/api/calendarClient';
import { X } from 'lucide-react';

type EventFormProps = {
  onEventCreated: (event: CalendarEvent) => void;
  onClose?: () => void;
};

// 7 -> "07"
function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

// Today as "YYYY-MM-DD", in the user's time zone.
function getLocalDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
}

function formatTime(date: Date) {
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

// The form starts at the next minute and lasts one hour (but never past midnight).
function getDefaultEventTimes() {
  const start = new Date();
  if (start.getSeconds() > 0 || start.getMilliseconds() > 0) start.setMinutes(start.getMinutes() + 1);
  start.setSeconds(0, 0);

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const crossesMidnight = end.getDate() !== start.getDate();

  return { startTime: formatTime(start), endTime: crossesMidnight ? '23:59' : formatTime(end) };
}

export function EventForm({ onEventCreated, onClose }: EventFormProps) {
  const [defaultTimes] = useState(getDefaultEventTimes);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(getLocalDateValue);
  const [startTime, setStartTime] = useState(defaultTimes.startTime);
  const [endTime, setEndTime] = useState(defaultTimes.endTime);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reminder, setReminder] = useState('');
  const [showInUpcoming, setShowInUpcoming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const today = getLocalDateValue();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (endTime && endTime <= startTime) {
      setStatus({ type: 'error', message: 'The end time must be after the start time.' });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (startDateTime.getTime() < Date.now()) {
      setStatus({ type: 'error', message: 'You cannot create an event in the past.' });
      return;
    }

    setLoading(true);

    try {
      const createdEvent = await createCalendarEvent({
        title,
        startDate,
        startTime,
        endTime,
        description,
        location,
        reminder,
        showInUpcoming,
      });

      setTitle('');
      setDescription('');
      setLocation('');
      setReminder('');
      setStatus({ type: 'success', message: 'Event created in your calendar.' });
      onEventCreated(createdEvent as CalendarEvent);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to create the event.' });
      console.error('Unable to create the event.', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`panel event-form-panel ${status ? `has-${status.type}` : ''}`}>
      <div className="panel-header">
        <h2 className="event-form-title">New event</h2>
        {onClose && (
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Team meeting" />
        </label>

        <div className="event-form-row">
          <label>
            Date
            <input type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </label>
          <label>
            Start
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </label>
          <label>
            End
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
        </div>

        <div className="event-form-details-row">
          <label>
            Description <span>(optional)</span>
            <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a few details" rows={4} />
          </label>

          <label>
            Location <span>(optional)</span>
            <textarea maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Office or video call" rows={4} />
          </label>
        </div>

        <label>
          Reminder <span>(optional)</span>
          <select value={reminder} onChange={(event) => setReminder(event.target.value)}>
            <option value="">No reminder</option>
            <option value="10">10 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </select>
        </label>

        <label className="event-form-checkbox">
          <input type="checkbox" checked={showInUpcoming} onChange={(event) => setShowInUpcoming(event.target.checked)} />
          <span>Show this event in Upcoming events</span>
        </label>

        {status && (
          <p className={`event-form-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </p>
        )}

        <button className="button-primary event-form-submit" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </section>
  );
}
