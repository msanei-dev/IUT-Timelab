import { Course, ScheduleSection, Day, TimeSlot } from '../shared/types';
import { timeToMinutes } from '../utils/time';

function timeOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.day !== b.day) return false;
  const aS = timeToMinutes(a.start), aE = timeToMinutes(a.end);
  const bS = timeToMinutes(b.start), bE = timeToMinutes(b.end);
  return aS < bE && aE > bS;
}

function hasConflict(current: ScheduleSection[], section: ScheduleSection): boolean {
  for (const scheduled of current) {
    for (const slotA of scheduled.schedule) {
      for (const slotB of section.schedule) {
        if (timeOverlap(slotA, slotB)) return true;
      }
    }
  }
  return false;
}

export function analyzeConflicts(courses: Course[], desiredCourseNames: string[]) {
  const desired = courses.filter(c => desiredCourseNames.includes(c.courseName));
  const conflicts: any[] = [];
  const suggestions: any[] = [];
  for (let i = 0; i < desired.length; i++) {
    for (let j = i + 1; j < desired.length; j++) {
      const course1 = desired[i];
      const course2 = desired[j];
      let hasValidCombination = false;
      const conflictingSections: any[] = [];
      for (const section1 of course1.sections) {
        for (const section2 of course2.sections) {
          if (!hasConflict([
            { courseName: course1.courseName, courseCode: course1.courseCode, sectionCode: section1.sectionCode, professor: section1.professor, schedule: section1.schedule }
          ], { courseName: course2.courseName, courseCode: course2.courseCode, sectionCode: section2.sectionCode, professor: section2.professor, schedule: section2.schedule })) {
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
    suggestions: suggestions.slice(0, 10),
    totalConflicts: conflicts.length,
    coursesWithMultipleSections: desired.filter(c => c.sections.length > 1).map(c => ({
      courseName: c.courseName,
      sectionsCount: c.sections.length,
      sections: c.sections.map(s => ({ sectionCode: s.sectionCode, professor: s.professor.name, schedule: s.schedule }))
    }))
  };
}
