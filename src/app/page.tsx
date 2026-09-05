'use client';
import {  useEffect, useState } from 'react';
import { Chat } from '@/components/Chat';
import { Calendar } from '@/components/Calendar';
import { ConnectWidget } from '@/components/ConnectWidget';
import { Overview } from '@/components/Overview';
import { Navbar } from '@/components/Navbar';
import '@/styles/page.css';

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectedState, setConnectedState] = useState(false);

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

  return (
    <main className="app-shell">
      <Navbar userName="Brandon" activeTab="overview" onDisconnect={onDisconnect} isConnected={connectedState} />

      <div className="app-body">
        {connectedState ? (
          <section className="workspace">
            <Calendar refreshKey={refreshKey} />

            <div className="side-column">
              <Overview
                unreadEmails={8}
                eventsThisWeek={5}
                todaysEventsCount={2}
                tomorrowsEventsCount={3}
                todaysEvents={[
                  { id: '1', time: '10:00 AM', title: 'Team Stand-up' },
                  { id: '2', time: '2:30 PM', title: 'Project Review' },
                ]}
              />
              <Chat onEventCreated={() => setRefreshKey((prev) => prev + 1)} />
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