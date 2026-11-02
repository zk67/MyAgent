'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/styles/calendarmodal.css';
import { deleteCalendarEvent } from '@/lib/api/calendarClient';
import { formatTime, getEventId, getEventStart } from '@/lib/dates';
import { CalendarEvent } from '@/types/types';
import { t, type Locale } from '@/lib/i18n';

type CalendarModalProps = {
  event: CalendarEvent;
  locale: Locale;
  onClose: () => void;
  onDeleted?: () => void;
};

export function CalendarModal({ event, locale, onClose, onDeleted }: CalendarModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const title = event.summary || '(Untitled event)';
  const endValue = event.end.dateTime || event.end.date;
  const startDate = getEventStart(event);
  const endDate = endValue ? new Date(endValue) : null;
  const isAllDay = !!event.start.date;
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-US';

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = () => {
    if (isAllDay || !startDate || !endDate) return null;
    const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes} ${t('min', locale)}`;
    if (remainingMinutes === 0) return `${hours} ${t('hr', locale)}`;
    return `${hours} ${t('hr', locale)} ${remainingMinutes} ${t('min', locale)}`;
  };

  const duration = formatDuration();
  const reminderText = event.reminders?.overrides?.map((reminder) => {
    const key = reminder.minutes === 1 ? 'minuteBefore' : 'minutesBefore';
    return t(key, locale, { count: reminder.minutes, method: reminder.method });
  });

  async function handleDelete() {
    const message = t('confirmDeleteEvent', locale, { title });
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    const eventId = getEventId(event);
    if (!eventId || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteCalendarEvent(eventId, true);
      onDeleted?.();
      onClose();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('somethingWentWrong', locale));
      setIsDeleting(false);
    }
  }

  return createPortal(
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div
        className="calendar-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className="calendar-modal-close" onClick={onClose} aria-label={t('close', locale)}>
          ×
        </button>

        <div className="calendar-modal-heading">
          <span className="calendar-modal-kicker">{t('calendarEvent', locale)}</span>
          <h3 id="calendar-event-title" className="calendar-event-title">{title}</h3>
        </div>

        <div className="calendar-modal-details">
          <div className="calendar-modal-detail">
            <span className="calendar-modal-detail-icon" aria-hidden="true">◷</span>
            <div>
              <span className="calendar-modal-label">{t('when', locale)}</span>
              <strong>{formatDate(startDate)}</strong>
              <span className="calendar-modal-detail-value">
                {isAllDay ? t('allDay', locale) : `${startDate ? formatTime(startDate) : ''}${endDate ? ` – ${formatTime(endDate)}` : ''}`}
              </span>
            </div>
          </div>

          {duration && (
            <div className="calendar-modal-detail">
              <span className="calendar-modal-detail-icon" aria-hidden="true">↔</span>
              <div>
                <span className="calendar-modal-label">{t('duration', locale)}</span>
                <strong>{duration}</strong>
              </div>
            </div>
          )}

          {event.location && (
            <div className="calendar-modal-detail">
              <span className="calendar-modal-detail-icon" aria-hidden="true">⌖</span>
              <div>
                <span className="calendar-modal-label">{t('location', locale)}</span>
                <strong>{event.location}</strong>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="calendar-modal-section">
            <span className="calendar-modal-section-title">{t('description', locale)}</span>
            <p className="calendar-event-description">{event.description}</p>
          </div>
        )}

        {reminderText && reminderText.length > 0 && (
          <div className="calendar-modal-section">
            <span className="calendar-modal-section-title">{t('reminders', locale)}</span>
            <div className="calendar-modal-reminders">
              {reminderText.map((reminder) => <span key={reminder}>{reminder}</span>)}
            </div>
          </div>
        )}

        <div className="calendar-modal-actions">
          {deleteError && <p className="calendar-modal-delete-error" role="alert">{deleteError}</p>}
          <button
            type="button"
            className="calendar-modal-delete"
            onClick={handleDelete}
            disabled={isDeleting || !getEventId(event)}
          >
            {isDeleting ? t('deletingEvent', locale) : t('deleteEventFull', locale)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
