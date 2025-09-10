import { ScheduleSection, Day, CourseGroup } from '../shared/types';

interface UserPreference {
  courseCode: string;
  courseName: string;
  priority: number;
  professorRatings: Record<string, number>;
  timeSlotRatings: Record<string, number>;
}

const PRIORITY_WEIGHT = 60;
const PROFESSOR_WEIGHT = 25;
const TIMESLOT_WEIGHT = 8;
const ATTENDANCE_BONUS = 40;
const EARLY_CLASS_BONUS = 10;
const LATE_CLASS_PENALTY = 30;
const FREE_DAY_BONUS = 60;

// Optional genome representation (mirrors GA SelectedSection) to allow group-aware bonuses
type Genome = ({ courseCode: string; sectionCode: string } | null)[];

const GROUP_PRIORITY_BONUS: Record<'High'|'Medium'|'Low', number> = {
  High: 100,
  Medium: 50,
  Low: 20
};

// Extended signature: genome & courseGroups are optional for backward compatibility
export function calculateScore(
  schedule: ScheduleSection[],
  preferences?: UserPreference[],
  genome?: Genome,
  courseGroups?: CourseGroup[]
): number {
  let score = 0;
  const days: Record<Day, number> = {
    Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0
  };
  const prefMap: Record<string, UserPreference> = {};
  if (preferences) for (const p of preferences) prefMap[p.courseCode] = p as UserPreference;
  const maxPriority = preferences && preferences.length ? Math.max(...preferences.map(p => p.priority)) : 0;

  for (const sec of schedule) {
    const pref = prefMap[sec.courseCode];
    if (pref) {
      const inverted = (maxPriority + 1 - pref.priority);
      score += inverted * PRIORITY_WEIGHT;
      const r = pref.professorRatings?.[sec.professor.name];
      if (r) score += (r - 3) * PROFESSOR_WEIGHT;
    }
    if (!sec.professor.takesAttendance) score += ATTENDANCE_BONUS;
    for (const slot of sec.schedule) {
      if (slot.end > '13:00') score -= LATE_CLASS_PENALTY;
      if (slot.start < '10:00') score += EARLY_CLASS_BONUS;
      days[slot.day]++;
      const pref = prefMap[sec.courseCode];
      if (pref) {
        const key = `${slot.day}-${slot.start}-${slot.end}`;
        const tr = pref.timeSlotRatings?.[key];
        if (tr) score += (tr - 3) * TIMESLOT_WEIGHT;
      }
    }
  }
  for (const d in days) if (days[d as Day] === 0) score += FREE_DAY_BONUS;

  // Group priority bonuses (only if genome & courseGroups provided and aligned)
  if (genome && courseGroups && genome.length === courseGroups.length) {
    for (let i=0; i<genome.length; i++) {
      const gene = genome[i];
      if (!gene) continue; // nothing selected from this group
      const g = courseGroups[i];
      if (!g) continue;
      const bonus = GROUP_PRIORITY_BONUS[g.priority] || 0;
      score += bonus;
    }
  }
  return score;
}
