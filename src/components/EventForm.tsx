'use client';

import { FormEvent, useState } from 'react';
import '@/styles/eventform.css';

type EventFormProps = {
  onEventCreated: () => void;
};

export function EventForm({ onEventCreated }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (endTime && endTime <= startTime) {
      setStatus({ type: 'error', message: 'The end time must be after the start time.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startDate, startTime, endTime, description, reminder }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create the event.');
      }

      setStatus({ type: 'success', message: 'Event created in your calendar.' });
      setTitle('');
      setDescription('');
      setReminder('');
      onEventCreated();
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel event-form-panel">
      <div className="panel-header">
        <div>
          <div className="event-form-eyebrow">Calendar</div>
          <h2 className="event-form-title">Create an event</h2>
        </div>
        <div className="event-form-icon" aria-hidden="true">+</div>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Team meeting" />
        </label>

        <div className="event-form-row">
          <label>
            Date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
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

        <label>
          Description <span>(optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a few details" rows={4} />
        </label>

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

        {status && <p className={`event-form-status ${status.type}`} role="status">{status.message}</p>}

        <button className="event-form-submit" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </section>
  );
}