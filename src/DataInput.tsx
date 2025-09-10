import React, { useState } from 'react';

interface Props {
  onDataSubmit: (data: string) => void;
  onFileUpload: (file: File) => void;
}

const DataInput: React.FC<Props> = ({ onDataSubmit, onFileUpload }) => {
  const [inputData, setInputData] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = () => {
    if (inputData.trim()) {
      onDataSubmit(inputData);
      setInputData('');
      setIsVisible(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel file
        handleExcelFile(file);
      } else {
        // Text file
        onFileUpload(file);
      }
    }
    // Reset input
    event.target.value = '';
  };

  const handleExcelFile = async (file: File) => {
    try {
      alert('فایل اکسل انتخاب شد! لطفاً ابتدا آن را به فرمت CSV تبدیل کنید.\n\nمراحل:\n1. فایل اکسل را در Excel باز کنید\n2. File > Save As > CSV (Comma delimited) انتخاب کنید\n3. فایل CSV ذخیره شده را آپلود کنید');
    } catch (error) {
      alert('خطا در پردازش فایل اکسل: ' + error.message);
    }
  };

  const downloadTemplate = () => {
    const template = `کد درس_بخش\tنام درس\tواحد\tظرفیت\tتعداد ثبت‌نام\tلیست انتظار\tنوع\tاستاد
1914107_01\tریاضی عمومی 2\t3\t0\t165\t0\t0\tمختلط\tآقای نمونه
درس(ت): شنبه 10:00-12:00 مکان: تالار7
درس(ت): دوشنبه 10:00-12:00 مکان: تالار7`;
    
    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-courses.txt';
    a.click();
    URL.revokeObjectURL(url);
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
        className="btn-modern btn-primary font-medium glass-card"
        style={{
          margin: '8px 0',
          padding: '16px 24px',
          fontSize: '1rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
  افزودن گروه جدید
      </button>
    );
  }

  return (
    <div className="glass-card modern-form" style={{ 
      margin: '16px 0', 
      padding: '24px', 
      borderRadius: '16px',
      animation: 'fadeInUp 0.3s ease',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--glass-border)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px' 
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        <h3 className="font-bold text-text" style={{ 
          fontSize: '1.25rem',
          margin: 0,
          color: 'var(--text-color)'
        }}>
          ورود داده‌های درسی
        </h3>
      </div>
      
      <div className="modern-input-group" style={{ position: 'relative', marginBottom: '20px' }}>
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="داده‌های جدولی را از اکسل کپی کرده و اینجا پیست کنید..."
          className="modern-textarea"
          style={{
            width: '100%',
            height: '200px',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontFamily: 'Estedad, sans-serif',
            resize: 'vertical',
            boxSizing: 'border-box',
            background: 'var(--input-bg)',
            color: 'var(--text-color)',
            outline: 'none',
            transition: 'all 0.3s ease',
            border: '1px solid var(--glass-border)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary-color)';
            e.target.style.boxShadow = '0 0 0 3px rgba(44, 83, 100, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--glass-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          opacity: inputData.length > 0 ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}>
          {inputData.length} کاراکتر
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSubmit}
          disabled={!inputData.trim()}
          className={`btn-modern ${inputData.trim() ? 'btn-success' : 'btn-disabled'} font-medium`}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: inputData.trim() ? 'pointer' : 'not-allowed',
            flex: 1,
            minWidth: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          ذخیره داده‌ها
        </button>
        
        <button
          onClick={() => setIsVisible(false)}
          className="btn-modern btn-secondary font-medium"
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            flex: 1,
            minWidth: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          لغو
        </button>
      </div>
      
      <div className="help-text" style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--info-bg)',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
          <path d="M12,17h0"/>
        </svg>
        <div>
          داده‌ها را از جدول اکسل کپی کرده و در ناحیه بالا پیست کنید. فرمت مورد انتظار شامل ستون‌های کد درس، نام درس، واحد، استاد و زمان‌بندی است.
        </div>
      </div>
    </div>
  );
};

export default DataInput;
