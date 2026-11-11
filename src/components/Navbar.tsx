'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import '@/styles/navbar.css';

type NavbarProps = {
  isConnected: boolean;
  onDisconnect: () => void;
};

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', dark);
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function Navbar({ isConnected, onDisconnect }: NavbarProps) {
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

    function switchTheme() {
      setIsDarkMode(dark);
      applyTheme(dark);
      window.localStorage.setItem('theme', dark ? 'dark' : 'light');
    }

    // A soft cross-fade between the two themes (timing in navbar.css).
    // Older browsers switch instantly.
    if (document.startViewTransition) {
      document.startViewTransition(() => flushSync(switchTheme));
    } else {
      switchTheme();
    }
  }

  return (
    <header className="top-header">
      <span className="brand">MyAgent</span>

      <div className="header-actions">
        {isConnected && (
          <button type="button" className="button-quiet" onClick={onDisconnect}>
            <LogOut size={15} />
            Log out
          </button>
        )}

        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
