'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import "@/styles/calendarmodal.css";
import { CalendarEvent } from "@/types/types";

type CalendarModalProps = {
  event: CalendarEvent;
  onClose: () => void;
  onDeleted?: () => void;
};

export function CalendarModal({ event, onClose, onDeleted }: CalendarModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const title = event.summary || '(Untitled event)';
  const startValue = event.start.dateTime || event.start.date;
  const endValue = event.end.dateTime || event.end.date;
  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;
  const isAllDay = !!event.start.date;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = () => {
    if (isAllDay || !startDate || !endDate) return null;
    const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours} hr ${remainingMinutes} min`;
  };

  const duration = formatDuration();
  const reminderText = event.reminders?.overrides?.map((reminder) => {
    const unit = reminder.minutes === 1 ? 'minute' : 'minutes';
    return `${reminder.minutes} ${unit} before (${reminder.method})`;
  });

  async function handleDelete() {
    const eventId = event.id || event.eventId;
    if (!eventId || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete the event.');
      }

      onDeleted?.();
      onClose();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete the event.');
      setIsDeleting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="calendar-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="calendar-modal-heading">
          <span className="calendar-modal-kicker">Calendar event</span>
          <h3 className="calendar-event-title">{title}</h3>
        </div>

        <div className="calendar-modal-details">
          <div className="calendar-modal-detail">
            <span className="calendar-modal-detail-icon" aria-hidden="true">◷</span>
            <div>
              <span className="calendar-modal-label">When</span>
              <strong>{formatDate(startDate)}</strong>
              <span className="calendar-modal-detail-value">
                {isAllDay ? 'All day' : `${formatTime(startDate)}${endDate ? ` – ${formatTime(endDate)}` : ''}`}
              </span>
            </div>
          </div>

          {duration && (
            <div className="calendar-modal-detail">
              <span className="calendar-modal-detail-icon" aria-hidden="true">↔</span>
              <div>
                <span className="calendar-modal-label">Duration</span>
                <strong>{duration}</strong>
              </div>
            </div>
          )}

          {startValue && !isAllDay && (
            <div className="calendar-modal-detail">
              <span className="calendar-modal-detail-icon" aria-hidden="true">⌖</span>
              <div>
                <span className="calendar-modal-label">Time zone</span>
                <strong>{event.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="calendar-modal-section">
            <span className="calendar-modal-section-title">Description</span>
            <p className="calendar-event-description">{event.description}</p>
          </div>
        )}

        {reminderText && reminderText.length > 0 && (
          <div className="calendar-modal-section">
            <span className="calendar-modal-section-title">Reminders</span>
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
            disabled={isDeleting || !(event.id || event.eventId)}
          >
            {isDeleting ? 'Deleting...' : 'Delete event'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}