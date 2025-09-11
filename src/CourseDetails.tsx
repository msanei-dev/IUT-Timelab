import React from 'react';

interface Props {
  courses: any;
  // Optional: if provided, only show courses whose courseCode is in this list (active groups)
  activeCourseCodes?: string[];
}

const CourseDetails: React.FC<Props> = ({ courses, activeCourseCodes }) => {
  // قبلاً اگر courses به صورت آرایه (فرمت هوک useCourseData) بود به خاطر نبودن courses.courses مقدار null برمی‌گشت و هیچ چیزی نمایش داده نمی‌شد.
  // این گارد را اصلاح می‌کنیم تا هم آرایه و هم آبجکت { courses: [...] } را پشتیبانی کند.
  if (!courses) return null;

  const formatSchedule = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return 'زمان‌بندی نامشخص';
    
    return schedule.map(slot => {
      const dayNames: { [key: string]: string } = {
        'Saturday': 'شنبه',
        'Sunday': 'یکشنبه',
        'Monday': 'دوشنبه',
        'Tuesday': 'سه‌شنبه',
        'Wednesday': 'چهارشنبه',
        'Thursday': 'پنج‌شنبه',
        'Friday': 'جمعه'
      };
      
      return `${dayNames[slot.day] || slot.day} ${slot.start}-${slot.end}`;
    }).join(', ');
  };

  // Filter by active groups if activeCourseCodes provided
  const courseList = Array.isArray(courses) ? courses : courses.courses;

  const activeProvided = typeof activeCourseCodes !== 'undefined';
  const activeSet = new Set(
    (activeCourseCodes || []).map(c => c != null ? String(c) : '')
  );

  const filtered = activeProvided
    ? (activeSet.size === 0 ? [] : courseList.filter((c: any) => activeSet.has(String(c.courseCode))))
    : courseList;

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      background: 'var(--surface-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)'
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '16px',
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        جزئیات دروس و زمان‌بندی
      </h3>
      
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '13px'
      }}>
  {activeProvided && activeSet.size===0 && (
        <div style={{ fontSize:'12px', color:'var(--text-secondary)', textAlign:'center', padding:'12px' }}>
          هیچ درسی انتخاب نشده است.
        </div>
      )}
      {filtered.map((course: any, idx: number) => (
          <div key={idx} style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--surface-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              {course.courseName} ({course.courseCode})
            </div>
            
            {course.sections.map((section: any, sIdx: number) => (
              <div key={sIdx} style={{
                marginLeft: '12px',
                marginBottom: '6px',
                padding: '8px',
                background: 'var(--surface-tertiary)',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                  گروه {section.sectionCode} - استاد: {section.professor.name}
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatSchedule(section.schedule)}
                </div>
                {section.notes && (
                  <div style={{ color: 'var(--text-primary)', marginTop: '6px', background:'rgba(255,255,255,0.06)', padding:'6px 8px', borderRadius:6 }}>
                    {section.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetails;
