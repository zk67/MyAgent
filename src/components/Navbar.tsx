import '@/styles/navbar.css';

type NavbarProps = {
  userName: string;
  activeTab: 'overview' | 'journal' ;
  onDisconnect: () => void;
  isConnected : boolean;
};

export function Navbar({ userName, activeTab, onDisconnect, isConnected }: NavbarProps) {
  const initial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className="top-header">
        <div className="brand">
          <div className="brand-icon">

            {/* icône envoi/avion en papier */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-text">
            <strong>NOVA</strong>
            <span className="divider">|</span>
            <span className="sub">AI Assistant</span>
          </div>
        </div>

        <div className="header-right">
          <button className="icon-button" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notif-dot" />
          </button>

          <div className="user-menu">
            <div className="user-avatar">{initial}</div>
            <span className="user-name">{userName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </header>

      <div className="toolbar">
        <div className="tabs">

            <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Overview
            </button>

            <button className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Journal
            </button>

        </div>

        <div className="toolbar-right">
            
            {isConnected && (
            <button className="disconnect-button" onClick={onDisconnect}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Déconnecter
            </button>
            )}

          <button className="settings-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
    </>
  );
}