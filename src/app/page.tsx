'use client';
import { useCallback, useEffect, useState } from 'react';
import { Calendar } from '@/components/Calendar';
import { Chat } from '@/components/Chat';
import { ConnectWidget } from '@/components/ConnectWidget';
import { EventForm } from '@/components/EventForm';
import { Navbar } from '@/components/Navbar';
import { Overview } from '@/components/Overview';
import { Settings } from '@/components/Settings';
import { addDays, startOfDay, startOfWeek } from '@/lib/dates';
import { CalendarEvent } from '@/types/types';
import type { Locale } from '@/lib/i18n';
import '@/styles/page.css';

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'settings'>('dashboard');
  const [overviewEvents, setOverviewEvents] = useState<CalendarEvent[]>([]);
  const [locale, setLocale] = useState<Locale>('fr');
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCalendar = useCallback(() => setRefreshKey((key) => key + 1), []);
  const disconnect = useCallback(() => setIsConnected(false), []);

  async function logOut() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await response.json();
      if (data.success) setIsConnected(false);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  async function deleteAccount() {
    try {
      const response = await fetch('/api/account', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) setIsConnected(false);
    } catch (error) {
      console.error('Failed to delete account', error);
    }
  }

  // Check the connection on load, and again when the Google popup says it succeeded.
  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        if (!cancelled) {
          setIsConnected(Boolean(data.connected));
          if (data.preferences?.locale) {
            setLocale(data.preferences.locale as Locale);
          }
        }
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    }

    fetchStatus();

    function handleMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        fetchStatus();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => {
      cancelled = true;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // The overview needs this week plus the next two weeks.
  useEffect(() => {
    if (!isConnected) return;

    const from = startOfWeek(new Date());
    const to = addDays(startOfDay(new Date()), 15);
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

    fetch(`/api/calendar?${params}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Request failed'))))
      .then((data) => setOverviewEvents(data.events || []))
      .catch(() => setOverviewEvents([]));
  }, [isConnected, refreshKey]);

  return (
    <main className="app-shell">
      <Navbar
        activeTab={activeTab}
        locale={locale}
        onTabChange={setActiveTab}
        onLogOut={logOut}
        isConnected={isConnected}
      />

      <div className="app-body">
        <section className="workspace">
          {isConnected ? (
            activeTab === 'settings' ? (
              <Settings
                locale={locale}
                onLocaleChange={setLocale}
                onDeleteAccount={deleteAccount}
              />
            ) : (
              <>
                <Calendar
                  refreshKey={refreshKey}
                  locale={locale}
                  onChange={refreshCalendar}
                  onUnauthorized={disconnect}
                />

                {/* Both panels stay mounted so the chat is not lost when switching tabs. */}
                <div className="side-column">
                  <Overview events={overviewEvents} locale={locale} />
                  <Chat hidden={activeTab !== 'dashboard'} locale={locale} onCalendarChanged={refreshCalendar} />
                  <EventForm hidden={activeTab !== 'create'} locale={locale} onEventCreated={refreshCalendar} />
                </div>
              </>
            )
          ) : (
            <ConnectWidget locale={locale} />
          )}
        </section>
      </div>
    </main>
  );
}
