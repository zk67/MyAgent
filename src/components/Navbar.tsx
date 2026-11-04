'use client';

import { useEffect, useState } from 'react';
import '@/styles/navbar.css';

type NavbarProps = {
  userName: string;
  activeTab: 'dashboard' | 'create';
  onTabChange: (tab: 'dashboard' | 'create') => void;
  onDisconnect: () => void;
  isConnected : boolean;
};

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', dark);
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function Navbar({ activeTab, onTabChange, onDisconnect, isConnected }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // The page already has the right theme (see the script in layout.tsx);
  // this only syncs the toggle button with it.
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const dark = savedTheme ? savedTheme === 'dark' : systemPrefersDark();
    // The theme is read from browser-only storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(dark);
    applyTheme(dark);
  }, []);

  function toggleTheme() {
    const dark = !isDarkMode;
    setIsDarkMode(dark);
    applyTheme(dark);
    window.localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  // Logging out forgets the chosen theme and goes back to the system default.
  function handleDisconnect() {
    const dark = systemPrefersDark();
    window.localStorage.removeItem('theme');
    setIsDarkMode(dark);
    applyTheme(dark);
    onDisconnect();
  }

  return (
    <>
      <header className="top-header">
        <div className="brand">
          <div className="brand-text">
            <strong>MyAgent</strong>
          </div>
        </div>

        {isConnected && (
        <div className="header-right">
          <button className="disconnect-button" type="button" onClick={handleDisconnect}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button>
        </div>
        )}
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {isDarkMode ? '☀' : '☾'}
        </button>
      </header>

      {isConnected && <div className="toolbar">
        <div className="tabs">

            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onTabChange('dashboard')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
            </button>

            <button
              className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => onTabChange('create')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                New
            </button>

        </div>

        <div className="toolbar-right">
            <button className="disconnect-button" onClick={onDisconnect}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Log out
            </button>

          <button className="settings-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
      }
    </>
  );
}
