// Backtracking solver and scoring engine for Smart University Course Scheduler
import fs from 'fs';
import path from 'path';
import { DataFile, Course, Section, ScheduleSection, TimeSlot, Day } from './shared/types';
import { GroupingConfig, generateSelectionScenarios, buildGroupIndex, generateOptionalScenarios } from './grouping';

// Load data.json
export function loadData(): DataFile {
  const dataPath = path.join(__dirname, 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

// Check if two time slots overlap
function timeOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.day !== b.day) return false;
  
  // تبدیل زمان به دقیقه برای مقایسه آسان‌تر
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);
  
  console.log(`Checking overlap: ${a.day} ${a.start}-${a.end} (${aStart}-${aEnd}) vs ${b.day} ${b.start}-${b.end} (${bStart}-${bEnd})`);
  
  // دو بازه زمانی تداخل دارند اگر:
  // شروع یکی قبل از پایان دیگری باشد و پایان یکی بعد از شروع دیگری باشد
  const overlaps = aStart < bEnd && aEnd > bStart;
  console.log(`Overlap result: ${overlaps}`);
  
  return overlaps;
}

// Check if a section's schedule conflicts with current schedule
function hasConflict(current: ScheduleSection[], section: Section): boolean {
  console.log(`Checking conflicts for section with ${section.schedule.length} time slots`);
  console.log('Current schedule:', current.map(s => ({ course: s.courseName, schedule: s.schedule })));
  console.log('New section schedule:', section.schedule);
  
  for (const scheduled of current) {
    for (const slotA of scheduled.schedule) {
      for (const slotB of section.schedule) {
        if (timeOverlap(slotA, slotB)) {
          console.log(`Conflict found between ${scheduled.courseName} and new section`);
          return true;
        }
      }
    }
  }
  console.log('No conflicts found');
  return false;
}

// Backtracking: find all valid schedules
export function findSchedules(
  courses: Course[],
  desiredCourseNames: string[]
): ScheduleSection[][] {
  console.log('Finding schedules for courses:', desiredCourseNames);
  console.log('Available courses:', courses.map(c => ({ name: c.courseName, sections: c.sections.length })));
  
  const desired = courses.filter(c => desiredCourseNames.includes(c.courseName));
  console.log('Filtered desired courses:', desired.map(c => ({ 
    name: c.courseName, 
    sections: c.sections.length,
    sectionsData: c.sections.map(s => ({
      code: s.sectionCode,
      scheduleLength: s.schedule.length,
      schedule: s.schedule,
      professor: s.professor.name
    }))
  })));
  
  const results: ScheduleSection[][] = [];

  function backtrack(idx: number, current: ScheduleSection[]) {
    if (idx === desired.length) {
      console.log('Found valid schedule combination:', current.map(s => `${s.courseName}-${s.sectionCode}`));
      results.push([...current]);
      return;
    }
    
    console.log(`Processing course ${idx}: ${desired[idx].courseName} with ${desired[idx].sections.length} sections`);
    
    for (const section of desired[idx].sections) {
      console.log(`Checking section ${section.sectionCode} with schedule:`, section.schedule);
      
      if (!hasConflict(current, section)) {
        console.log(`Section ${section.sectionCode} has no conflicts, adding to schedule`);
        current.push({
          courseName: desired[idx].courseName,
          courseCode: desired[idx].courseCode,
          sectionCode: section.sectionCode,
          professor: section.professor,
          schedule: section.schedule
        });
        backtrack(idx + 1, current);
        current.pop();
      } else {
        console.log(`Section ${section.sectionCode} has conflicts, skipping`);
      }
    }
  }

  backtrack(0, []);
  console.log(`Found ${results.length} valid schedule combinations`);
  return results;
}

// Scoring function improved with user preferences (priority, professor rating, time slot rating)
// preferences: [{ courseCode, priority (1=highest visual order), professorRatings, timeSlotRatings }]
interface UserPreference {
  courseCode: string;
  courseName: string;
  priority: number; // lower means higher priority visually
  professorRatings: Record<string, number>;
  timeSlotRatings: Record<string, number>; // key: Day-start-end
}

const PRIORITY_WEIGHT = 60;      // وزن تاثیر اولویت کلی درس
const PROFESSOR_WEIGHT = 25;     // وزن هر امتیاز استاد (انحراف از 3)
const TIMESLOT_WEIGHT = 8;       // وزن هر امتیاز بازه زمانی (انحراف از 3)
const ATTENDANCE_BONUS = 40;     // پاداش اگر حضور و غیاب نگیرد
const EARLY_CLASS_BONUS = 10;    // کلاس شروع قبل 10
const LATE_CLASS_PENALTY = 30;   // کلاس پایان بعد 13
const FREE_DAY_BONUS = 60;       // پاداش هر روز آزاد

export function calculateScore(schedule: ScheduleSection[], preferences?: UserPreference[]): number {
  let score = 0;
  const days: Record<Day, number> = {
    Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0
  };

  const prefMap: Record<string, UserPreference> = {};
  if (preferences) {
    for (const p of preferences) prefMap[p.courseCode] = p as UserPreference;
  }

  // Find max priority to invert (priority starts at 1 up to N)
  const maxPriority = preferences && preferences.length ? Math.max(...preferences.map(p => p.priority)) : 0;

  for (const sec of schedule) {
    const pref = prefMap[sec.courseCode];
    if (pref) {
      // Priority: higher score for smaller priority number
      const inverted = (maxPriority + 1 - pref.priority); // if priority=1 and max=5 => 5
      score += inverted * PRIORITY_WEIGHT;
    }

    // Professor based rating
    if (pref && pref.professorRatings) {
      const r = pref.professorRatings[sec.professor.name];
      if (r) score += (r - 3) * PROFESSOR_WEIGHT; // center at neutral 3
    }

    // Attendance bonus
    if (!sec.professor.takesAttendance) score += ATTENDANCE_BONUS;

    for (const slot of sec.schedule) {
      // Time of Day heuristics (legacy heuristic kept smaller)
      if (slot.end > '13:00') score -= LATE_CLASS_PENALTY;
      if (slot.start < '10:00') score += EARLY_CLASS_BONUS;
      days[slot.day]++;

      if (pref && pref.timeSlotRatings) {
        const key = `${slot.day}-${slot.start}-${slot.end}`;
        const tr = pref.timeSlotRatings[key];
        if (tr) score += (tr - 3) * TIMESLOT_WEIGHT; // center at 3
      }
    }
  }

  // Free days bonus
  for (const d in days) if (days[d as Day] === 0) score += FREE_DAY_BONUS;

  return score;
}

// تحلیل تداخل‌ها و ارائه راه‌حل‌های بدیل
function analyzeConflicts(courses: Course[], desiredCourseNames: string[]) {
  const desired = courses.filter(c => desiredCourseNames.includes(c.courseName));
  const conflicts: any[] = [];
  const suggestions: any[] = [];
  
  console.log('Analyzing conflicts for courses:', desiredCourseNames);
  
  // بررسی تداخل‌های جفتی بین دروس
  for (let i = 0; i < desired.length; i++) {
    for (let j = i + 1; j < desired.length; j++) {
      const course1 = desired[i];
      const course2 = desired[j];
      
      // بررسی تمام ترکیب‌های section ها
      let hasValidCombination = false;
      const conflictingSections: any[] = [];
      
      for (const section1 of course1.sections) {
        for (const section2 of course2.sections) {
          if (!hasConflict([{
            courseName: course1.courseName,
            courseCode: course1.courseCode,
            sectionCode: section1.sectionCode,
            professor: section1.professor,
            schedule: section1.schedule
          }], section2)) {
            hasValidCombination = true;
            suggestions.push({
              course1: course1.courseName,
              section1: section1.sectionCode,
              professor1: section1.professor.name,
              schedule1: section1.schedule,
              course2: course2.courseName,
              section2: section2.sectionCode,
              professor2: section2.professor.name,
              schedule2: section2.schedule
            });
          } else {
            conflictingSections.push({
              course1: course1.courseName,
              section1: section1.sectionCode,
              schedule1: section1.schedule,
              course2: course2.courseName,
              section2: section2.sectionCode,
              schedule2: section2.schedule
            });
          }
        }
      }
      
      if (!hasValidCombination) {
        conflicts.push({
          course1: course1.courseName,
          course2: course2.courseName,
          message: `هیچ ترکیب section ای بین ${course1.courseName} و ${course2.courseName} بدون تداخل وجود ندارد`,
          conflictingSections
        });
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    suggestions: suggestions.slice(0, 10), // فقط 10 پیشنهاد اول
    totalConflicts: conflicts.length,
    coursesWithMultipleSections: desired.filter(c => c.sections.length > 1).map(c => ({
      courseName: c.courseName,
      sectionsCount: c.sections.length,
      sections: c.sections.map(s => ({
        sectionCode: s.sectionCode,
        professor: s.professor.name,
        schedule: s.schedule
      }))
    }))
  };
}

// Main API: get ranked schedules with conflict analysis
interface ScheduleOptions {
  minUnits?: number;           // حداقل واحد مجاز
  maxUnits?: number;           // حداکثر واحد مجاز
  allowSkipping?: boolean;     // اجازه رد کردن برخی دروس/گروه ها
  scenarioLimit?: number;      // سقف سناریو
}

// Main API
export function getRankedSchedules(
  desiredCourseNames: string[],
  preferences?: any[],
  groupingConfig?: GroupingConfig,
  options?: ScheduleOptions
): any {
  const data = loadData();
  const { minUnits = 0, maxUnits = Infinity, allowSkipping = false, scenarioLimit = 8000 } = options || {};

  // اگر گروه‌بندی تعریف شده باشد، چند سناریو تولید می‌کنیم و نتایج را ادغام
  let scenarios: string[][];
  if (groupingConfig) {
    scenarios = allowSkipping
      ? generateOptionalScenarios(desiredCourseNames, groupingConfig, { allowSkipSingles: true, maxCombinations: scenarioLimit })
      : generateSelectionScenarios(desiredCourseNames, groupingConfig);
  } else {
    // اگر گروه بندی نداریم ولی اجازه رد کردن هست، زیردسته های همه دروس را تولید می‌کنیم (powerset محدود)
    if (allowSkipping) {
      const base: string[] = [...desiredCourseNames];
      scenarios = [[]];
      for (const name of base) {
        const current = [...scenarios];
        for (const partial of current) {
          const next = [...partial, name];
          if (scenarios.length < scenarioLimit) scenarios.push(next);
        }
      }
      scenarios = scenarios.filter(s => s.length>0); // حذف حالت خالی
    } else {
      scenarios = [desiredCourseNames];
    }
  }

  let allSchedules: ScheduleSection[][] = [];
  for (const scenario of scenarios) {
    const part = findSchedules(data.courses, scenario);
    allSchedules = allSchedules.concat(part);
  }
  // حذف برنامه‌های تکراری (بر اساس مجموعه کد درس+سکشن)
  const seen = new Set<string>();
  const schedules = allSchedules.filter(sch => {
    const key = sch.map(s => `${s.courseCode}_${s.sectionCode}`).sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`Generated ${schedules.length} valid schedules`);
  
  // اگر هیچ برنامه‌ای پیدا نشد، تحلیل تداخل‌ها را انجام بده
  let conflictAnalysis = null;
  if (schedules.length === 0) {
    conflictAnalysis = analyzeConflicts(data.courses, desiredCourseNames);
    console.log('Conflict analysis:', conflictAnalysis);
  }
  
  // Build group mapping for metadata
  const groupIndex = groupingConfig ? buildGroupIndex(groupingConfig) : null;

  // Score schedules with preferences
  const scoredSchedules = schedules.map(sections => {
    const score = calculateScore(sections, preferences as any);
    // فیلتر واحدها
    const totalUnits = sections.reduce((sum, s) => {
      const course = data.courses.find(c => c.courseCode === s.courseCode);
      return sum + (course?.units || 0);
    }, 0);
    if (totalUnits < minUnits || totalUnits > maxUnits) return null;
    const groupsMeta = groupIndex ? sections.map(sec => {
      const gId = groupIndex[sec.courseName.replace(/\s+/g,'').toLowerCase()] || null;
      return gId ? { groupId: gId, courseName: sec.courseName } : null;
    }).filter(Boolean) : [];
    return { sections, score, groupsMeta, units: totalUnits };
  }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);
  
  // آمار برنامه‌ها
  const stats = {
    totalSchedules: (scoredSchedules as any).length,
    totalCoursesOriginalSelection: desiredCourseNames.length,
    scenariosTried: scenarios.length,
    totalDistinctCoursesUsed: new Set(schedules.flatMap(s => s.map(x => x.courseName))).size
  };
  
  return {
    schedules: scoredSchedules,
    conflicts: conflictAnalysis,
  stats,
  grouping: groupingConfig ? { groups: groupingConfig.groups.length, scenarios: scenarios.length } : undefined,
  options: { minUnits, maxUnits, allowSkipping, scenarioLimit }
  };
}
