import React, { useEffect, useState } from 'react';
import PlanNavigator from '../PlanNavigator';
import type { Schedule } from '../shared/types';

interface Props {
  schedules: Schedule[];
  currentIdx: number;
  setCurrentIdx: (i: number)=>void;
}

// Lightweight window size hook for responsive layout in the header
const useWindowSize = () => {
  const isBrowser = typeof window !== 'undefined';
  const [size, setSize] = useState({
    width: isBrowser ? window.innerWidth : 1024,
    height: isBrowser ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (!isBrowser) return;
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isBrowser]);

  return size;
};

export const ScheduleHeader: React.FC<Props> = ({ schedules, currentIdx, setCurrentIdx }) => {
  if (!schedules.length) return null;
  const { width } = useWindowSize();
  const isSmall = width < 900;
  return (
    <div style={{
      display: 'flex',
      justifyContent: isSmall ? 'flex-start' : 'space-between',
      alignItems: isSmall ? 'flex-start' : 'center',
      gap: isSmall ? '12px' : undefined,
      flexWrap: 'wrap',
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
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: isSmall ? 'flex-start' : 'flex-end'
      }}>
        <div style={{
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '40px',
          background: 'var(--primary-gradient)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px -4px rgba(37,99,235,0.4)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          امتیاز: {Number(schedules[currentIdx].score).toFixed(1)}
        </div>
        <PlanNavigator currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} total={schedules.length} />
      </div>
    </div>
  );
};
