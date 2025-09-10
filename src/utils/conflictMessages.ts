// Utility to build conflict & suggestion message text (extracted from App.tsx)
export interface ConflictResult {
  conflicts: { conflicts: any[]; suggestions: any[]; coursesWithMultipleSections: any[] };
  schedules?: any[];
}

export function buildConflictMessage(result: ConflictResult) {
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
      const dayNames: { [k: string]: string } = {
        'Saturday': 'شنبه', 'Sunday': 'یکشنبه', 'Monday': 'دوشنبه', 'Tuesday': 'سه‌شنبه', 'Wednesday': 'چهارشنبه', 'Thursday': 'پنج‌شنبه', 'Friday': 'جمعه'
      };
      const formatSchedule = (schedule: any[]) => schedule.map(s => `${dayNames[s.day]} ${s.start}-${s.end}`).join(', ');
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
  return message;
}
