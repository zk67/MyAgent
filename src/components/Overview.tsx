import '../styles/overview.css';
import { addDays, formatEventTime, getEventId, getEventsOnDay, getEventStart, startOfDay } from '@/lib/dates';
import { CalendarEvent } from '@/types/types';
import { t, type Locale } from '@/lib/i18n';

type OverviewProps = {
  events: CalendarEvent[];
  locale: Locale;
};

function countUntil(events: CalendarEvent[], today: Date, end: Date) {
  return events.filter((event) => {
    const start = getEventStart(event);
    return start !== null && start >= today && start < end;
  }).length;
}

export function Overview({ events, locale }: OverviewProps) {
  const today = startOfDay(new Date());
  const daysUntilNextMonday = 8 - (today.getDay() || 7);

  const todaysEvents = getEventsOnDay(events, today);
  const eventsThisWeek = countUntil(events, today, addDays(today, daysUntilNextMonday));
  const eventsNextTwoWeeks = countUntil(events, today, addDays(today, 14));

  return (
    <div className="panel overview-card">
      <div className="overview-header">
        <h2>{t('overview', locale)}</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-icon" aria-hidden="true">●</div>
          <div className="stat-text">
            <span className="stat-value">{todaysEvents.length}</span>
            <span className="stat-label">{t('today', locale)}</span>
          </div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon" aria-hidden="true">📅</div>
          <div className="stat-text">
            <span className="stat-value">{eventsThisWeek}</span>
            <span className="stat-label">{t('thisWeek', locale)}</span>
          </div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon" aria-hidden="true">↗</div>
          <div className="stat-text">
            <span className="stat-value">{eventsNextTwoWeeks}</span>
            <span className="stat-label">{t('next2Weeks', locale)}</span>
          </div>
        </div>
      </div>

      <div className="today-events-header">
        <h3>{t('todaysEvents', locale)}</h3>
      </div>

      <div className="today-events-list">
        {todaysEvents.length > 0 ? todaysEvents.map((event) => (
          <div className="today-event-row" key={getEventId(event)}>
            <span className="event-time">{formatEventTime(event)}</span>
            <span className="event-title">{event.summary || 'Untitled event'}</span>
          </div>
        )) : (
          <p className="no-events-message">{t('noEventsToday', locale)}</p>
        )}
      </div>
    </div>
  );
}
