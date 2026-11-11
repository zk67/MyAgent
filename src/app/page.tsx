'use client';
import { useCallback, useEffect, useState } from 'react';
import { Chat } from '@/components/Chat';
import { Calendar } from '@/components/Calendar';
import { ConnectWidget } from '@/components/ConnectWidget';
import { ScheduleSidebar } from '@/components/ScheduleSidebar';
import { EventForm } from '@/components/EventForm';
import { Navbar } from '@/components/Navbar';
import { CalendarEvent } from '@/types/types';
import '@/styles/page.css';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectedState, setConnectedState] = useState(false);
  // False until /api/status has answered, so the connect screen doesn't flash for a user who is already connected.
  const [statusChecked, setStatusChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [overviewEvents, setOverviewEvents] = useState<CalendarEvent[]>([]);
  const [createdEvent, setCreatedEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const refreshCalendarData = (change?: { type: 'created' | 'deleted'; event: CalendarEvent }) => {
    if (change?.type === 'created') {
      setCreatedEvent(change.event);
      setOverviewEvents((currentEvents) => [...currentEvents, change.event]);
    }
    if (change?.type === 'deleted') {
      const deletedId = change.event.id || change.event.eventId;
      setCreatedEvent(undefined);
      setOverviewEvents((currentEvents) => currentEvents.filter((event) => (event.id || event.eventId) !== deletedId));
    }
    setRefreshKey((prev) => prev + 1);
  };

  // Keeps the same function between renders: the calendar reloads its events
  // whenever this function changes.
  const handleUnauthorized = useCallback(() => setConnectedState(false), []);

  const onDisconnect = async () => {
    const data = await fetch( '/api/auth/logout', {
      method: 'POST'
    });
    const response = await data.json();
    if (response.success) {
      setConnectedState(false);
    }else{
      console.error('Failed to disconnect');
    }
  }

  const checkStatus = () => {
    fetch('/api/status')
      .then((response) => response.json())
      .then((data) => {
        setConnectedState(data.connected);
        if (data.connected) setRefreshKey((previous) => previous + 1);
      })
      .catch(() => setConnectedState(false))
      .finally(() => setStatusChecked(true));
  };

  useEffect(() => {
    checkStatus();

    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkStatus();
        setRefreshKey((prev) => prev + 1);
      };
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  useEffect(() => {
    if (!connectedState) return;

    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(1);
    startOfWeek.setMonth(startOfWeek.getMonth() - 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWindow = new Date(selectedDate);
    endOfWindow.setMonth(endOfWindow.getMonth() + 2, 1);
    endOfWindow.setHours(23, 59, 59, 999);

    fetch(`/api/calendar?from=${encodeURIComponent(startOfWeek.toISOString())}&to=${encodeURIComponent(endOfWindow.toISOString())}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Calendar request failed')))
      .then((data) => setOverviewEvents(data.events || []))
      .catch(() => setOverviewEvents([]));
  }, [connectedState, refreshKey, selectedDate]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
    <main className="app-shell">
      <Navbar
        userName="Brandon"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDisconnect={onDisconnect}
        isConnected={connectedState}
      />

      <div className="app-body">
        {connectedState ? (
          <section className="workspace">
            <ScheduleSidebar selectedDate={selectedDate} events={overviewEvents} onSelectDate={setSelectedDate} onCreate={() => setActiveTab('create')} />
            <Calendar
              refreshKey={refreshKey}
              createdEvent={createdEvent}
              onUnauthorized={handleUnauthorized}
              onEventsChanged={refreshCalendarData}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
            />
            <Chat onEventCreated={() => refreshCalendarData()} />
            <AnimatePresence>
              {activeTab === 'create' && (
                <motion.div
                  className="event-form-overlay"
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.99 }}
                  >
                    <EventForm
                      onClose={() => setActiveTab('dashboard')}
                      onEventCreated={(event) => {
                        refreshCalendarData({ type: 'created', event });
                        setActiveTab('dashboard');
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ) : !statusChecked ? (
          <section className="workspace" aria-busy="true" />
        ) : (
          <section className="workspace">
            <ConnectWidget />
          </section>
        )}
      </div>
    </main>
    </MotionConfig>
  );
}
