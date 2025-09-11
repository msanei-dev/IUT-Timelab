import React from 'react';
import { ScheduleSection, CourseGroup, UserPreferences } from '../shared/types';
import { calculateScoreBreakdown, ScoreBreakdownComponents } from '../solver/scoring';

interface Props {
  open: boolean;
  onClose: () => void;
  schedule: { sections: ScheduleSection[]; score: number; units?: number; meta?: any } | null;
  genome?: any; // optional genome for deeper integration later
  courseGroups: CourseGroup[];
  userPreferences?: UserPreferences;
}

export const ScoreDetailsPanel: React.FC<Props> = ({ open, onClose, schedule, genome, courseGroups, userPreferences }) => {
  if (!open || !schedule) return null;
  const breakdown: ScoreBreakdownComponents = calculateScoreBreakdown(schedule.sections as any, undefined, genome, courseGroups, userPreferences);
  const rows: { label: string; key: keyof ScoreBreakdownComponents; color?: string }[] = [
    { label: 'اولویت گروه‌ها', key: 'groupPriority', color: 'linear-gradient(90deg,#dc2626,#ef4444)' },
    { label: 'اساتید', key: 'professors', color: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
    { label: 'زمان کلاس‌ها', key: 'timeSlots', color: 'linear-gradient(90deg,#2563eb,#3b82f6)' },
    { label: 'روزهای خالی', key: 'freeDays', color: 'linear-gradient(90deg,#059669,#10b981)' },
    { label: 'فشردگی برنامه', key: 'compactness', color: 'linear-gradient(90deg,#7c3aed,#8b5cf6)' },
    { label: 'حضور و غیاب (عدم اجبار)', key: 'attendance', color: 'linear-gradient(90deg,#f472b6,#ec4899)' }
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(8px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'520px', maxWidth:'92%', maxHeight:'90vh', overflow:'auto', background:'rgba(30,41,59,0.9)', border:'1px solid rgba(148,163,184,0.15)', borderRadius:18, padding:'22px 26px', boxShadow:'0 10px 40px -10px rgba(0,0,0,0.55)', direction:'rtl' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:'1.05rem', fontWeight:700, letterSpacing:'-.5px', color:'var(--text-primary)' }}>جزئیات امتیاز</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'var(--text-primary)', fontSize:12, padding:'4px 10px', borderRadius:8, cursor:'pointer' }}>بستن</button>
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:16 }}>
          این پنل نشان می‌دهد هر مولفه چه سهمی در امتیاز نهایی داشته است (مقیاس داخلی نرمالایز شده). ضرایب وزن فعلی روی این اعداد اثر گذاشته‌اند.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {rows.map(r => {
            const value = breakdown[r.key];
            return (
              <div key={r.key} style={{ display:'flex', flexDirection:'column', gap:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', padding:'10px 12px', borderRadius:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'.75rem', fontWeight:600, color:'var(--text-primary)' }}>{r.label}</span>
                  <span style={{ fontSize:'.7rem', fontWeight:600, color:'var(--text-secondary)' }}>{Number(value).toFixed(1)}</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width: Math.min(100, Math.abs(value)/10)+'%', background:r.color || 'var(--accent-color)', filter:'brightness(1.2)' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:18, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))', borderRadius:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)' }}>
            <span>امتیاز نهایی</span>
            <span>{Number(breakdown.total).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreDetailsPanel;
