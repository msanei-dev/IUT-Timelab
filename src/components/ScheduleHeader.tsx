import React from 'react';
import PlanNavigator from '../PlanNavigator';
import type { Schedule } from '../shared/types';

interface Props {
  schedules: Schedule[];
  currentIdx: number;
  setCurrentIdx: (i: number)=>void;
}

export const ScheduleHeader: React.FC<Props> = ({ schedules, currentIdx, setCurrentIdx }) => {
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
        gap: '16px'
      }}>
        <div className="glass-card" style={{
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          امتیاز: {schedules[currentIdx].score}
        </div>
        <PlanNavigator currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} total={schedules.length} />
      </div>
    </div>
  );
};
