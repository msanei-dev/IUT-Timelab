// Backtracking solver and scoring engine for Smart University Course Scheduler
import fs from 'fs';
import path from 'path';
import { DataFile, Course, Section, Schedule, ScheduleSection, TimeSlot, Day } from './shared/types';

// Load data.json
export function loadData(): DataFile {
  const dataPath = path.join(__dirname, 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

// Check if two time slots overlap
function timeOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.day !== b.day) return false;
  return !(a.end <= b.start || b.end <= a.start);
}

// Check if a section's schedule conflicts with current schedule
function hasConflict(current: ScheduleSection[], section: Section): boolean {
  for (const scheduled of current) {
    for (const slotA of scheduled.schedule) {
      for (const slotB of section.schedule) {
        if (timeOverlap(slotA, slotB)) return true;
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
  const desired = courses.filter(c => desiredCourseNames.includes(c.courseName));
  const results: ScheduleSection[][] = [];

  function backtrack(idx: number, current: ScheduleSection[]) {
    if (idx === desired.length) {
      results.push([...current]);
      return;
    }
    for (const section of desired[idx].sections) {
      if (!hasConflict(current, section)) {
        current.push({
          courseName: desired[idx].courseName,
          courseCode: desired[idx].courseCode,
          sectionCode: section.sectionCode,
          professor: section.professor,
          schedule: section.schedule
        });
        backtrack(idx + 1, current);
        current.pop();
      }
    }
  }

  backtrack(0, []);
  return results;
}

// Scoring function
export function calculateScore(schedule: ScheduleSection[]): number {
  let score = 0;
  const days: Record<Day, number> = {
    Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0
  };

  for (const sec of schedule) {
    // Professor's Attendance
    if (!sec.professor.takesAttendance) score += 100;
    for (const slot of sec.schedule) {
      // Time of Day
      if (slot.end > '13:00') score -= 50;
      if (slot.start < '10:00') score += 20;
      days[slot.day]++;
    }
  }
  // Free days
  for (const d in days) {
    if (days[d as Day] === 0) score += 75;
  }
  return score;
}

// Main API: get ranked schedules
export function getRankedSchedules(desiredCourseNames: string[]): Schedule[] {
  const data = loadData();
  const all = findSchedules(data.courses, desiredCourseNames);
  return all.map(sections => ({
    sections,
    score: calculateScore(sections)
  })).sort((a, b) => b.score - a.score);
}
