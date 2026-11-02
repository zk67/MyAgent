'use client';

import { useEffect, useState } from 'react';
import '@/styles/navbar.css';
import { t, type Locale } from '@/lib/i18n';

type Tab = 'dashboard' | 'create' | 'settings';

type NavbarProps = {
  activeTab: Tab;
  locale: Locale;
  onTabChange: (tab: Tab) => void;
  onLogOut: () => void;
  isConnected: boolean;
};

export function Navbar({ activeTab, locale, onTabChange, onLogOut, isConnected }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = savedTheme ? savedTheme === 'dark' : prefersDark;
    // The theme is read from browser-only storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, []);

  function toggleTheme() {
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.dataset.theme = next ? 'dark' : 'light';
      window.localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <>
      <header className="top-header">
        <div className="brand">
          <div className="brand-text">
            <strong>MyAgent</strong>
          </div>
        </div>

        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? t('lightMode', locale) : t('darkMode', locale)}
          title={isDarkMode ? t('lightMode', locale) : t('darkMode', locale)}
        >
          {isDarkMode ? '☀' : '☾'}
        </button>
      </header>

      {isConnected && (
        <div className="toolbar">
          <div className="tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              aria-pressed={activeTab === 'dashboard'}
              onClick={() => onTabChange('dashboard')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              {t('assistant', locale)}
            </button>

            <button
              type="button"
              className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
              aria-pressed={activeTab === 'create'}
              onClick={() => onTabChange('create')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              {t('newEvent', locale)}
            </button>
          </div>

          <div className="toolbar-right">
            <button
              type="button"
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              aria-pressed={activeTab === 'settings'}
              onClick={() => onTabChange('settings')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {t('settings', locale)}
            </button>

            <button type="button" className="disconnect-button" onClick={onLogOut}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('logOut', locale)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
