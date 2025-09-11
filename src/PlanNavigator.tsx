import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  total: number;
}

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const PlanNavigator: React.FC<Props> = ({ currentIdx, setCurrentIdx, total }) => {
  const { width } = useWindowSize();
  const isSmall = width < 600;
  const iconSize = Math.max(10, Math.min(14, width * 0.025));
  if (total === 0) {
    return (
      <div className="glass-card" style={{
        padding: '20px',
        textAlign: 'center',
        margin: '16px 0',
        borderRadius: '12px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-secondary)'
        }}>
          <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
            هنوز برنامه‌ای تولید نشده است
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', 
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 12px)',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      <button 
        onClick={() => setCurrentIdx(currentIdx - 1)} 
        disabled={currentIdx === 0} 
        className={`btn-modern ${currentIdx === 0 ? 'btn-disabled' : 'btn-primary'}`}
        style={{
          padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', 
          borderRadius: '8px', 
          cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 6px)',
          transition: 'all 0.3s ease',
          height: 'clamp(32px, 8vw, 40px)',
          minWidth: 'clamp(60px, 15vw, 80px)',
          justifyContent: 'center'
        }}
      >
        <ChevronRight size={iconSize} color={currentIdx === 0 ? 'var(--text-secondary)' : '#fff'} strokeWidth={2} />
        {isSmall ? 'قبل' : 'قبلی'}
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1vw, 6px)',
        padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
        background: 'var(--primary-gradient)',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: '600',
        fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
        height: 'clamp(28px, 7vw, 32px)',
        minHeight: 'clamp(28px, 7vw, 32px)',
        minWidth: 'clamp(50px, 12vw, 65px)',
        justifyContent: 'center'
      }}>
        <Calendar size={iconSize} color="#1e3a8a" strokeWidth={2.5} />
        <span>{currentIdx + 1}/{total}</span>
      </div>

      <button 
        onClick={() => setCurrentIdx(currentIdx + 1)} 
        disabled={currentIdx === total - 1} 
        className={`btn-modern ${currentIdx === total - 1 ? 'btn-disabled' : 'btn-primary'}`}
        style={{
          padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', 
          borderRadius: '8px', 
          cursor: currentIdx === total - 1 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 6px)',
          transition: 'all 0.3s ease',
          height: 'clamp(32px, 8vw, 40px)',
          minWidth: 'clamp(60px, 15vw, 80px)',
          justifyContent: 'center'
        }}
      >
        {isSmall ? 'بعد' : 'بعدی'}
        <ChevronLeft size={iconSize} color={currentIdx === total - 1 ? 'var(--text-secondary)' : '#fff'} strokeWidth={2} />
      </button>
    </div>
  );
};
export default PlanNavigator;
