import React, { useEffect, useState } from 'react';
import type { Schedule } from './shared/types';
import CourseSelector from './CourseSelector';
import CalendarView from './CalendarView';
import PlanNavigator from './PlanNavigator';
import DataInput from './DataInput';

const api = (window as any).api;

const App: React.FC = () => {
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCourseNames().then(setCourseNames);
  }, []);

  const generateSchedules = async () => {
    setLoading(true);
    const result = await api.getRankedSchedules(selected);
    setSchedules(result);
    setCurrentIdx(0);
    setLoading(false);
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
      
      alert('داده‌ها با موفقیت ذخیره شدند!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('خطا در ذخیره‌سازی داده‌ها');
    }
  };

  const parseTableData = (data: string) => {
    // پارس کردن داده‌های جدولی به فرمت JSON
    const lines = data.trim().split('\n');
    if (lines.length < 2) return { courses: [] };
    
    const courses = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split('\t');
      if (row.length >= 12 && row[0] && row[1]) {
        const courseCode = row[0].trim();
        const courseName = row[1].trim();
        const units = parseInt(row[2]) || 3;
        const professor = row[7]?.trim() || 'نامشخص';
        const schedule = row[10]?.trim() || '';
        
        // استخراج زمان‌ها از رشته جدول
        const timeSlots = extractTimeSlots(schedule);
        
        courses.push({
          courseName: `${courseName} (${courseCode})`,
          courseCode: courseCode,
          units: units,
          sections: [{
            sectionCode: courseCode,
            professor: {
              name: professor,
              takesAttendance: true,
              teachingQuality: 'good' as const
            },
            schedule: timeSlots
          }]
        });
      }
    }
    
    return { courses };
  };

  const extractTimeSlots = (scheduleText: string) => {
    const timeSlots = [];
    const dayMap: Record<string, string> = {
      'شنبه': 'Saturday',
      'يك شنبه': 'Sunday', 
      'دوشنبه': 'Monday',
      'سه شنبه': 'Tuesday',
      'چهارشنبه': 'Wednesday',
      'پنج شنبه': 'Thursday',
      'جمعه': 'Friday'
    };

    // الگوی زمان‌بندی بهبود یافته
    const lines = scheduleText.split('\n');
    for (const line of lines) {
      const timePattern = /(شنبه|يك شنبه|دوشنبه|سه شنبه|چهارشنبه|پنج شنبه|جمعه)\s+(\d{2}:\d{2})-(\d{2}:\d{2})/g;
      let match;

      while ((match = timePattern.exec(line)) !== null) {
        const day = dayMap[match[1]];
        const startTime = match[2];
        const endTime = match[3];

        if (day) {
          timeSlots.push({
            day: day as any,
            start: startTime,
            end: endTime
          });
        }
      }
    }

    return timeSlots;
  };

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'row', fontFamily:'Estedad, sans-serif'}}>
      <div style={{width:320, background:'#fff', borderRight:'1px solid #ddd', padding:'24px 16px', boxSizing:'border-box', overflowY:'auto'}}>
        <h2 className="font-bold" style={{fontSize:'1.5rem', marginBottom:'16px', color:'#333'}}>درس‌ها</h2>
        
        <DataInput onDataSubmit={handleDataSubmit} />
        
        <CourseSelector
          courseNames={courseNames}
          selected={selected}
          setSelected={setSelected}
        />
        <button 
          onClick={generateSchedules} 
          disabled={selected.length === 0 || loading} 
          className="font-medium"
          style={{
            margin:'8px 0', 
            padding:'12px 20px', 
            fontSize:'1rem', 
            border:'none', 
            background: selected.length === 0 || loading ? '#aaa' : '#1976d2', 
            color:'#fff', 
            borderRadius:'8px', 
            cursor: selected.length === 0 || loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            width: '100%'
          }}
        >
          {loading ? 'در حال تولید...' : 'تولید برنامه کلاسی'}
        </button>
      </div>
      <div style={{flex:1, padding:'24px', display:'flex', flexDirection:'column', alignItems:'stretch'}}>
        {schedules.length > 0 ? (
          <>
            <div className="font-semibold" style={{fontSize:'1.2rem', marginBottom:'8px', color:'#333'}}>امتیاز: {schedules[currentIdx].score}</div>
            <CalendarView schedule={schedules[currentIdx]} />
            <PlanNavigator
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              total={schedules.length}
            />
          </>
        ) : (
          <div className="font-normal" style={{marginTop:'40px', color:'#888', textAlign:'center'}}>
            هنوز برنامه کلاسی تولید نشده است.
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
