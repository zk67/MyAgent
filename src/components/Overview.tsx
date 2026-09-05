import '../styles/overview.css';

type TodayEvent = {
  id: string;
  time: string;
  title: string;
};

type OverviewProps = {
  unreadEmails: number;
  eventsThisWeek: number;
  todaysEventsCount: number;
  tomorrowsEventsCount: number;
  todaysEvents: TodayEvent[];
};

export function Overview({
  unreadEmails,
  eventsThisWeek,
  todaysEventsCount,
  tomorrowsEventsCount,
  todaysEvents,
}: OverviewProps) {
  return (
    <div className="panel overview-card">
      <div className="overview-header">
        <h2>Overview</h2>
        <button className="overview-menu-button" aria-label="Options">⋮</button>
      </div>

      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-icon">✉️</div>
          <div className="stat-text">
            <span className="stat-value">{unreadEmails}</span>
            <span className="stat-label">Unread</span>
          </div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon">📅</div>
          <div className="stat-text">
            <span className="stat-value">{eventsThisWeek}</span>
            <span className="stat-label">This week</span>
          </div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon">📅</div>
          <div className="stat-text">
            <span className="stat-value">{todaysEventsCount}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon">📅</div>
          <div className="stat-text">
            <span className="stat-value">{tomorrowsEventsCount}</span>
            <span className="stat-label">Tomorrow</span>
          </div>
        </div>
      </div>

      <div className="today-events-header">
        <h3>Today&apos;s Events</h3>
      </div>

      <div className="today-events-list">
        {todaysEvents.map((event) => (
          <div className="today-event-row" key={event.id}>
            <span className="event-dot" />
            <span className="event-time">{event.time}</span>
            <span className="event-title">{event.title}</span>
          </div>
        ))}
        <button className="view-all-button">View all events</button>
      </div>
    </div>
  );
}