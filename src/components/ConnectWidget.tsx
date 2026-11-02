'use client';
import '@/styles/connectwidget.css';
import { t, type Locale } from '@/lib/i18n';

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 700;

type ConnectWidgetProps = {
  locale: Locale;
};

export function ConnectWidget({ locale }: ConnectWidgetProps) {
  function handleConnect() {
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    const popup = window.open('/api/auth/login', 'google-authentication', features);
    // This is an API route (OAuth redirect), not a Next.js page — router.push won't work.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (!popup) window.location.href = '/api/auth/login';
  }

  return (
    <div className="calendar-connect">
      <div className="calendar-connect-content">
        <div className="calendar-connect-icon" aria-hidden="true">📅</div>
        <h2>{t('connectTitle', locale)}</h2>
        <p>{t('connectDescription', locale)}</p>
        <button type="button" className="connect-button" onClick={handleConnect}>
          {t('connectButton', locale)}
        </button>
      </div>
    </div>
  );
}
