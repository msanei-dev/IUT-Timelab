import React from 'react';
import type { Schedule, Day, ScheduleSection } from './shared/types';

const days: Day[] = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const hours = Array.from({length: 11}, (_, i) => 8 + i); // 8:00 to 18:00

function timeToRow(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h - 8) + (m >= 30 ? 0.5 : 0);
}

const colorList = [
  '#667eea',
  '#f093fb', 
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#a8edea',
  '#ff9a9e',
  '#a18cd1',
  '#fad0c4',
  '#ffecd2'
];

const CalendarView: React.FC<{schedule: Schedule}> = ({ schedule }) => {
  // Map each section to a color
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  for (const sec of schedule.sections) {
    if (!colorMap[sec.courseCode]) {
      colorMap[sec.courseCode] = colorList[colorIdx % colorList.length];
      colorIdx++;
    }
  }

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
          background: var(--primary-gradient);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
    <div className="glass-card" style={{
      flex: 1, 
      borderRadius: '16px', 
      padding: '16px', 
      margin: '16px 0', 
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)',
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
        <div className="glass" style={{
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--primary-gradient)'
        }}>
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h2 style={{ 
          color: 'var(--text-color)', 
          margin: 0, 
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          برنامه هفتگی
        </h2>
      </div>
      
      <div className="calendar-container" style={{ 
        overflowX: 'auto', 
        overflowY: 'auto',
        borderRadius: '12px',
        flex: 1,
        direction: 'ltr'
      }}>
        <table className="modern-table" style={{ 
          width: '100%',
          minWidth: '800px',
          tableLayout: 'fixed',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr>
              <th style={{
                width: '80px',
                padding: '16px 12px',
                background: '#2c5364',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </th>
              {days.map(day => 
                <th key={day} style={{
                  padding: '12px 8px',
                  background: '#2c5364',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '13px',
                  textAlign: 'center',
                  width: '14%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <svg className="icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                    </svg>
                    {day === 'Saturday' ? 'شنبه' :
                     day === 'Sunday' ? 'یکشنبه' :
                     day === 'Monday' ? 'دوشنبه' :
                     day === 'Tuesday' ? 'سه‌شنبه' :
                     day === 'Wednesday' ? 'چهارشنبه' :
                     day === 'Thursday' ? 'پنج‌شنبه' :
                     day === 'Friday' ? 'جمعه' : day}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {hours.map(h => (
              <tr key={h}>
                <td style={{
                  textAlign: 'center',
                  color: 'var(--text-color)',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '12px 8px',
                  background: 'var(--secondary-bg)',
                  borderBottom: '1px solid var(--border-light)',
                  width: '60px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span>{h}:00</span>
                    <div style={{ 
                      width: '2px', 
                      height: '15px', 
                      background: 'var(--primary-gradient)', 
                      borderRadius: '1px' 
                    }}></div>
                  </div>
                </td>
                {days.map(day => (
                  <td key={day} style={{
                    position: 'relative',
                    height: '50px',
                    padding: '4px',
                    verticalAlign: 'top',
                    background: h % 2 === 0 ? 'transparent' : 'var(--secondary-bg)',
                    borderBottom: '1px solid var(--border-light)',
                    width: '14%'
                  }}>
                    {schedule.sections.flatMap((sec, i) =>
                      sec.schedule.filter(slot => slot.day === day && parseInt(slot.start) === h)
                        .map(slot => (
                          <div key={sec.courseCode + slot.start}
                            className="course-card"
                            style={{
                              position: 'absolute',
                              left: '2px',
                              right: '2px',
                              top: '2px',
                              bottom: '2px',
                              background: colorMap[sec.courseCode],
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '10px',
                              padding: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                              zIndex: 2,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title={`${sec.courseName} - ${sec.professor.name} (${slot.start} - ${slot.end}) - کلیک برای کپی کد: ${sec.courseCode}`}
                            onClick={() => copyCourseCode(sec.courseCode)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.zIndex = '10';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.zIndex = '2';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '2px',
                              marginBottom: '2px'
                            }}>
                              <svg className="icon-sm" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                              </svg>
                              <div style={{ 
                                fontWeight: '700', 
                                fontSize: '9px',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}>
                                {sec.courseName.length > 8 ? sec.courseName.substring(0, 8) + '...' : sec.courseName}
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '2px',
                              marginBottom: '1px'
                            }}>
                              <svg className="icon-sm" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                              </svg>
                              <div style={{ 
                                fontSize: '8px', 
                                opacity: 0.95,
                                fontWeight: '600',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                              }}>
                                {slot.start}-{slot.end}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="legend" style={{
        marginTop: '12px',
        padding: '10px',
        background: 'var(--info-bg)',
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
          color: 'var(--text-color)',
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
          بر روی هر درس کلیک کنید تا جزئیات بیشتری مشاهده کنید
        </span>
      </div>
    </div>
  );
};
export default CalendarView;
