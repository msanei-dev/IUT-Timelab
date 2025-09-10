import React from 'react';
import type { Schedule, Day } from './shared/types';

// روزها
const days: Day[] = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];

// تنظیمات اصلی محور زمان
const START_HOUR = 8;
const END_HOUR = 20; // انتهای بازه (بدون شامل بودن دقیقه 20:00)
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const PIXELS_PER_MINUTE = 1; // هر دقیقه چند پیکسل؟ اگر فشرده است مثلا 1.2 بگذارید

// کمکی: نرمال سازی و تبدیل زمان به دقیقه از 00:00
const normalizeTime = (time: string): string => {
  if (!time.includes(':')) return `${time.padStart(2,'0')}:00`;
  const [h,m] = time.split(':');
  return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
};
const toMinutes = (time: string): number => {
  const [h,m] = normalizeTime(time).split(':').map(Number);
  return h*60 + m;
};
const fromStart = (time: string): number => (toMinutes(time) - START_HOUR*60);
const duration = (start: string, end: string): number => toMinutes(end) - toMinutes(start);

// ساخت لیست ساعت‌ها برای محور زمان
const buildHourMarks = () => {
  const marks: string[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    marks.push(`${h.toString().padStart(2,'0')}:00`);
  }
  return marks;
};
const hourMarks = buildHourMarks();

const colorList = [
  '#1e40af', // آبی تیره
  '#7c3aed', // بنفش تیره
  '#059669', // سبز تیره
  '#dc2626', // قرمز تیره
  '#ea580c', // نارنجی تیره
  '#0891b2', // فیروزه‌ای تیره
  '#be185d', // صورتی تیره
  '#4338ca', // نیلی تیره
  '#047857', // سبز زیتونی تیره
  '#9333ea'  // بنفش روشن تیره
];

const CalendarView: React.FC<{schedule: Schedule}> = ({ schedule }) => {
  // Debug: نمایش اطلاعات schedule
  console.log('CalendarView received schedule:', schedule);
  
  // Map each section to a color
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  for (const sec of schedule.sections) {
    if (!colorMap[sec.courseCode]) {
      colorMap[sec.courseCode] = colorList[colorIdx % colorList.length];
      colorIdx++;
    }
  }

  // Debug: نمایش زمان‌بندی هر section
  schedule.sections.forEach(sec => {
    console.log(`Course: ${sec.courseName}, Schedule:`, sec.schedule);
  });

  // Function to copy course code to clipboard
  const copyCourseCode = async (courseCode: string) => {
    try {
      await navigator.clipboard.writeText(courseCode);
      
      // Show notification
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: var(--success-color);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          animation: slideInRight 0.3s ease;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          کد کپی شد: ${courseCode}
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert(`کد کپی شد: ${courseCode}`);
    }
  };
  // Build modern grid
  return (
    <div className="card" style={{
      flex: 1, 
      borderRadius: '12px', 
      padding: '16px', 
      margin: '16px 0', 
      animation: 'fadeInUp 0.3s ease',
      maxHeight: '70vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px',
        flexShrink: 0
      }}>
        <div style={{
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--accent-color)',
          color: 'white'
        }}>
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h2 style={{ 
          color: 'var(--text-primary)', 
          margin: 0, 
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          برنامه هفتگی
        </h2>
      </div>
      
      {/* نمای جدید: ستون مستقل برای هر روز با محور زمان کناری */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '70px repeat(7, 1fr)',
        gap: '0',
        flex: 1,
        overflow: 'auto',
        background: '#f1f5f9',
        border: '1px solid #cbd5e0',
        borderRadius: '12px'
      }}>
        {/* هدر‌ها */}
        <div style={{ background:'#1e3a8a', color:'#fff', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>ساعت</div>
        {days.map(d => (
          <div key={d} style={{ background:'#1e3a8a', color:'#fff', padding:'8px 4px', textAlign:'center', fontSize:'12px', fontWeight:600 }}>
            {d === 'Saturday' ? 'شنبه' : d === 'Sunday' ? 'یکشنبه' : d === 'Monday' ? 'دوشنبه' : d === 'Tuesday' ? 'سه‌شنبه' : d === 'Wednesday' ? 'چهارشنبه' : d === 'Thursday' ? 'پنج‌شنبه' : 'جمعه'}
          </div>
        ))}

        {/* ستون ساعت‌ها */}
        <div style={{ position:'relative', height: TOTAL_MINUTES * PIXELS_PER_MINUTE, borderRight:'1px solid #cbd5e0' }}>
          {hourMarks.map((h, i) => {
            const top = (i * 60) * PIXELS_PER_MINUTE;
            return (
              <div key={h} style={{ position:'absolute', top, height:60*PIXELS_PER_MINUTE, width:'100%', fontSize:'10px', color:'#334155', display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, borderTop:'1px solid #94a3b8' }} />
                <span style={{ background:'#1e3a8a', color:'#fff', padding:'2px 4px', borderRadius:4, marginTop:2 }}>{h}</span>
              </div>
            );
          })}
        </div>

        {/* ستون‌های روزها */}
        {days.map(day => {
          // استخراج رویدادهای این روز و تبدیل به event objects با محاسبات مکان
            const events = schedule.sections.flatMap(sec =>
              sec.schedule
                .filter(s => s.day === day)
                .map(s => ({
                  course: sec,
                  slot: s,
                  startOffset: fromStart(s.start),
                  length: duration(s.start, s.end)
                }))
            ).filter(e => e.startOffset < TOTAL_MINUTES && e.length > 0);

            // مدیریت همپوشانی: sort و اختصاص ستون
            events.sort((a,b) => a.startOffset - b.startOffset || b.length - a.length);
            interface LEvent { course: typeof events[number]['course']; slot: typeof events[number]['slot']; startOffset:number; length:number; col:number; }
            const placed: LEvent[] = [];
            events.forEach(ev => {
              let col = 0;
              while (placed.some(p => p.col === col && !(ev.startOffset >= p.startOffset + p.length || ev.startOffset + ev.length <= p.startOffset))) {
                col++;
              }
              placed.push({ ...ev, col });
            });
            const maxCol = placed.reduce((m,e) => Math.max(m,e.col),0) + 1;

            return (
              <div key={day} style={{ position:'relative', height: TOTAL_MINUTES * PIXELS_PER_MINUTE, borderRight:'1px solid #cbd5e0', background:'#fff' }}>
                {/* خطوط افقی هر ساعت */}
                {hourMarks.map((h,i) => (
                  <div key={h} style={{ position:'absolute', top:(i*60)*PIXELS_PER_MINUTE, left:0, right:0, height:0, borderTop:'1px solid #e2e8f0' }} />
                ))}
                {/* نیم ساعت‌ها */}
                {hourMarks.slice(0,-1).map((h,i) => (
                  <div key={h+'-half'} style={{ position:'absolute', top:(i*60+30)*PIXELS_PER_MINUTE, left:0, right:0, height:0, borderTop:'1px dashed #f1f5f9' }} />
                ))}
                {placed.map(ev => {
                  const { course, slot, startOffset, length, col } = ev;
                  const top = startOffset * PIXELS_PER_MINUTE;
                  const height = length * PIXELS_PER_MINUTE;
                  const widthPercent = 100 / maxCol;
                  const leftPercent = col * widthPercent;
                  return (
                    <div
                      key={course.courseCode + slot.start + col}
                      onClick={() => copyCourseCode(`${course.courseCode}_${course.sectionCode}`)}
                      title={`${course.courseName} - ${course.professor.name} (${slot.start}-${slot.end})`}
                      style={{
                        position:'absolute',
                        top,
                        left: leftPercent + '%',
                        width: `calc(${widthPercent}% - 4px)`,
                        height: Math.max(18,height - 2),
                        background: colorMap[course.courseCode],
                        color:'#fff',
                        fontSize:'10px',
                        padding:'4px 6px',
                        borderRadius:'8px',
                        boxShadow:'0 4px 12px rgba(0,0,0,0.35)',
                        border:'1px solid rgba(255,255,255,0.4)',
                        boxSizing:'border-box',
                        overflow:'hidden',
                        cursor:'pointer',
                        transition:'all .2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.zIndex='20'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.zIndex='1'; }}
                    >
                      <div style={{ fontWeight:700, fontSize:'11px', lineHeight:1.1, marginBottom:2, textShadow:'0 1px 2px rgba(0,0,0,.6)' }}>
                        {course.courseName.length>18?course.courseName.slice(0,17)+'…':course.courseName}
                      </div>
                      <div style={{ fontSize:'9px', opacity:.9, display:'flex', alignItems:'center', gap:4 }}>
                        <span>{slot.start}-{slot.end}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
        })}
      </div>
      
      <div className="legend" style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: 'var(--bg-accent)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: 'var(--text-primary)',
          fontWeight: '600',
          fontSize: '12px'
        }}>
          <svg className="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
            <path d="M12,17h0"/>
          </svg>
          راهنما:
        </div>
        <span style={{ 
          color: 'var(--text-secondary)',
          fontSize: '11px'
        }}>
          بر روی هر درس کلیک کنید تا کد درس کپی شود
        </span>
      </div>
    </div>
  );
};
export default CalendarView;
