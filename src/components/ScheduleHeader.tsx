import React from 'react';
import PlanNavigator from '../PlanNavigator';
import type { Schedule } from '../shared/types';

interface Props {
  schedules: Schedule[];
  currentIdx: number;
  setCurrentIdx: (i: number)=>void;
  onShowScoreDetails?: () => void;
}

export const ScheduleHeader: React.FC<Props> = ({ schedules, currentIdx, setCurrentIdx, onShowScoreDetails }) => {
  if (!schedules.length) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        margin: 0,
        color: 'var(--text-primary)'
      }}>
        برنامه کلاسی تولید شده
      </h2>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {onShowScoreDetails && (
          <button
            onClick={onShowScoreDetails}
            style={{
              background:'linear-gradient(90deg,#6366f1,#4f46e5)',
              border:'1px solid rgba(255,255,255,0.15)',
              color:'#fff',
              fontSize:12,
              fontWeight:600,
              padding:'8px 16px',
              borderRadius:10,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:6,
              boxShadow:'0 4px 14px -4px rgba(79,70,229,0.6)',
              height:'40px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
            جزئیات امتیاز
          </button>
        )}
        <div className="glass-card" style={{
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '40px',
          background: 'linear-gradient(140deg, rgba(22,27,36,0.92), rgba(22,27,36,0.78))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px'
        }}>
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          امتیاز: {Number(schedules[currentIdx].score).toFixed(1)}
        </div>
        <PlanNavigator currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} total={schedules.length} />
      </div>
    </div>
  );
};
