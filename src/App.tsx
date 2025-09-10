import React, { useEffect, useState } from 'react';
import type { Schedule } from './shared/types';
import CourseSelector from './CourseSelector';
import CalendarView from './CalendarView';
import PlanNavigator from './PlanNavigator';
import DataInput from './DataInput';
import PreferencePanel from './PreferencePanel';
import CourseDetails from './CourseDetails';

const api = (window as any).api;

const App: React.FC = () => {
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [courses, setCourses] = useState<{courses: any[]} | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'preferences' | 'details'>('courses');
  
  // Map between display names and actual course names
  const [courseNameMapping, setCourseNameMapping] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // دریافت داده‌های کامل و ترکیب کد + نام
    api.getData().then((coursesData: any) => {
      setCourses(coursesData);
      if (coursesData && coursesData.courses) {
        const mapping = new Map<string, string>();
        const displayNames: string[] = [];
        
        // Generate separate entries for each section
        coursesData.courses.forEach((c: any) => {
          if (c.sections && c.sections.length > 0) {
            c.sections.forEach((section: any) => {
              const displayName = `${c.courseCode}_${section.sectionCode} - ${c.courseName}`;
              mapping.set(displayName, c.courseName); // Map display name to actual name
              displayNames.push(displayName);
            });
          } else {
            // Fallback for courses without sections
            const displayName = `${c.courseCode} - ${c.courseName}`;
            mapping.set(displayName, c.courseName);
            displayNames.push(displayName);
          }
        });
        
        setCourseNames(displayNames);
        setCourseNameMapping(mapping);
      }
    });
  }, []);

  const generateSchedules = async () => {
    setLoading(true);
    
    // Convert display names back to actual course names for API
    const actualCourseNames = selected.map(displayName => 
      courseNameMapping.get(displayName) || displayName
    );
    
    console.log('Selected display names:', selected);
    console.log('Actual course names for API:', actualCourseNames);
    
    // Pass preferences to the scheduling algorithm
    const result = await api.getRankedSchedules(actualCourseNames, preferences);
    
    console.log('Schedule generation result:', result);
    
    if (result.schedules && result.schedules.length > 0) {
      setSchedules(result.schedules);
      setCurrentIdx(0);
    } else if (result.conflicts) {
      // نمایش تداخل‌ها و پیشنهادات
      let message = `متأسفانه نمی‌توان برنامه کلاسی بدون تداخل برای دروس انتخابی ایجاد کرد.\n\n`;
      
      if (result.conflicts.conflicts.length > 0) {
        message += `تداخل‌های موجود:\n`;
        result.conflicts.conflicts.forEach((conflict: any, idx: number) => {
          message += `${idx + 1}. ${conflict.message}\n`;
        });
      }
      
      if (result.conflicts.suggestions.length > 0) {
        message += `\nپیشنهادات:\n`;
        result.conflicts.suggestions.slice(0, 3).forEach((suggestion: any, idx: number) => {
          const formatSchedule = (schedule: any[]) => {
            const dayNames: { [key: string]: string } = {
              'Saturday': 'شنبه',
              'Sunday': 'یکشنبه',
              'Monday': 'دوشنبه',
              'Tuesday': 'سه‌شنبه',
              'Wednesday': 'چهارشنبه',
              'Thursday': 'پنج‌شنبه',
              'Friday': 'جمعه'
            };
            return schedule.map(s => `${dayNames[s.day]} ${s.start}-${s.end}`).join(', ');
          };
          
          message += `${idx + 1}. ${suggestion.course1} (گروه ${suggestion.section1}) + ${suggestion.course2} (گروه ${suggestion.section2})\n`;
        });
      }
      
      if (result.conflicts.coursesWithMultipleSections.length > 0) {
        message += `\nدروس با section های متعدد:\n`;
        result.conflicts.coursesWithMultipleSections.forEach((course: any) => {
          message += `- ${course.courseName}: ${course.sectionsCount} گروه\n`;
        });
        message += `\nلطفاً تب "جزئیات دروس" را بررسی کنید تا زمان‌بندی تمام گروه‌ها را ببینید.`;
      }
      
      alert(message);
      setSchedules([]);
    } else {
      alert('خطا در تولید برنامه کلاسی');
      setSchedules([]);
    }
    
    setLoading(false);
  };

  const clearAllData = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه داده‌ها را حذف کنید؟\nاین عمل قابل بازگشت نیست.')) {
      try {
        // Clear data on server - فرستادن آرایه خالی
        await api.saveData({ courses: [] });
        
        // Reset local state
        setCourseNames([]);
        setCourses({ courses: [] });
        setSelected([]);
        setSchedules([]);
        setPreferences([]);
        setCurrentIdx(0);
        setCourseNameMapping(new Map());
        
        console.log('All data cleared successfully'); // Debug log
        alert('همه داده‌ها با موفقیت حذف شدند!');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('خطا در حذف داده‌ها');
      }
    }
  };

  const importFromExcel = async () => {
    try {
      setLoading(true);
      
      // انتخاب فایل
      const fileResult = await api.importExcel();
      
      if (!fileResult.success) {
        alert(fileResult.message);
        return;
      }
      
      // پردازش فایل
      const processResult = await api.processExcelData(fileResult.fileBuffer);
      
      if (processResult.success) {
        // به‌روزرسانی state با داده‌های جدید
        setCourses(processResult.data);
        
        // ترکیب courseCode و courseName برای نمایش و فیلتر
        const mapping = new Map<string, string>();
        const displayNames: string[] = [];
        
        // Generate separate entries for each section
        processResult.data.courses.forEach((c: any) => {
          if (c.sections && c.sections.length > 0) {
            c.sections.forEach((section: any) => {
              const displayName = `${c.courseCode}_${section.sectionCode} - ${c.courseName}`;
              mapping.set(displayName, c.courseName);
              displayNames.push(displayName);
            });
          } else {
            // Fallback for courses without sections
            const displayName = `${c.courseCode} - ${c.courseName}`;
            mapping.set(displayName, c.courseName);
            displayNames.push(displayName);
          }
        });
        
        setCourseNames(displayNames);
        setCourseNameMapping(mapping);
        
        setSelected([]);
        setSchedules([]);
        setCurrentIdx(0);
        
        alert(processResult.message);
      } else {
        alert(processResult.message);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('خطا در خواندن فایل اکسل');
    } finally {
      setLoading(false);
    }
  };

  const handleDataSubmit = async (rawData: string) => {
    try {
      console.log('Raw data received:', rawData); // Debug log
      
      // پارس کردن داده‌های خام به فرمت JSON
      const newParsedData = parseTableData(rawData);
      
      console.log('New parsed data:', newParsedData); // Debug log
      
      if (!newParsedData.courses || newParsedData.courses.length === 0) {
        alert('هیچ درسی شناسایی نشد! لطفاً فرمت داده‌ها را بررسی کنید.');
        return;
      }
      
      // دریافت داده‌های موجود
      const existingData = await api.getData();
      console.log('Existing data:', existingData); // Debug log
      
      // ادغام داده‌های جدید با موجود
      const mergedCourses = [...(existingData.courses || [])];
      
      for (const newCourse of newParsedData.courses) {
        const existingIndex = mergedCourses.findIndex(c => c.courseCode === newCourse.courseCode);
        if (existingIndex >= 0) {
          // اگر درس موجود بود، section های جدید رو اضافه کن
          const existingCourse = mergedCourses[existingIndex];
          for (const newSection of newCourse.sections) {
            const sectionExists = existingCourse.sections.some((s: any) => s.sectionCode === newSection.sectionCode);
            if (!sectionExists) {
              existingCourse.sections.push(newSection);
            }
          }
        } else {
          // اگر درس جدید بود، کل درس رو اضافه کن
          mergedCourses.push(newCourse);
        }
      }
      
      const finalData = { courses: mergedCourses };
      console.log('Final merged data:', finalData); // Debug log
      
      // ذخیره‌سازی داده‌های ادغام شده
      await api.saveData(finalData);
      
      // به‌روزرسانی داده‌های کامل درس‌ها
      const fullCourseData = await api.getData();
      setCourses(fullCourseData);
      
      // به‌روزرسانی لیست درس‌ها با ترکیب کد و نام
      const mapping = new Map<string, string>();
      const displayNames: string[] = [];
      
      // Generate separate entries for each section
      fullCourseData.courses.forEach((c: any) => {
        if (c.sections && c.sections.length > 0) {
          c.sections.forEach((section: any) => {
            const displayName = `${c.courseCode}_${section.sectionCode} - ${c.courseName}`;
            mapping.set(displayName, c.courseName);
            displayNames.push(displayName);
          });
        } else {
          // Fallback for courses without sections
          const displayName = `${c.courseCode} - ${c.courseName}`;
          mapping.set(displayName, c.courseName);
          displayNames.push(displayName);
        }
      });
      
      setCourseNames(displayNames);
      setCourseNameMapping(mapping);
      
      console.log('Updated course data:', fullCourseData); // Debug log
      
      alert(`داده‌ها با موفقیت ذخیره شدند! ${newParsedData.courses.length} درس جدید اضافه شد. مجموع: ${finalData.courses.length} درس`);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('خطا در ذخیره‌سازی داده‌ها: ' + error.message);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      console.log('File content:', text); // Debug log
      
      // Process the file content same as manual input
      await handleDataSubmit(text);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('خطا در خواندن فایل: ' + error.message);
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
        console.log('Parsed parts:', parts); // Debug log
        
        const fullCourseCode = parts[0].trim(); // مثل: ۵۰۱۶۰۲۴_۰۳
        const courseName = parts[1].trim();
        const units = parseInt(parts[2]) || 3;
        const professor = parts[8]?.trim() || 'نامشخص';

        console.log(`Course: ${fullCourseCode}, Name: ${courseName}, Professor: ${professor}`); // Debug log

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
      } else if (currentCourse && (line.includes('درس(ت):') || line.includes('درس(ع):') || 
                 (line.includes('شنبه') || line.includes('دوشنبه') || line.includes('سه شنبه') || 
                  line.includes('چهارشنبه') || line.includes('پنج شنبه') || line.includes('جمعه') || 
                  line.includes('یک شنبه') || line.includes('يك شنبه')))) {
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
    console.log('Extracting time slots from:', scheduleText); // Debug log
    
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
    const timePattern = /(شنبه|يك شنبه|یک شنبه|دوشنبه|سه شنبه|سه‌شنبه|چهارشنبه|چهار شنبه|پنج شنبه|پنج‌شنبه|جمعه)\s+([۰-۹\d]{1,2}:[۰-۹\d]{2})-([۰-۹\d]{1,2}:[۰-۹\d]{2})/g;
    
    // تابع تبدیل اعداد فارسی به انگلیسی
    const persianToEnglish = (str: string) => {
      return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    };
    
    let match;
    while ((match = timePattern.exec(scheduleText)) !== null) {
      console.log('RegEx match found:', match); // Debug log
      
      const dayPersian = match[1];  // تغییر index
      let startTime = match[2];     // تغییر index  
      let endTime = match[3];       // تغییر index
      
      console.log(`Day: ${dayPersian}, Start: ${startTime}, End: ${endTime}`); // Debug log
      
      // تبدیل اعداد فارسی به انگلیسی
      startTime = persianToEnglish(startTime);
      endTime = persianToEnglish(endTime);
      
      const day = dayMap[dayPersian];
      if (day) {
        const timeSlot = {
          day: day as any,
          start: startTime,
          end: endTime
        };
        console.log('Adding time slot:', timeSlot); // Debug log
        timeSlots.push(timeSlot);
      }
    }
    
    console.log('Final time slots:', timeSlots); // Debug log

    return timeSlots;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'Estedad, sans-serif',
      background: 'var(--bg-primary)',
      padding: '16px',
      gap: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Sidebar */}
      <div className="card" style={{
        width: 380,
        padding: '20px 16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        animation: 'slideInLeft 0.6s ease-out'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 6px 0',
            color: 'var(--text-primary)'
          }}>
            برنامه‌ساز هوشمند
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            margin: 0,
            fontWeight: '400'
          }}>
            ساخت برنامه کلاسی هوشمند و بهینه
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="card" style={{
          display: 'flex',
          marginBottom: '18px',
          padding: '4px',
          gap: '2px'
        }}>
          <button
            onClick={() => setActiveTab('courses')}
            className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
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
            className={`nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            ترجیحات
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`nav-tab ${activeTab === 'details' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
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
            جزئیات
          </button>
        </div>

        {activeTab === 'courses' ? (
          <div className="card" style={{ padding: '16px' }}>
            <DataInput 
              onDataSubmit={handleDataSubmit} 
              onFileUpload={handleFileUpload}
            />
            
            {courseNames.length > 0 && (
              <div style={{ marginTop: '16px' }}>
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
              gap: '8px',
              marginTop: '16px'
            }}>
              <button 
                onClick={generateSchedules} 
                disabled={selected.length === 0 || loading} 
                className="btn btn-primary"
                style={{
                  flex: 2,
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 12px'
                }}
              >
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                {loading ? 'تولید...' : 'تولید برنامه'}
              </button>
              
              <button 
                onClick={clearAllData}
                disabled={loading}
                className="btn btn-danger"
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 12px'
                }}
                title="حذف همه داده‌ها"
              >
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                حذف
              </button>
              
              <button 
                onClick={importFromExcel}
                disabled={loading}
                className="btn btn-secondary"
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 12px'
                }}
                title="خواندن دروس از فایل اکسل"
              >
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <path d="M9 15h6M9 12h6M9 9h6" />
                </svg>
                اکسل
              </button>
            </div>
          </div>
        ) : activeTab === 'preferences' ? (
          <div className="card" style={{ padding: '16px' }}>
            <PreferencePanel
              courses={courses?.courses || []}
              selectedCourses={selected.map(displayName => 
                courseNameMapping.get(displayName) || displayName
              )}
              onPreferencesChange={setPreferences}
            />
          </div>
        ) : (
          <div className="card" style={{ padding: '16px' }}>
            <CourseDetails courses={courses} />
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="card" style={{
        flex: 1,
        padding: '20px',
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
