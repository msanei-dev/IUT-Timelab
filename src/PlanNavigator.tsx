import React from 'react';

interface Props {
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  total: number;
}

const PlanNavigator: React.FC<Props> = ({ currentIdx, setCurrentIdx, total }) => {
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
      gap: '12px'
    }}>
      <button 
        onClick={() => setCurrentIdx(currentIdx - 1)} 
        disabled={currentIdx === 0} 
        className={`btn-modern ${currentIdx === 0 ? 'btn-disabled' : 'btn-primary'}`}
        style={{
          padding: '8px 12px', 
          fontSize: '0.85rem', 
          borderRadius: '6px', 
          cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s ease',
          height: '40px',
          boxShadow: currentIdx === 0 ? 'none' : '0 6px 14px -6px rgba(37,99,235,0.55)'
        }}
      >
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={currentIdx===0? 'var(--text-secondary)' : '#fff'} strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        قبلی
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--primary-gradient)',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: '600',
        fontSize: '0.85rem',
        height: '40px'
      }}>
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{currentIdx + 1}/{total}</span>
      </div>

      <button 
        onClick={() => setCurrentIdx(currentIdx + 1)} 
        disabled={currentIdx === total - 1} 
        className={`btn-modern ${currentIdx === total - 1 ? 'btn-disabled' : 'btn-primary'}`}
        style={{
          padding: '8px 12px', 
          fontSize: '0.85rem', 
          borderRadius: '6px', 
          cursor: currentIdx === total - 1 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s ease',
          height: '40px',
          boxShadow: currentIdx === total - 1 ? 'none' : '0 6px 14px -6px rgba(37,99,235,0.55)'
        }}
      >
        بعدی
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={currentIdx=== total-1? 'var(--text-secondary)' : '#fff'} strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
};
export default PlanNavigator;
