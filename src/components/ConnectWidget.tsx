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
        <h2>Connectez votre calendrier</h2>

        <p>
          Connectez votre Google Calendar pour permettre à
          lilIA de consulter et gérer votre agenda.
        </p>

        <button
          className="connect-button"
          onClick={handleConnect}
        >
          Connecter Google Calendar
        </button>
      </div>
    </div>
  );
}