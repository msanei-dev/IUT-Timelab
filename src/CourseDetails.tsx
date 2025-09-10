import React from 'react';

interface Props {
  courses: any;
}

const CourseDetails: React.FC<Props> = ({ courses }) => {
  if (!courses || !courses.courses) return null;

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
        {courses.courses.map((course: any, idx: number) => (
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
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetails;
