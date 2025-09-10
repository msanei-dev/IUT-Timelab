import React, { useState, useEffect } from 'react';

interface Professor {
  name: string;
  takesAttendance: boolean;
  teachingQuality: 'excellent' | 'good' | 'average' | 'poor';
}

interface Section {
  sectionCode: string;
  professor: Professor;
  schedule: Array<{
    day: string;
    start: string;
    end: string;
  }>;
}

interface Course {
  courseName: string;
  courseCode: string;
  units: number;
  sections: Section[];
}

interface CoursePreference {
  courseCode: string;
  courseName: string;
  priority: number;
  professorRatings: Record<string, number>; // professor name -> rating (1-5)
  timeSlotRatings: Record<string, number>; // "day-start-end" -> rating (1-5)
}

interface PreferencePanelProps {
  courses: Course[];
  onPreferencesChange: (preferences: CoursePreference[]) => void;
  selectedCourses: string[];
}

const PreferencePanel: React.FC<PreferencePanelProps> = ({ 
  courses, 
  onPreferencesChange, 
  selectedCourses 
}) => {
  const [preferences, setPreferences] = useState<CoursePreference[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize preferences when selected courses change
  useEffect(() => {
    const filteredCourses = courses.filter(course => 
      selectedCourses.includes(course.courseName)
    );

    const newPreferences = filteredCourses.map((course, index) => {
      const existing = preferences.find(p => p.courseCode === course.courseCode);
      if (existing) return existing;

      const professorRatings: Record<string, number> = {};
      const timeSlotRatings: Record<string, number> = {};

      course.sections.forEach(section => {
        professorRatings[section.professor.name] = 3; // Default rating
        section.schedule.forEach(slot => {
          const slotKey = `${slot.day}-${slot.start}-${slot.end}`;
          timeSlotRatings[slotKey] = 3; // Default rating
        });
      });

      return {
        courseCode: course.courseCode,
        courseName: course.courseName,
        priority: index + 1,
        professorRatings,
        timeSlotRatings
      };
    });

    setPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  }, [selectedCourses, courses]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPreferences = [...preferences];
    const draggedItem = newPreferences[draggedIndex];
    
    // Remove dragged item
    newPreferences.splice(draggedIndex, 1);
    
    // Insert at new position
    newPreferences.splice(dropIndex, 0, draggedItem);
    
    // Update priorities
    const updatedPreferences = newPreferences.map((pref, index) => ({
      ...pref,
      priority: index + 1
    }));

    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);
    setDraggedIndex(null);
  };

  const updateProfessorRating = (courseCode: string, professorName: string, rating: number) => {
    const updatedPreferences = preferences.map(pref => {
      if (pref.courseCode === courseCode) {
        return {
          ...pref,
          professorRatings: {
            ...pref.professorRatings,
            [professorName]: rating
          }
        };
      }
      return pref;
    });

    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);
  };

  const updateTimeSlotRating = (courseCode: string, slotKey: string, rating: number) => {
    const updatedPreferences = preferences.map(pref => {
      if (pref.courseCode === courseCode) {
        return {
          ...pref,
          timeSlotRatings: {
            ...pref.timeSlotRatings,
            [slotKey]: rating
          }
        };
      }
      return pref;
    });

    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);
  };

  const StarRating: React.FC<{ rating: number; onChange: (rating: number) => void; size?: string }> = ({ 
    rating, 
    onChange,
    size = '16px' 
  }) => {
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = star <= rating ? 'scale(1.1)' : 'scale(1)';
            }}
          >
            <svg 
              width={size} 
              height={size} 
              viewBox="0 0 24 24" 
              fill={star <= rating ? "#fbbf24" : "none"}
              stroke={star <= rating ? "#fbbf24" : "#d1d5db"}
              strokeWidth="2"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
        ))}
        <span style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          marginLeft: '8px',
          minWidth: '20px'
        }}>
          {rating}/5
        </span>
      </div>
    );
  };

  const formatTimeSlot = (slotKey: string) => {
    const [day, start, end] = slotKey.split('-');
    const dayMap: Record<string, string> = {
      'Saturday': 'شنبه',
      'Sunday': 'یکشنبه',
      'Monday': 'دوشنبه',
      'Tuesday': 'سه‌شنبه',
      'Wednesday': 'چهارشنبه',
      'Thursday': 'پنج‌شنبه',
      'Friday': 'جمعه'
    };
    return `${dayMap[day] || day} ${start}-${end}`;
  };

  if (preferences.length === 0) {
    return (
      <div className="glass-card" style={{ 
        padding: '40px', 
        textAlign: 'center',
        margin: '20px 0',
        borderRadius: '16px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div className="glass" style={{
            padding: '16px',
            borderRadius: '50%',
            background: 'var(--warning-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg className="icon-lg text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ 
              color: 'var(--text-color)', 
              marginBottom: '8px',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              ابتدا درس‌هایتان را انتخاب کنید
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              برای تنظیم اولویت‌ها و امتیازدهی، ابتدا از بخش انتخاب درس، درس‌های مورد نظرتان را انتخاب کنید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ 
      margin: '16px 0', 
      padding: '24px', 
      borderRadius: '16px',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)',
      animation: 'fadeInUp 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        <div className="glass" style={{
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--primary-gradient)'
        }}>
          <svg className="icon text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18l-2 13H5L3 6z"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </div>
        <h2 style={{ 
          color: 'var(--text-color)', 
          margin: 0, 
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          تنظیمات اولویت درس‌ها
        </h2>
      </div>

      <div className="help-text" style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'var(--info-bg)',
        borderRadius: '12px',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
          <path d="M12,17h0"/>
        </svg>
        <div>
          <strong>راهنما:</strong> درس‌ها را با کشیدن مرتب کنید. درس بالاتر اولویت بیشتری دارد.
          <br />
          ⭐ امتیاز 5: عالی | امتیاز 1: ضعیف
        </div>
      </div>

      <div className="preferences-list">
        {preferences.map((pref, index) => {
          const course = courses.find(c => c.courseCode === pref.courseCode);
          if (!course) return null;

          return (
            <div
              key={pref.courseCode}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="preference-item glass"
              style={{
                padding: '16px',
                marginBottom: '12px',
                borderRadius: '12px',
                cursor: 'move',
                transition: 'all 0.3s ease',
                background: draggedIndex === index ? 'var(--primary-bg-light)' : 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: draggedIndex === index ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                transform: draggedIndex === index ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="priority-badge glass" style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '32px',
                    textAlign: 'center'
                  }}>
                    {pref.priority}
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.1rem',
                      fontWeight: '600', 
                      color: 'var(--text-color)' 
                    }}>
                      {pref.courseName}
                    </h3>
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)' 
                    }}>
                      {course.units} واحد
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedCourse(
                    expandedCourse === pref.courseCode ? null : pref.courseCode
                  )}
                  className="btn-modern btn-secondary"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {expandedCourse === pref.courseCode ? (
                      <path d="M18 15l-6-6-6 6"/>
                    ) : (
                      <path d="M6 9l6 6 6-6"/>
                    )}
                  </svg>
                  {expandedCourse === pref.courseCode ? 'بستن' : 'تنظیمات'}
                </button>
              </div>

              {expandedCourse === pref.courseCode && (
                <div className="expanded-content" style={{ 
                  marginTop: '20px', 
                  paddingTop: '20px', 
                  borderTop: '1px solid var(--glass-border)',
                  animation: 'slideInLeft 0.3s ease'
                }}>
                  {/* Professor Ratings */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 className="section-title" style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      marginBottom: '12px', 
                      color: 'var(--text-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      امتیاز اساتید:
                    </h4>
                    {course.sections.map(section => (
                      <div key={section.sectionCode} className="rating-item glass" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        padding: '12px',
                        background: 'var(--secondary-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)'
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-color)',
                          fontWeight: '500'
                        }}>
                          {section.professor.name}
                        </span>
                        <StarRating
                          rating={pref.professorRatings[section.professor.name] || 3}
                          onChange={(rating) => updateProfessorRating(pref.courseCode, section.professor.name, rating)}
                          size="16px"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Time Slot Ratings */}
                  <div>
                    <h4 className="section-title" style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      marginBottom: '12px', 
                      color: 'var(--text-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      امتیاز زمان‌بندی:
                    </h4>
                    {course.sections.map(section => 
                      section.schedule.map(slot => {
                        const slotKey = `${slot.day}-${slot.start}-${slot.end}`;
                        return (
                          <div key={slotKey} className="rating-item glass" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                            padding: '12px',
                            background: 'var(--success-bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)'
                          }}>
                            <span style={{ 
                              fontSize: '14px', 
                              color: 'var(--text-color)',
                              fontWeight: '500'
                            }}>
                              {formatTimeSlot(slotKey)}
                            </span>
                            <StarRating
                              rating={pref.timeSlotRatings[slotKey] || 3}
                              onChange={(rating) => updateTimeSlotRating(pref.courseCode, slotKey, rating)}
                              size="16px"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreferencePanel;
