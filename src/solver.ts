// Backtracking solver and scoring engine for Smart University Course Scheduler
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { DataFile, Course, Section, ScheduleSection, TimeSlot, Day } from './shared/types';
import { GroupingConfig, generateSelectionScenarios, buildGroupIndex, generateOptionalScenarios } from './grouping';
import { calculateScore } from './solver/scoring';
import { analyzeConflicts } from './solver/conflicts';

// Resolve the data file path with sensible fallbacks
function resolveDataFilePath(): string {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development: always prefer public/data.json to reflect live edits
    const devPublic = path.join(process.cwd(), 'public', 'data.json');
    if (fs.existsSync(devPublic)) return devPublic;
  }

  try {
    // Production: prefer user-writable data in userData folder (created by Electron)
    const userDataPath = path.join(app.getPath('userData'), 'data.json');
    if (fs.existsSync(userDataPath)) return userDataPath;
  } catch {
    // app may not be ready yet; ignore and use fallbacks
  }

  // Fallback to bundled neighbor (e.g., copied next to main bundle)
  const bundled = path.join(__dirname, 'data.json');
  return bundled;
}

// Load data.json
export function loadData(): DataFile {
  const dataPath = resolveDataFilePath();
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

// Lightweight inline conflict check (hot path)
function sectionConflicts(current: ScheduleSection[], section: Section): boolean {
  for (const scheduled of current) {
    for (const slotA of scheduled.schedule) {
      for (const slotB of section.schedule) {
        if (slotA.day === slotB.day) {
          const aS = Number(slotA.start.slice(0,2))*60 + Number(slotA.start.slice(3));
          const aE = Number(slotA.end.slice(0,2))*60 + Number(slotA.end.slice(3));
          const bS = Number(slotB.start.slice(0,2))*60 + Number(slotB.start.slice(3));
          const bE = Number(slotB.end.slice(0,2))*60 + Number(slotB.end.slice(3));
          if (aS < bE && aE > bS) return true;
        }
      }
    }
  }
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
      
  if (!sectionConflicts(current, section)) {
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

// (scoring & conflict analysis moved to /solver/*)

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
