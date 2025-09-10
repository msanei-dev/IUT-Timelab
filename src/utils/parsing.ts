// Parsing utilities extracted from App.tsx for modularity
export interface ParsedCourseSection {
  sectionCode: string;
  professor: { name: string; takesAttendance: boolean; teachingQuality: 'good' | 'average' | 'weak' };
  schedule: { day: string; start: string; end: string }[];
}

export interface ParsedCourse {
  courseName: string;
  courseCode: string;
  units: number;
  sections: ParsedCourseSection[];
}

export interface ParsedData { courses: ParsedCourse[]; }

const dayMap: Record<string,string> = {
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

const timePattern = /(شنبه|يك شنبه|یک شنبه|دوشنبه|سه شنبه|سه‌شنبه|چهارشنبه|چهار شنبه|پنج شنبه|پنج‌شنبه|جمعه)\s+([۰-۹\d]{1,2}:[۰-۹\d]{2})-([۰-۹\d]{1,2}:[۰-۹\d]{2})/g;

const persianToEnglish = (str: string) => str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

export function extractTimeSlots(scheduleText: string) {
  const timeSlots: { day: string; start: string; end: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = timePattern.exec(scheduleText)) !== null) {
    const dayPersian = match[1];
    const startTime = persianToEnglish(match[2]);
    const endTime = persianToEnglish(match[3]);
    const day = dayMap[dayPersian];
    if (day) timeSlots.push({ day, start: startTime, end: endTime });
  }
  return timeSlots;
}

export function parseTableData(data: string): ParsedData {
  const lines = data.trim().split('\n');
  if (lines.length < 1) return { courses: [] };
  const coursesMap = new Map<string, ParsedCourse>();
  let currentCourse: { courseCode: string; sectionIndex: number } | null = null;

  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.includes('\t') && line.match(/^\d+_\d+\t/)) {
      const parts = line.split('\t');
      const fullCourseCode = parts[0].trim();
      const courseName = parts[1].trim();
      const units = parseInt(parts[2]) || 3;
      const professor = parts[8]?.trim() || 'نامشخص';
      const baseCourseCode = fullCourseCode.split('_')[0];
      const sectionCode = fullCourseCode.split('_')[1] || '01';
      if (!coursesMap.has(baseCourseCode)) {
        coursesMap.set(baseCourseCode, {
          courseName: `${courseName} (${baseCourseCode})`,
          courseCode: baseCourseCode,
          units,
          sections: []
        });
      }
      const newSection: ParsedCourseSection = {
        sectionCode,
        professor: { name: professor, takesAttendance: true, teachingQuality: 'good' },
        schedule: []
      };
      const course = coursesMap.get(baseCourseCode)!;
      course.sections.push(newSection);
      currentCourse = { courseCode: baseCourseCode, sectionIndex: course.sections.length - 1 };
    } else if (currentCourse && (line.includes('درس(ت):') || line.includes('درس(ع):') || /(شنبه|دوشنبه|سه شنبه|سه‌شنبه|چهارشنبه|پنج شنبه|پنج‌شنبه|جمعه|یک شنبه|يك شنبه)/.test(line))) {
      const course = coursesMap.get(currentCourse.courseCode);
      if (course) {
        const slots = extractTimeSlots(line);
        course.sections[currentCourse.sectionIndex].schedule.push(...slots);
      }
    }
  }
  return { courses: Array.from(coursesMap.values()) };
}
