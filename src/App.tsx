import React, { useEffect, useState } from 'react';
import type { Schedule } from './shared/types';
import CourseSelector from './CourseSelector';
import CalendarView from './CalendarView';
import PlanNavigator from './PlanNavigator';
import DataInput from './DataInput';
import PreferencePanel from './PreferencePanel';

const api = (window as any).api;

const App: React.FC = () => {
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [courses, setCourses] = useState<{courses: any[]} | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'preferences'>('courses');

  useEffect(() => {
    api.getCourseNames().then(setCourseNames);
    api.getData().then(setCourses);
  }, []);

  const generateSchedules = async () => {
    setLoading(true);
    // Pass preferences to the scheduling algorithm
    const result = await api.getRankedSchedules(selected, preferences);
    setSchedules(result);
    setCurrentIdx(0);
    setLoading(false);
  };

  const clearAllData = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه داده‌ها را حذف کنید؟\nاین عمل قابل بازگشت نیست.')) {
      try {
        // Clear data on server
        await api.saveData({ courses: [] });
        
        // Reset local state
        setCourseNames([]);
        setCourses(null);
        setSelected([]);
        setSchedules([]);
        setPreferences([]);
        setCurrentIdx(0);
        
        alert('همه داده‌ها با موفقیت حذف شدند!');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('خطا در حذف داده‌ها');
      }
    }
  };

  const handleDataSubmit = async (rawData: string) => {
    try {
      // پارس کردن داده‌های خام به فرمت JSON
      const parsedData = parseTableData(rawData);
      
      // ارسال داده‌ها به main process برای ذخیره‌سازی
      await api.saveData(parsedData);
      
      // به‌روزرسانی لیست درس‌ها
      const updatedCourses = await api.getCourseNames();
      setCourseNames(updatedCourses);
      
      // به‌روزرسانی داده‌های کامل درس‌ها
      const fullCourseData = await api.getData();
      setCourses(fullCourseData);
      
      alert('داده‌ها با موفقیت ذخیره شدند!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('خطا در ذخیره‌سازی داده‌ها');
    }
  };

  const parseTableData = (data: string) => {
    console.log('Parsing data:', data); // Debug log
    
    // پارس کردن داده‌های جدولی به فرمت JSON
    const lines = data.trim().split('\n');
    if (lines.length < 1) return { courses: [] };
    
    const coursesMap = new Map(); // برای گروه‌بندی section های یک درس
    let currentCourse: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      console.log('Processing line:', line); // Debug log

      // بررسی آیا خط شروع یک section جدید است
      if (line.includes('\t') && line.match(/^\d+_\d+\t/)) {
        // پارس کردن خط section جدید
        const parts = line.split('\t');
        const fullCourseCode = parts[0].trim(); // مثل: ۵۰۱۶۰۲۴_۰۳
        const courseName = parts[1].trim();
        const units = parseInt(parts[2]) || 3;
        const professor = parts[8]?.trim() || 'نامشخص';

        // استخراج کد اصلی درس (بدون section)
        const baseCourseCode = fullCourseCode.split('_')[0]; // مثل: ۵۰۱۶۰۲۴
        const sectionCode = fullCourseCode.split('_')[1] || '01'; // مثل: ۰۳

        // اگر این درس قبلاً وجود نداشته، ایجاد کن
        if (!coursesMap.has(baseCourseCode)) {
          coursesMap.set(baseCourseCode, {
            courseName: `${courseName} (${baseCourseCode})`,
            courseCode: baseCourseCode,
            units: units,
            sections: []
          });
        }

        // ایجاد section جدید
        const newSection = {
          sectionCode: sectionCode,
          professor: {
            name: professor,
            takesAttendance: true,
            teachingQuality: 'good' as const
          },
          schedule: [] as any[]
        };

        // اضافه کردن section به درس
        coursesMap.get(baseCourseCode).sections.push(newSection);
        currentCourse = { courseCode: baseCourseCode, sectionIndex: coursesMap.get(baseCourseCode).sections.length - 1 };
        
        console.log('Created new section:', newSection, 'for course:', baseCourseCode); // Debug log
      } else if (currentCourse && (line.includes('درس(ت):') || line.includes('درس(ع):'))) {
        // پردازش خطوط زمان‌بندی
        console.log('Processing schedule line:', line); // Debug log
        const timeSlots = extractTimeSlots(line);
        console.log('Extracted time slots:', timeSlots); // Debug log
        
        const course = coursesMap.get(currentCourse.courseCode);
        if (course && course.sections[currentCourse.sectionIndex]) {
          course.sections[currentCourse.sectionIndex].schedule.push(...timeSlots);
        }
      }
    }

    // تبدیل Map به Array
    const courses = Array.from(coursesMap.values());
    
    console.log('Final parsed courses:', courses); // Debug log
    return { courses };
  };

  const extractTimeSlots = (scheduleText: string) => {
    const timeSlots = [];
    const dayMap: Record<string, string> = {
      'شنبه': 'Saturday',
      'يك شنبه': 'Sunday',
      'یک شنبه': 'Sunday', 
      'دوشنبه': 'Monday',
      'سه شنبه': 'Tuesday',
      'سه‌شنبه': 'Tuesday',
      'چهارشنبه': 'Wednesday',
      'چهار شنبه': 'Wednesday',
      'پنج شنبه': 'Thursday',
      'پنج‌شنبه': 'Thursday',
      'جمعه': 'Friday'
    };

    // الگوی بهبود یافته برای پارس کردن زمان‌بندی
    // پشتیبانی از فرمت فارسی: "درس(ت):" یا "درس(ع):" + "روز ۱۱:۰۰-۱۲:۳۰"
    const timePattern = /(درس\([تع]\):\s*)(شنبه|يك شنبه|یک شنبه|دوشنبه|سه شنبه|سه‌شنبه|چهارشنبه|چهار شنبه|پنج شنبه|پنج‌شنبه|جمعه)\s+([۰-۹\d]{1,2}:[۰-۹\d]{2})-([۰-۹\d]{1,2}:[۰-۹\d]{2})/g;
    
    // تابع تبدیل اعداد فارسی به انگلیسی
    const persianToEnglish = (str: string) => {
      return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    };
    
    let match;
    while ((match = timePattern.exec(scheduleText)) !== null) {
      const dayPersian = match[2];  // تغییر index به خاطر گروه جدید
      let startTime = match[3];
      let endTime = match[4];
      
      // تبدیل اعداد فارسی به انگلیسی
      startTime = persianToEnglish(startTime);
      endTime = persianToEnglish(endTime);
      
      const day = dayMap[dayPersian];
      if (day) {
        timeSlots.push({
          day: day as any,
          start: startTime,
          end: endTime
        });
      }
    }

    return timeSlots;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'Estedad, sans-serif',
      background: 'var(--primary-gradient)',
      padding: '24px',
      gap: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Sidebar */}
      <div className="glass" style={{
        width: 450,
        padding: '32px 28px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        animation: 'slideInLeft 0.6s ease-out'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'var(--accent-gradient)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-medium)'
          }}>
            <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '800',
            margin: '0 0 8px 0',
            color: 'var(--text-primary)'
          }}>
            برنامه‌ساز هوشمند
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            margin: 0,
            fontWeight: '400'
          }}>
            ساخت برنامه کلاسی هوشمند و بهینه
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card" style={{
          display: 'flex',
          marginBottom: '28px',
          padding: '6px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('courses')}
            className={`btn-modern ${activeTab === 'courses' ? 'btn-primary' : 'btn-glass'}`}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            انتخاب درس‌ها
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`btn-modern ${activeTab === 'preferences' ? 'btn-primary' : 'btn-glass'}`}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            تنظیمات ترجیحات
          </button>
        </div>

        {activeTab === 'courses' ? (
          <div className="glass-card" style={{ padding: '24px' }}>
            <DataInput onDataSubmit={handleDataSubmit} />
            
            {courseNames.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <CourseSelector
                  courseNames={courseNames}
                  selected={selected}
                  setSelected={setSelected}
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button 
                onClick={generateSchedules} 
                disabled={selected.length === 0 || loading} 
                className="btn-modern btn-success"
                style={{
                  flex: 2,
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                {loading ? 'در حال تولید...' : 'تولید برنامه کلاسی'}
              </button>
              
              <button 
                onClick={clearAllData}
                disabled={loading}
                className="btn-modern btn-danger"
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '50px'
                }}
                title="حذف همه داده‌ها"
              >
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '24px' }}>
            <PreferencePanel
              courses={courses?.courses || []}
              selectedCourses={selected}
              onPreferencesChange={setPreferences}
            />
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="glass" style={{
        flex: 1,
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {schedules.length > 0 ? (
          <>
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
                
                <PlanNavigator
                  currentIdx={currentIdx}
                  setCurrentIdx={setCurrentIdx}
                  total={schedules.length}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, marginBottom: '24px' }}>
              <CalendarView schedule={schedules[currentIdx]} />
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'var(--secondary-gradient)',
              borderRadius: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-medium)',
              animation: 'pulse 2s infinite'
            }}>
              <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              آماده برای شروع!
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '400px',
              lineHeight: '1.6',
              margin: 0
            }}>
              لطفاً اطلاعات درس‌ها را وارد کرده، درس‌های مورد نظر و ترجیحات خود را انتخاب کنید
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
