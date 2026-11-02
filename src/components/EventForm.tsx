'use client';

import { FormEvent, useState } from 'react';
import '@/styles/eventform.css';
import { createCalendarEvent } from '@/lib/api/calendarClient';
import { t, type Locale } from '@/lib/i18n';

type EventFormProps = {
  hidden: boolean;
  locale: Locale;
  onEventCreated: () => void;
};

export function EventForm({ hidden, locale, onEventCreated }: EventFormProps) {
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
      setStatus({ type: 'error', message: t('eventError', locale) });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (startDateTime.getTime() < Date.now()) {
      setStatus({ type: 'error', message: t('eventError', locale) });
      return;
    }

    setLoading(true);

    try {
      await createCalendarEvent({
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
      setStatus({ type: 'success', message: t('eventCreated', locale) });
      onEventCreated();
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : t('eventError', locale) });
      console.error('Unable to create the event.', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`panel event-form-panel ${status ? `has-${status.type}` : ''}`} hidden={hidden}>
      <div className="panel-header">
        <h2 className="event-form-title">{t('createEvent', locale)}</h2>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          {t('title', locale)}
          <input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t('titlePlaceholder', locale)} />
        </label>

        <div className="event-form-row">
          <label>
            {t('date', locale)}
            <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            {t('start', locale)}
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label>
            {t('end', locale)}
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>

        <div className="event-form-details-row">
          <label>
            {t('description', locale)} <span>{t('descriptionOptional', locale)}</span>
            <textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('descriptionPlaceholder', locale)} rows={4} />
          </label>

          <label>
            {t('location', locale)} <span>{t('locationOptional', locale)}</span>
            <textarea maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('locationPlaceholder', locale)} rows={4} />
          </label>
        </div>

        <label>
          {t('reminder', locale)} <span>{t('descriptionOptional', locale)}</span>
          <select value={reminder} onChange={(e) => setReminder(e.target.value)}>
            <option value="">{t('noReminder', locale)}</option>
            <option value="10">10 {t('minutes', locale)}</option>
            <option value="30">30 {t('minutes', locale)}</option>
            <option value="60">1 {t('hours', locale)}</option>
            <option value="1440">24 {t('hours', locale)}</option>
          </select>
        </label>

        {status && (
          <p className={`event-form-status event-form-status--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </p>
        )}

        <button className="event-form-submit" type="submit" disabled={loading}>
          {loading ? '...' : t('createEvent', locale)}
        </button>
      </form>
    </section>
  );
}
