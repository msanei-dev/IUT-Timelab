import React, { useState, useEffect, useMemo } from 'react';
import { Crown, SlidersHorizontal } from 'lucide-react';
import { CourseGroup, PreferenceWeights } from './shared/types';

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

// Legacy downstream scoring expects course-level preferences.
export interface CoursePreference {
  courseCode: string;
  courseName: string;
  priority: number; // derived from group order (1 = highest)
  professorRatings: Record<string, number>;
  timeSlotRatings: Record<string, number>;
}

// New group preference structure stored in UI state
interface GroupPreference {
  groupId: string;
  groupName: string;
  priority: number; // order-based
  professorRatings: Record<string, number>; // aggregated unique professors across group
  timeSlotRatings: Record<string, number>;  // aggregated unique time slots across group
}

interface PreferencePanelProps {
  courses: Course[];
  courseGroups: CourseGroup[];
  onPreferencesChange: (preferences: CoursePreference[]) => void;
  weights: PreferenceWeights;
  onWeightsChange: (w: PreferenceWeights) => void;
  onGroupOrderChange?: (orderedIds: string[]) => void; // new: notify parent of reordered group IDs
  selectedFaculty?: string | null; // فیلتر دانشکده انتخابی
}

const PreferencePanel: React.FC<PreferencePanelProps> = ({ 
  courses, 
  courseGroups,
  onPreferencesChange,
  weights,
  onWeightsChange,
  onGroupOrderChange,
  selectedFaculty
}) => {
  const [groupPrefs, setGroupPrefs] = useState<GroupPreference[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Index courses by code for fast lookup
  const courseIndex = useMemo(()=>{
    const m: Record<string, Course> = {};
    for (const c of courses) m[c.courseCode] = c; return m;
  }, [courses]);

  // Build / merge group preferences when courseGroups change (with persistence)
  useEffect(()=>{
    // Load persisted ratings once per rebuild
    let stored: GroupPreference[] = [];
    try {
      const raw = localStorage.getItem('groupPreferencesV1');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    const storedMap: Record<string, GroupPreference> = {};
    for (const gp of stored) storedMap[gp.groupId] = gp;

    const next: GroupPreference[] = courseGroups.map((g, idx) => {
      // Collect current professors & time slots
      const profDefaults: Record<string, number> = {};
      const timeDefaults: Record<string, number> = {};
      for (const code of g.courseCodes) {
        const course = courseIndex[code]; if (!course) continue;
        
        // فیلتر بر اساس دانشکده انتخاب شده
        const shouldInclude = !selectedFaculty || 
          (course.courseCode && course.courseCode.toString().startsWith(selectedFaculty));
        
        if (!shouldInclude) continue;
        
        for (const section of course.sections) {
          if (!(section.professor.name in profDefaults)) profDefaults[section.professor.name] = 3;
          for (const slot of section.schedule) {
            const key = `${slot.day}-${slot.start}-${slot.end}`;
            if (!(key in timeDefaults)) timeDefaults[key] = 3;
          }
        }
      }
      const existing = groupPrefs.find(p => p.groupId === g.id) || storedMap[g.id];
      if (existing) {
        // merge in any new professors / time slots with default rating 3
        const mergedProf: Record<string, number> = { ...profDefaults, ...existing.professorRatings };
        const mergedTime: Record<string, number> = { ...timeDefaults, ...existing.timeSlotRatings };
        return { ...existing, groupName: g.name, priority: idx+1, professorRatings: mergedProf, timeSlotRatings: mergedTime };
      }
      return { groupId: g.id, groupName: g.name, priority: idx+1, professorRatings: profDefaults, timeSlotRatings: timeDefaults };
    });
    setGroupPrefs(next);
  }, [courseGroups, courseIndex, selectedFaculty]);

  // Persist group preferences when they change
  useEffect(()=>{
    try {
      localStorage.setItem('groupPreferencesV1', JSON.stringify(groupPrefs));
    } catch {}
  }, [groupPrefs]);

  // Propagate flattened course preferences to parent whenever groupPrefs change
  useEffect(()=>{
    const flattened: CoursePreference[] = [];
    // group priority: earlier index higher priority (priority field is index+1)
    const ordered = [...groupPrefs].sort((a,b)=>a.priority-b.priority);
    ordered.forEach((gp, orderIdx) => {
      for (const group of courseGroups.filter(g=>g.id===gp.groupId)) {
        for (const code of group.courseCodes) {
          const course = courseIndex[code]; if (!course) continue;
          // Filter ratings to only relevant professors/time slots for this course
          const pr: Record<string, number> = {};
            course.sections.forEach(sec => { if (gp.professorRatings[sec.professor.name]!=null) pr[sec.professor.name] = gp.professorRatings[sec.professor.name]; });
          const tr: Record<string, number> = {};
            course.sections.forEach(sec => sec.schedule.forEach(slot => { const key = `${slot.day}-${slot.start}-${slot.end}`; if (gp.timeSlotRatings[key]!=null) tr[key] = gp.timeSlotRatings[key]; }));
          flattened.push({ courseCode: course.courseCode, courseName: course.courseName, priority: orderIdx+1, professorRatings: pr, timeSlotRatings: tr });
        }
      }
    });
    onPreferencesChange(flattened);
  }, [groupPrefs, courseGroups, courseIndex, onPreferencesChange]);

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
    const arr = [...groupPrefs];
    const draggedItem = arr[draggedIndex];
    arr.splice(draggedIndex,1);
    arr.splice(dropIndex,0,draggedItem);
    // Reassign priority (index+1)
  const reassigned = arr.map((g,i)=> ({ ...g, priority: i+1 }));
  setGroupPrefs(reassigned);
  if (onGroupOrderChange) onGroupOrderChange(reassigned.map(g=>g.groupId));
    setDraggedIndex(null);
  };
  const updateProfessorRating = (groupId: string, professorName: string, rating: number) => {
    setGroupPrefs(gps => gps.map(g => g.groupId===groupId ? { ...g, professorRatings: { ...g.professorRatings, [professorName]: rating } }: g));
  };

  const updateTimeSlotRating = (groupId: string, slotKey: string, rating: number) => {
    setGroupPrefs(gps => gps.map(g => g.groupId===groupId ? { ...g, timeSlotRatings: { ...g.timeSlotRatings, [slotKey]: rating } }: g));
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

  if (courseGroups.length === 0) {
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
              color: 'var(--text-primary)', 
              marginBottom: '8px',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              ابتدا گروه بسازید
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              برای تنظیم اولویت و امتیاز اساتید / زمان‌ها ابتدا گروه‌های انتخابی را در بخش «انتخاب درس‌ها» بسازید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ 
      margin: '8px 0', 
      padding: '14px', 
      borderRadius: '8px',
      background: 'linear-gradient(145deg, rgba(17,24,39,0.6) 0%, rgba(17,24,39,0.35) 100%)',
      backdropFilter: 'blur(12px) saturate(140%)',
      WebkitBackdropFilter: 'blur(12px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 6px 20px -12px rgba(0,0,0,0.6)',
      animation: 'fadeInUp 0.35s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '14px' 
      }}>
        <div className="glass" style={{
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--primary-gradient)',
          boxShadow: '0 8px 26px -12px rgba(37,99,235,0.5)',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <Crown size={18} color="#fff" strokeWidth={2.2} />
        </div>
        <h2 style={{ 
          color: 'var(--text-primary)', 
          margin: 0, 
          fontSize: '1.1rem',
          fontWeight: 700
        }}>
          اولویت و امتیازدهی گروه‌ها
        </h2>
      </div>

  <div className="help-text" style={{
        marginBottom: '12px',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '6px',
        fontSize: '0.78rem',
        lineHeight: '1.4',
        color: 'rgba(220,225,235,0.8)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
          <path d="M12,17h0"/>
        </svg>
        <div>
          <strong>راهنما:</strong> گروه‌ها را با کشیدن مرتب کنید. گروه بالاتر اولویت بیشتری دارد.
          <br />
          ⭐ امتیاز 5: عالی | امتیاز 1: ضعیف
        </div>
      </div>

      {/* Weights Section */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
        gap:'12px',
        marginBottom:'16px',
        background:'rgba(255,255,255,0.04)',
        padding:'12px 14px 8px',
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:'8px'
      }}>
        {([
          { key:'professor', label:'اهمیت استاد' },
          { key:'timeSlot', label:'اهمیت زمان' },
          { key:'freeDay', label:'روز خالی' },
          { key:'compactness', label:'فشردگی برنامه' }
        ] as {key:keyof PreferenceWeights; label:string;}[]).map(item => (
          <div key={item.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--text-secondary)', display:'flex', justifyContent:'space-between' }}>
              <span>{item.label}</span>
              <span style={{ fontSize:'0.62rem', color:'var(--text-primary)' }}>{weights[item.key]}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[item.key]}
              onChange={e => onWeightsChange({ ...weights, [item.key]: Number(e.target.value) })}
              style={{ width:'100%' }}
            />
          </div>
        ))}
      </div>

      <div className="preferences-list">
        {groupPrefs.sort((a,b)=>a.priority-b.priority).map((gp, index) => {
          // Build dynamic lists for display (professors/time slots) from groupPref state
          const profEntries = Object.entries(gp.professorRatings);
          const slotEntries = Object.entries(gp.timeSlotRatings);
          return (
            <div
              key={gp.groupId}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="preference-item glass"
              style={{
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '8px',
                cursor: 'move',
                transition: 'all 0.3s ease',
                background: draggedIndex === index ? 'rgba(80,120,255,0.10)' : 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: draggedIndex === index ? '0 8px 16px -10px rgba(0,0,0,0.55)' : '0 1px 2px rgba(0,0,0,0.35)',
                transform: draggedIndex === index ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 6px 14px -4px rgba(0,0,0,0.55)';
                }
              }}
              onMouseLeave={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="priority-badge" style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg,#3d6bff,#274088)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '.5px',
                    minWidth: 30,
                    textAlign: 'center',
                    boxShadow: '0 1px 3px -1px rgba(0,0,0,0.5)'
                  }}>
                    {gp.priority}
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '0.95rem',
                      fontWeight: 600, 
                      color: 'var(--text-primary)'
                    }}>
                      {gp.groupName}
                    </h3>
                    <p style={{ 
                      margin: '2px 0 0 0', 
                      fontSize: '0.68rem',
                      letterSpacing: '.3px',
                      color: 'var(--text-secondary)'
                    }}>
                      {profEntries.length} استاد • {slotEntries.length} بازه زمانی
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedGroup(
                    expandedGroup === gp.groupId ? null : gp.groupId
                  )}
                  className="btn-modern"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {expandedGroup === gp.groupId ? (
                      <path d="M18 15l-6-6-6 6"/>
                    ) : (
                      <path d="M6 9l6 6 6-6"/>
                    )}
                  </svg>
                  {expandedGroup === gp.groupId ? 'بستن' : 'تنظیمات'}
                </button>
              </div>

              {expandedGroup === gp.groupId && (
                <div className="expanded-content" style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  animation: 'slideInLeft 0.3s ease'
                }}>
                  {/* Professor Ratings */}
                  <div style={{ marginBottom: '14px' }}>
                    <h4 className="section-title" style={{ 
                      fontSize: '.85rem', 
                      fontWeight: 600, 
                      marginBottom: '8px', 
                      color: 'rgba(230,235,245,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      letterSpacing: '.3px'
                    }}>
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      امتیاز اساتید:
                    </h4>
                    {profEntries
                      .filter(([profName]) => {
                        if (!selectedFaculty) return true;
                        // اگر دانشکده انتخاب شده، فقط استادهایی که در آن دانشکده تدریس می‌کنند نشان داده شوند
                        for (const code of courseGroups.find(cg => cg.id === gp.groupId)?.courseCodes || []) {
                          const course = courseIndex[code];
                          if (course && course.courseCode && course.courseCode.toString().startsWith(selectedFaculty)) {
                            if (course.sections.some(s => s.professor.name === profName)) {
                              return true;
                            }
                          }
                        }
                        return false;
                      })
                      .map(([profName]) => (
                      <div key={profName} className="rating-item" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 6,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.045)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.35)'
                      }}>
                        <span style={{ 
                          fontSize: '11.5px', 
                          color: 'rgba(240,245,255,0.9)',
                          fontWeight: 500,
                          letterSpacing: '.2px'
                        }}>
                          {profName}
                        </span>
                        <StarRating
                          rating={gp.professorRatings[profName] || 3}
                          onChange={(rating) => updateProfessorRating(gp.groupId, profName, rating)}
                          size="16px"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Time Slot Ratings */}
                  <div>
                    <h4 className="section-title" style={{ 
                      fontSize: '.85rem', 
                      fontWeight: 600, 
                      marginBottom: '10px', 
                      color: 'rgba(230,235,245,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      letterSpacing: '.3px'
                    }}>
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      امتیاز زمان‌بندی:
                    </h4>
                    {slotEntries
                      .filter(([slotKey]) => {
                        if (!selectedFaculty) return true;
                        // اگر دانشکده انتخاب شده، فقط زمان‌هایی که در آن دانشکده استفاده می‌شوند نشان داده شوند
                        for (const code of courseGroups.find(cg => cg.id === gp.groupId)?.courseCodes || []) {
                          const course = courseIndex[code];
                          if (course && course.courseCode && course.courseCode.toString().startsWith(selectedFaculty)) {
                            if (course.sections.some(s => s.schedule.some(slot => {
                              const key = `${slot.day}-${slot.start}-${slot.end}`;
                              return key === slotKey;
                            }))) {
                              return true;
                            }
                          }
                        }
                        return false;
                      })
                      .map(([slotKey]) => (
                      <div key={slotKey} className="rating-item" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 6,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.045)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.35)'
                      }}>
                        <span style={{ 
                          fontSize: '11.5px', 
                          color: 'rgba(240,245,255,0.9)',
                          fontWeight: 500,
                          letterSpacing: '.2px'
                        }}>
                          {formatTimeSlot(slotKey)}
                        </span>
                        <StarRating
                          rating={gp.timeSlotRatings[slotKey] || 3}
                          onChange={(rating) => updateTimeSlotRating(gp.groupId, slotKey, rating)}
                          size="16px"
                        />
                      </div>
                    ))}
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
