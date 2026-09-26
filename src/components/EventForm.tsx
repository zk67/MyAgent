'use client';

import { FormEvent, useState } from 'react';
import '@/styles/eventform.css';
import { CalendarEvent } from '@/types/types';
import { createCalendarEvent } from '@/lib/api/calendarClient';

type EventFormProps = {
  onEventCreated: (event: CalendarEvent) => void;
};

export function EventForm({ onEventCreated }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reminder, setReminder] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
        <div>
          <div className="event-form-eyebrow">Calendar</div>
          <h2 className="event-form-title">Create an event</h2>
        </div>
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

        <button className="event-form-submit" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </section>
  );
}
