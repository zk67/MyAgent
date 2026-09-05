'use client';
import '@/styles/calendar.css';

export type CalendarEventData = {
  id: string;

  summary?: string;
  description?: string;
  location?: string;

  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  status?: string;

  htmlLink?: string;

  creator?: {
    email?: string;
    displayName?: string;
  };

  organizer?: {
    email?: string;
    displayName?: string;
  };

  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    optional?: boolean;
  }>;

  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
      label?: string;
    }>;
  };

  reminders?: {
    useDefault?: boolean;

    overrides?: Array<{
      method?: string;
      minutes?: number;
    }>;
  };
};

type CalendarEventProps = {
  event: CalendarEventData;
  compact?: boolean;
};

export function CalendarEvent({
  event,
  compact = false,
}: CalendarEventProps) {

  const title = event.summary || '(Sans titre)';

  // Google peut utiliser dateTime OU date pour les événements toute la journée
  const startValue = event.start.dateTime || event.start.date;
  const endValue = event.end.dateTime || event.end.date;

  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;

  const isAllDay = !!event.start.date;

  const formatTime = (date: Date | null) => {
    if (!date) return '';

    return date.toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Version compacte pour la vue Mois
  if (compact) {
    return (
      <div className="calendar-event calendar-event-compact">
        {!isAllDay && startDate && (
          <span className="calendar-event-time">
            {formatTime(startDate)}
          </span>
        )}

        <span className="calendar-event-title">
          {title}
        </span>
      </div>
    );
  }

  // Version complète
  return (
    <div className="calendar-event">

      <div className="calendar-event-main">

        <h3 className="calendar-event-title">
          {title}
        </h3>

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

      </div>

      {event.location && (
        <div className="calendar-event-location">
          📍 {event.location}
        </div>
      )}

      {event.description && (
        <p className="calendar-event-description">
          {event.description}
        </p>
      )}

      {event.attendees && event.attendees.length > 0 && (
        <div className="calendar-event-attendees">

          <span className="calendar-event-label">
            Participants
          </span>

          {event.attendees.map((attendee) => (
            <div
              className="calendar-attendee"
              key={attendee.email}
            >
              {attendee.displayName || attendee.email}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}