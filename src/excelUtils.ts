import * as XLSX from 'xlsx';
import { Course, Section, Professor, TimeSlot, Day } from './shared/types';

export interface ExcelCourseRow {
  courseCodeGroup: string;      // A: شماره و گروه درس (3630014_01)
  courseName: string;           // B: نام درس
  totalUnits: number;           // C: کل
  practicalUnits: number;       // D: ع
  capacity: number;             // E: ظرفیت
  enrolled: number;             // F: ثبت نام شده
  waitingList: number;          // G: تعداد لیست انتظار
  gender: string;               // H: جنسیت
  professorName: string;        // I: نام استاد
  employmentStatus: string;     // J: وضعیت استخدامی اساتید غیر‌هیات‌علمی
  responsibilityType: string;   // K: نوع مسئولیت استاد
  timeAndPlace: string;         // L: زمان و مکان ارائه/ امتحان
  notes: string;                // M: توضیحات
}

// تابع برای تجزیه زمان از متن فارسی
function parseScheduleFromText(timeAndPlace: string): TimeSlot[] {
  const schedule: TimeSlot[] = [];
  
  // اگر متن خالی است، برگردان
  if (!timeAndPlace || timeAndPlace.trim() === '') {
    console.log('Empty timeAndPlace text');
    return schedule;
  }
  
  console.log('Parsing timeAndPlace:', timeAndPlace);
  
  // نقشه روزهای هفته فارسی به انگلیسی (روزهای طولانی‌تر اول)
  const dayMap: { [key: string]: Day } = {
    'چهارشنبه': 'Wednesday',
    'چهار شنبه': 'Wednesday',
    'پنج‌شنبه': 'Thursday',
    'پنج شنبه': 'Thursday',
    'سه‌شنبه': 'Tuesday',
    'سه شنبه': 'Tuesday',
    'يك شنبه': 'Sunday', 
    'يکشنبه': 'Sunday',
    'دوشنبه': 'Monday',
    'شنبه': 'Saturday',
    'جمعه': 'Friday'
  };

  // روش بهتر: استفاده از regex برای یافتن دقیق‌تر روزها
  const findDayInText = (text: string): Day | null => {
    // ابتدا روزهای طولانی‌تر را بررسی کن
    if (text.includes('چهارشنبه') || text.includes('چهار شنبه')) return 'Wednesday';
    if (text.includes('پنج‌شنبه') || text.includes('پنج شنبه')) return 'Thursday';
    if (text.includes('سه‌شنبه') || text.includes('سه شنبه')) return 'Tuesday';
    if (text.includes('يك شنبه') || text.includes('يکشنبه')) return 'Sunday';
    if (text.includes('دوشنبه')) return 'Monday';
    if (text.includes('جمعه')) return 'Friday';
    // شنبه را آخر بررسی کن تا با یکشنبه اشتباه نشود
    if (text.includes('شنبه') && !text.includes('يك شنبه') && !text.includes('يکشنبه')) return 'Saturday';
    
    return null;
  };

  // تابع جایگزین برای پارسینگ فرمت‌های متفاوت
  const parseAlternativeFormat = (text: string): TimeSlot[] => {
    const altSchedule: TimeSlot[] = [];
    
    // جستجوی الگوهای مختلف زمان و روز
    const patterns = [
      // الگوی: روز ساعت-ساعت
      /([^\d\s]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/g,
      // الگوی: ساعت-ساعت روز
      /(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+([^\d\s]+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let day: Day | null = null;
        let startTime: string = '';
        let endTime: string = '';
        
        if (match.length === 4) {
          // الگوی اول: روز ساعت-ساعت
          day = findDayInText(match[1]);
          startTime = match[2];
          endTime = match[3];
        }
        
        if (day && startTime && endTime) {
          altSchedule.push({ day, start: startTime, end: endTime });
          console.log(`Alternative parsing found: ${day} ${startTime}-${endTime}`);
        }
      }
    }
    
    return altSchedule;
  };

  // تقسیم بخش‌های مختلف با "درس(ت):"
  const parts = timeAndPlace.split(/درس\(ت\):/);
  console.log('Split parts:', parts);
  
  // اگر تقسیم نشد، از روش جایگزین استفاده کن
  if (parts.length <= 1) {
    console.log('No "درس(ت):" found, trying alternative parsing...');
    return parseAlternativeFormat(timeAndPlace);
  }
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    console.log(`Processing part ${i}:`, part);
    
    // استخراج روز هفته با تابع جدید
    const dayFound = findDayInText(part);
    
    if (dayFound) {
      console.log('Found day in part:', dayFound);
    } else {
      console.log('No day found in part:', part);
      continue;
    }
    
    // استخراج ساعت (مثل 13:30-14:30 یا 08:00-10:00)
    const timeMatch = part.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (timeMatch) {
      const startTime = timeMatch[1];
      const endTime = timeMatch[2];
      console.log('Found time:', startTime, '-', endTime);
      
      schedule.push({
        day: dayFound,
        start: startTime,
        end: endTime
      });
    } else {
      console.log('No time pattern found in part:', part);
    }
  }
  
  console.log('Final schedule:', schedule);
  return schedule;
}

// تابع برای استخراج کد درس از ستون اول
function extractCourseCode(courseCodeGroup: string): { courseCode: string; sectionCode: string } {
  const parts = courseCodeGroup.split('_');
  if (parts.length >= 2) {
    return {
      courseCode: parts[0],
      sectionCode: parts[1]
    };
  }
  return {
    courseCode: courseCodeGroup,
    sectionCode: '01'
  };
}

// تابع اصلی برای خواندن فایل اکسل و تبدیل به فرمت مورد نیاز
export function parseExcelToCourses(fileBuffer: Buffer): Course[] {
  try {
    // خواندن فایل اکسل از Buffer
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تبدیل به آرایه JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // حذف ردیف هدر (ردیف اول)
    const dataRows = rawData.slice(1) as any[][];
    
    // گروه‌بندی بر اساس کد درس
    const courseMap: { [courseCode: string]: Course } = {};
    
    for (const row of dataRows) {
      if (!row || row.length < 13) {
        console.log('Skipping incomplete row:', row);
        continue; // رد کردن ردیف‌های ناقص
      }
      
      const rowData: ExcelCourseRow = {
        courseCodeGroup: row[0] || '',
        courseName: row[1] || '',
        totalUnits: parseInt(row[2]) || 0,
        practicalUnits: parseInt(row[3]) || 0,
        capacity: parseInt(row[4]) || 0,
        enrolled: parseInt(row[5]) || 0,
        waitingList: parseInt(row[6]) || 0,
        gender: row[7] || '',
        professorName: row[8] || '',
        employmentStatus: row[9] || '',
        responsibilityType: row[10] || '',
        timeAndPlace: row[11] || '',
        notes: row[12] || ''
      };
      
      console.log('Processing row:', rowData);
      
      // استخراج کد درس و کد بخش
      const { courseCode, sectionCode } = extractCourseCode(rowData.courseCodeGroup);
      console.log('Extracted codes:', { courseCode, sectionCode });
      
      // اگر درس وجود ندارد، ایجاد کن
      if (!courseMap[courseCode]) {
        courseMap[courseCode] = {
          courseName: rowData.courseName,
          courseCode: courseCode,
          units: rowData.totalUnits,
          sections: []
        };
        console.log('Created new course:', courseMap[courseCode]);
      }
      
      // تجزیه برنامه زمانی
      const schedule = parseScheduleFromText(rowData.timeAndPlace);
      console.log('Parsed schedule for course:', courseCode, schedule);
      
      // حذف تایم‌های تکراری
      const uniqueSchedule = schedule.filter((slot, index, self) => 
        index === self.findIndex(s => s.day === slot.day && s.start === slot.start && s.end === slot.end)
      );
      console.log('Unique schedule after removing duplicates:', uniqueSchedule);
      
      // ایجاد professor object
      const professor: Professor = {
        name: rowData.professorName,
        takesAttendance: true, // مقدار پیش‌فرض
        teachingQuality: 'good' as any // مقدار پیش‌فرض
      };
      
      // ایجاد section
      const section: Section = {
        sectionCode: sectionCode,
        professor: professor,
        schedule: uniqueSchedule,
        notes: rowData.notes || undefined
      };
      
      console.log('Created section:', section);
      
      // اضافه کردن section به درس
      courseMap[courseCode].sections.push(section);
    }
    
    // تبدیل map به آرایه
    return Object.values(courseMap);
    
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`خطا در خواندن فایل اکسل: ${error.message}`);
  }
}

// تابع برای ذخیره داده‌های تبدیل شده در فایل JSON
export function saveCoursesToJson(courses: Course[], outputPath: string): void {
  try {
    const data = { courses: courses };
    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`داده‌ها با موفقیت در ${outputPath} ذخیره شدند`);
  } catch (error) {
    console.error('Error saving courses to JSON:', error);
    throw new Error(`خطا در ذخیره فایل JSON: ${error.message}`);
  }
}