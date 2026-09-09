'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import "@/styles/calendarmodal.css";
import { CalendarEvent } from "@/types/types";

type CalendarModalProps = {
  event: CalendarEvent;
  onClose: () => void;
};

export function CalendarModal({ event, onClose }: CalendarModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const title = event.summary || '(Sans titre)';
  const startValue = event.start.dateTime || event.start.date;
  const endValue = event.end.dateTime || event.end.date;
  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;
  const isAllDay = !!event.start.date;

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="calendar-modal-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        <h3 className="calendar-event-title">{title}</h3>

        <div className="calendar-event-time">
          {isAllDay ? (
            <span>Toute la journée</span>
          ) : (
            <span>
              {formatTime(startDate)}
              {endDate && ` – ${formatTime(endDate)}`}
            </span>
          )}
        </div>

        {event.description && (
          <p className="calendar-event-description">{event.description}</p>
        )}
      </div>
    </div>,
    document.body
  );
}