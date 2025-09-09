import React, { useState } from 'react';

interface Props {
  onDataSubmit: (data: string) => void;
}

const DataInput: React.FC<Props> = ({ onDataSubmit }) => {
  const [inputData, setInputData] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = () => {
    if (inputData.trim()) {
      onDataSubmit(inputData);
      setInputData('');
      setIsVisible(false);
    }
  };

  const parseTableData = (data: string) => {
    // پارس کردن داده‌های جدولی به فرمت JSON
    const lines = data.trim().split('\n');
    const headers = lines[0].split('\t');
    const courses = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split('\t');
      if (row.length >= headers.length && row[0] && row[1]) {
        const courseCode = row[0];
        const courseName = row[1];
        const units = parseInt(row[2]) || 3;
        const professor = row[7] || 'نامشخص';
        const schedule = row[10] || '';
        
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
              teachingQuality: 'good'
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

    // الگوی زمان‌بندی
    const timePattern = /(شنبه|يك شنبه|دوشنبه|سه شنبه|چهارشنبه|پنج شنبه|جمعه)\s+(\d{2}:\d{2})-(\d{2}:\d{2})/g;
    let match;

    while ((match = timePattern.exec(scheduleText)) !== null) {
      const day = dayMap[match[1]];
      const startTime = match[2];
      const endTime = match[3];

      if (day) {
        timeSlots.push({
          day: day,
          start: startTime,
          end: endTime
        });
      }
    }

    return timeSlots;
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="font-medium"
        style={{
          margin: '8px 0',
          padding: '12px 20px',
          fontSize: '1rem',
          border: 'none',
          background: '#4caf50',
          color: '#fff',
          borderRadius: '8px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        افزودن داده‌های جدید
      </button>
    );
  }

  return (
    <div style={{ margin: '16px 0', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
      <h3 className="font-bold" style={{ marginBottom: '12px' }}>ورود داده‌های درسی</h3>
      <textarea
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        placeholder="داده‌های جدولی را از اکسل کپی کرده و اینجا پیست کنید..."
        style={{
          width: '100%',
          height: '200px',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontFamily: 'Estedad, sans-serif',
          resize: 'vertical',
          boxSizing: 'border-box'
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={handleSubmit}
          disabled={!inputData.trim()}
          className="font-medium"
          style={{
            padding: '10px 16px',
            border: 'none',
            background: inputData.trim() ? '#4caf50' : '#ccc',
            color: '#fff',
            borderRadius: '4px',
            cursor: inputData.trim() ? 'pointer' : 'not-allowed',
            flex: 1
          }}
        >
          ذخیره داده‌ها
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="font-medium"
          style={{
            padding: '10px 16px',
            border: '1px solid #ddd',
            background: '#fff',
            color: '#666',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          لغو
        </button>
      </div>
    </div>
  );
};

export default DataInput;
