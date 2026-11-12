'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Chat } from '@/components/Chat';
import { Calendar } from '@/components/Calendar';
import { ConnectWidget } from '@/components/ConnectWidget';
import { ScheduleSidebar } from '@/components/ScheduleSidebar';
import { EventForm } from '@/components/EventForm';
import { Navbar } from '@/components/Navbar';
import { CalendarEvent } from '@/types/types';
import '@/styles/page.css';

type CalendarChange = { type: 'created' | 'deleted'; event: CalendarEvent };

function getEventId(event: CalendarEvent) {
  return event.id || event.eventId;
}

// The sidebar shows events from the month before to the month after the selected date.
function getSidebarRange(selectedDate: Date) {
  const from = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const to = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 1, 23, 59, 59, 999);
  return { from, to };
}

// The "New event" form, shown in a dialog over the dashboard.
function CreateEventDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (event: CalendarEvent) => void }) {
  return (
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
        <EventForm onClose={onClose} onEventCreated={onCreated} />
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  // False until /api/status has answered, so the intro page doesn't flash for someone already connected.
  const [statusChecked, setStatusChecked] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sidebarEvents, setSidebarEvents] = useState<CalendarEvent[]>([]);
  const [createdEvent, setCreatedEvent] = useState<CalendarEvent | undefined>();
  // Changing this number tells the calendar to reload its events.
  const [refreshKey, setRefreshKey] = useState(0);

  // Show a change right away, then reload everything from Google.
  function refreshCalendarData(change?: CalendarChange) {
    if (change?.type === 'created') {
      setCreatedEvent(change.event);
      setSidebarEvents((events) => [...events, change.event]);
    }
    if (change?.type === 'deleted') {
      const deletedId = getEventId(change.event);
      setCreatedEvent(undefined);
      setSidebarEvents((events) => events.filter((event) => getEventId(event) !== deletedId));
    }
    setRefreshKey((key) => key + 1);
  }

  // Keeps the same function between renders: the calendar reloads its events
  // whenever this function changes.
  const handleUnauthorized = useCallback(() => setIsConnected(false), []);

  async function handleDisconnect() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      setIsConnected(false);
    } else {
      console.error('Failed to disconnect');
    }
  }

  function checkStatus() {
    fetch('/api/status')
      .then((response) => response.json())
      .then((data) => {
        setIsConnected(data.connected);
        if (data.connected) setRefreshKey((key) => key + 1);
      })
      .catch(() => setIsConnected(false))
      .finally(() => setStatusChecked(true));
  }

  // On load, and again when the Google sign-in popup reports success.
  useEffect(() => {
    checkStatus();

    function handleAuthMessage(event: MessageEvent) {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') checkStatus();
    }

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Load the events shown in the sidebar.
  useEffect(() => {
    if (!isConnected) return;

    const { from, to } = getSidebarRange(selectedDate);
    const url = `/api/calendar?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

    fetch(url, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Calendar request failed'))))
      .then((data) => setSidebarEvents(data.events || []))
      .catch(() => setSidebarEvents([]));
  }, [isConnected, refreshKey, selectedDate]);

  function handleEventCreated(event: CalendarEvent) {
    refreshCalendarData({ type: 'created', event });
    setIsCreatingEvent(false);
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      <main className="app-shell">
        <Navbar isConnected={isConnected} onDisconnect={handleDisconnect} />

        <div className="app-body">
          {/* Signing in or out swaps the two pages: the old one fades out, then the new one comes in. */}
          <AnimatePresence mode="wait">
            {!statusChecked && <section key="loading" className="workspace" aria-busy="true" />}

            {statusChecked && !isConnected && (
              <motion.div
                key="intro"
                className="page-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                <ConnectWidget />
              </motion.div>
            )}

            {statusChecked && isConnected && (
              <motion.div
                key="dashboard"
                className="page-view"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45 }}
              >
                <section className="workspace">
                  <ScheduleSidebar
                    selectedDate={selectedDate}
                    events={sidebarEvents}
                    onSelectDate={setSelectedDate}
                    onCreate={() => setIsCreatingEvent(true)}
                  />
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
                    {isCreatingEvent && (
                      <CreateEventDialog onClose={() => setIsCreatingEvent(false)} onCreated={handleEventCreated} />
                    )}
                  </AnimatePresence>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}
