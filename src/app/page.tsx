'use client';
import {  useEffect, useState } from 'react';
import { Chat } from '@/components/Chat';
import { Calendar } from '@/components/Calendar';
import { ConnectWidget } from '@/components/ConnectWidget';
import { Overview } from '@/components/Overview';
import { EventForm } from '@/components/EventForm';
import { Navbar } from '@/components/Navbar';
import { CalendarEvent } from '@/types/types';
import '@/styles/page.css';

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectedState, setConnectedState] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [overviewEvents, setOverviewEvents] = useState<CalendarEvent[]>([]);

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
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setConnectedState(true);
          setRefreshKey((prev) => prev + 1);
        }else{
          setConnectedState(false);
        }
      });
    };
    
  useEffect(() => {
    checkStatus();

    //fermeture du pop up on écoute l'évenement de message pour détecter la réussite de l'authentification
    //et on tchek le status de la connexion
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkStatus();
        setRefreshKey((prev) => prev + 1);
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  useEffect(() => {
    if (!connectedState) return;

    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWindow = new Date(today);
    endOfWindow.setDate(endOfWindow.getDate() + 14);
    endOfWindow.setHours(23, 59, 59, 999);

    fetch(`/api/calendar?from=${encodeURIComponent(startOfWeek.toISOString())}&to=${encodeURIComponent(endOfWindow.toISOString())}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Calendar request failed')))
      .then((data) => setOverviewEvents(data.events || []))
      .catch(() => setOverviewEvents([]));
  }, [connectedState, refreshKey]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + (8 - (weekEnd.getDay() || 7)));
  const twoWeeksEnd = new Date(todayStart);
  twoWeeksEnd.setDate(twoWeeksEnd.getDate() + 14);

  const getEventDate = (event: CalendarEvent) => {
    const value = event.start.dateTime || event.start.date;
    if (!value) return null;
    const date = new Date(event.start.dateTime || `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const eventsWithDates = overviewEvents
    .map((event) => ({ event, date: getEventDate(event) }))
    .filter((item): item is { event: CalendarEvent; date: Date } => item.date !== null);
  const todaysEvents = eventsWithDates
    .filter(({ date }) => date >= todayStart && date < tomorrowStart)
    .map(({ event, date }) => ({
      id: event.id || event.eventId || `${date.getTime()}`,
      time: event.start.dateTime ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'All day',
      title: event.summary || 'Untitled event',
    }));
  const eventsToday = todaysEvents.length;
  const eventsThisWeek = eventsWithDates.filter(({ date }) => date >= todayStart && date < weekEnd).length;
  const eventsNextTwoWeeks = eventsWithDates.filter(({ date }) => date >= todayStart && date < twoWeeksEnd).length;

  return (
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
            <Calendar
              refreshKey={refreshKey}
              onUnauthorized={() => setConnectedState(false)}
            />

            <div className={`side-column ${activeTab === 'create' ? 'create-mode' : ''}`}>
              {activeTab === 'create' ? (
                <>
                  <Overview
                    eventsToday={eventsToday}
                    eventsThisWeek={eventsThisWeek}
                    eventsNextTwoWeeks={eventsNextTwoWeeks}
                    todaysEvents={todaysEvents}
                  />
                  <EventForm onEventCreated={() => setRefreshKey((prev) => prev + 1)} />
                </>
              ) : (
                <>
                  <Overview
                    eventsToday={eventsToday}
                    eventsThisWeek={eventsThisWeek}
                    eventsNextTwoWeeks={eventsNextTwoWeeks}
                    todaysEvents={todaysEvents}
                  />
                  <Chat onEventCreated={() => setRefreshKey((prev) => prev + 1)} />
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="workspace">
            <ConnectWidget />
          </section>
        )}
      </div>
    </main>
  );
}