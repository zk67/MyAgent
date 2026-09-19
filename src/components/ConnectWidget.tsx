import '@/styles/connectwidget.css';
export function ConnectWidget() {
  const handleConnect = () => {
  const width = 500;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  window.open('/api/auth/login', 'Google-Authentification', features);
};
  return (
    <div className="calendar-connect">
      <div className="calendar-connect-content">
        <div className="calendar-connect-icon">
          📅
        </div>
        <h2>Connect your calendar</h2>

        <p>
          Connect your Google Calendar so lilIA can view and manage your schedule.
        </p>

        <button
          className="connect-button"
          onClick={handleConnect}
        >
          Connect Google Calendar
        </button>
      </div>
    </div>
  );
}