import React, { useState, useEffect } from 'react';

interface TitleBarProps {
  onThemeToggle: () => void;
  currentTheme: 'light' | 'dark';
}

const TitleBar: React.FC<TitleBarProps> = ({ onThemeToggle, currentTheme }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const apiAny = (window as any).api;
    apiAny?.windowControls?.onMaximizeState?.((v: boolean) => setIsMaximized(v));
  }, []);

  const handleMinimize = () => {
    (window as any).api?.windowControls?.minimize?.();
  };

  const handleToggleMaximize = () => {
    (window as any).api?.windowControls?.toggleMaximize?.();
  };

  const handleClose = () => {
    (window as any).api?.windowControls?.close?.();
  };

  return (
    <>
      <div className="titlebar">
        <div className="titlebar-content">
          {/* Window Controls - Right Side (RTL Layout) */}
          <div className="window-controls">
            <button 
              className="window-btn minimize" 
              onClick={handleMinimize}
              title="کوچک کردن"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button 
              className="window-btn maximize" 
              onClick={handleToggleMaximize}
              title={isMaximized ? "بازگردانی" : "بزرگ کردن"}
            >
              {isMaximized ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              )}
            </button>
            <button 
              className="window-btn close" 
              onClick={handleClose}
              title="بستن"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Title - Center */}
          <div className="titlebar-title">
            <div className="app-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>برنامه‌ساز هوشمند دانشگاه صنعتی اصفهان</span>
          </div>
        </div>
      </div>
      
      {/* Shadow */}
      <div className="titlebar-shadow" />
    </>
  );
};

export default TitleBar;
