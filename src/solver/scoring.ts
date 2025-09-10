import { ScheduleSection, Day, CourseGroup, UserPreferences, PreferenceWeights } from '../shared/types';

// Legacy preference shape still passed from UI per-course (we keep interface for mapping):
interface LegacyCoursePreference {
  courseCode: string;
  courseName: string;
  priority: number; // smaller number = higher priority (as used before via inversion)
  professorRatings: Record<string, number>; // 1..5
  timeSlotRatings: Record<string, number>;  // 1..5
}

// Genome mirrors GA SelectedSection
type Genome = ({ courseCode: string; sectionCode: string } | null)[];

// Static mapping for group priority -> normalized value (0..1)
const GROUP_PRIORITY_VALUE: Record<'High'|'Medium'|'Low', number> = { High: 1, Medium: 0.6, Low: 0.3 };

// Hard penalties (not weight-based)
const HARD_EMPTY_SCHEDULE_PENALTY = -100000;
const HARD_CONFLICT_PENALTY = -100000; // (conflict penalty applied in GA already, but left for safety if reused)

// Utility: safe divide
const safeDiv = (a: number, b: number) => b === 0 ? 0 : a / b;

// Convert times HH:MM -> minutes
function toMinutes(t: string) { return (+t.slice(0,2))*60 + (+t.slice(3)); }

// 1. Professor bonus (normalized 0..1): average of (rating-1)/4 for used sections weighted by priority inversion
function computeProfessorScore(schedule: ScheduleSection[], prefsMap: Record<string, LegacyCoursePreference>, maxPriority: number): number {
  if (!schedule.length || !maxPriority) return 0;
  let total = 0, count = 0;
  for (const sec of schedule) {
    const p = prefsMap[sec.courseCode];
    if (!p) continue;
    const r = p.professorRatings?.[sec.professor.name];
    if (typeof r === 'number') {
      const norm = (r - 1) / 4; // 1..5 -> 0..1
      // priority inversion weighting (higher user priority -> larger weight)
      const inverted = (maxPriority + 1 - p.priority) / (maxPriority || 1);
      total += norm * inverted;
      count++;
    }
  }
  return safeDiv(total, count || 1); // 0..1
}

// 2. Time slot score (normalized 0..1): average of chosen slot rating
function computeTimeSlotScore(schedule: ScheduleSection[], prefsMap: Record<string, LegacyCoursePreference>): number {
  let total = 0, count = 0;
  for (const sec of schedule) {
    const p = prefsMap[sec.courseCode];
    if (!p) continue;
    for (const slot of sec.schedule) {
      const key = `${slot.day}-${slot.start}-${slot.end}`;
      const r = p.timeSlotRatings?.[key];
      if (typeof r === 'number') {
        total += (r - 1) / 4; // normalize
        count++;
      }
    }
  }
  return safeDiv(total, count || 1); // 0..1
}

// 3. Free day score (0..1): fraction of days with zero classes IF user prefers free days
function computeFreeDayScore(schedule: ScheduleSection[], userPrefs: UserPreferences | undefined): number {
  if (!userPrefs?.preferFreeDays) return 0; // user disabled influence
  const daySet: Record<Day, number> = { Saturday:0, Sunday:0, Monday:0, Tuesday:0, Wednesday:0, Thursday:0, Friday:0 };
  for (const sec of schedule) for (const slot of sec.schedule) daySet[slot.day]++;
  const activeDays = Object.values(daySet).filter(v=>v>0).length;
  if (activeDays === 0) return 0; // guard
  const freeDays = Object.values(daySet).filter(v=>v===0).length;
  // Encourage at least 2 active days (avoid trivial all-free) already handled by empty penalty; normalize by max possible free days (7 - minActive)
  return freeDays / 7; // 0..1
}

// 4. Compactness score (0..1): For each day with classes, compute time span vs occupied time
function computeCompactnessScore(schedule: ScheduleSection[]): number {
  if (!schedule.length) return 0;
  const byDay: Record<Day, { start: number; end: number; intervals: [number,number][] }> = {
    Saturday:{start:Infinity,end:-Infinity,intervals:[]}, Sunday:{start:Infinity,end:-Infinity,intervals:[]}, Monday:{start:Infinity,end:-Infinity,intervals:[]}, Tuesday:{start:Infinity,end:-Infinity,intervals:[]}, Wednesday:{start:Infinity,end:-Infinity,intervals:[]}, Thursday:{start:Infinity,end:-Infinity,intervals:[]}, Friday:{start:Infinity,end:-Infinity,intervals:[]}
  };
  for (const sec of schedule) for (const slot of sec.schedule) {
    const s = toMinutes(slot.start); const e = toMinutes(slot.end);
    const d = byDay[slot.day];
    d.start = Math.min(d.start, s);
    d.end = Math.max(d.end, e);
    d.intervals.push([s,e]);
  }
  let acc = 0, dayCount = 0;
  for (const day of Object.keys(byDay) as Day[]) {
    const d = byDay[day];
    if (!d.intervals.length) continue;
    dayCount++;
    // merge intervals to compute total occupied minutes
    d.intervals.sort((a,b)=>a[0]-b[0]);
    const merged: [number,number][] = [];
    for (const int of d.intervals) {
      if (!merged.length || int[0] > merged[merged.length-1][1]) merged.push([...int]);
      else merged[merged.length-1][1] = Math.max(merged[merged.length-1][1], int[1]);
    }
    const occupied = merged.reduce((s,[a,b])=>s+(b-a),0);
    const span = d.end - d.start;
    if (span <= 0) continue;
    // Compactness = occupied/span (higher better) *also ensures >0 breaks decrease score*
    acc += occupied / span; // 0..1
  }
  return dayCount ? acc / dayCount : 0;
}

// 5. Group priority score: proportion of active groups selected weighted by group priority (0..1)
function computeGroupPriorityScore(genome: Genome|undefined, courseGroups: CourseGroup[]|undefined): number {
  if (!genome || !courseGroups || genome.length !== courseGroups.length) return 0;
  let totalWeight = 0, selectedWeight = 0;
  for (let i=0;i<courseGroups.length;i++) {
    const g = courseGroups[i];
    const w = GROUP_PRIORITY_VALUE[g.priority] || 0;
    totalWeight += w;
    if (genome[i]) selectedWeight += w;
  }
  return totalWeight ? selectedWeight / totalWeight : 0;
}

// Map legacy per-course preferences into a quick lookup
function buildPrefMap(prefs?: LegacyCoursePreference[]): { map: Record<string, LegacyCoursePreference>; maxPriority: number } {
  const map: Record<string, LegacyCoursePreference> = {};
  if (!prefs || !prefs.length) return { map, maxPriority: 0 };
  for (const p of prefs) map[p.courseCode] = p;
  const maxPriority = Math.max(...prefs.map(p=>p.priority));
  return { map, maxPriority };
}

// Main scoring function now weight-aware
export function calculateScore(
  schedule: ScheduleSection[],
  legacyPreferences?: LegacyCoursePreference[],
  genome?: Genome,
  courseGroups?: CourseGroup[],
  userPreferences?: UserPreferences // full persistent preferences (contains global weights)
): number {
  if (!schedule || schedule.length === 0) return HARD_EMPTY_SCHEDULE_PENALTY;

  // Extract weights (fallback to neutral 50 each -> normalized to 0.5 when scaling components)
  const weights: PreferenceWeights = userPreferences?.weights || { professor:50, timeSlot:50, freeDay:50, compactness:50 };
  const weightNorm = (v:number)=> v/100; // map 0..100 -> 0..1

  // Build preference map for legacy per-course ratings
  const { map: prefMap, maxPriority } = buildPrefMap(legacyPreferences);

  // Raw component scores 0..1
  const professorScore   = computeProfessorScore(schedule, prefMap, maxPriority);
  const timeSlotScore    = computeTimeSlotScore(schedule, prefMap);
  const freeDayScore     = computeFreeDayScore(schedule, userPreferences);
  const compactnessScore = computeCompactnessScore(schedule);
  const groupSelectionScore = computeGroupPriorityScore(genome, courseGroups);

  // Weighted aggregation (simple weighted sum). We treat groupSelectionScore as structural -> average with others equally (could add own weight later).
  const weighted = (
    professorScore   * weightNorm(weights.professor) +
    timeSlotScore    * weightNorm(weights.timeSlot) +
    freeDayScore     * weightNorm(weights.freeDay) +
    compactnessScore * weightNorm(weights.compactness)
  ) / 4; // average of weighted components -> still 0..1 since each component <= weightNorm<=1

  // Combine with group selection (50/50 blend for now)
  const finalNormalized = (weighted + groupSelectionScore) / 2; // 0..1

  // Scale to a more separable numeric range for GA (e.g., 0..1000)
  const GA_SCALE = 1000;
  let score = finalNormalized * GA_SCALE;

  // Attendance heuristic: reward courses without attendance slightly (0..1 bump before scale was already aggregated; we add minor post-scale bonus)
  const attendanceBoost = schedule.filter(s=>!s.professor.takesAttendance).length;
  score += attendanceBoost * 5; // small additive effect

  return score;
}

// New: detailed breakdown mirroring the exact formula used in calculateScore
export interface ScoreBreakdownComponents {
  professors: number;
  timeSlots: number;
  freeDays: number;
  compactness: number;
  groupPriority: number;
  attendance: number;
  conflictPenalty: number; // (not applied inside scoring but can be shown if computed externally)
  total: number;
}

export function calculateScoreBreakdown(
  schedule: ScheduleSection[],
  legacyPreferences?: LegacyCoursePreference[],
  genome?: Genome,
  courseGroups?: CourseGroup[],
  userPreferences?: UserPreferences
): ScoreBreakdownComponents {
  if (!schedule || schedule.length === 0) {
    return { professors:0, timeSlots:0, freeDays:0, compactness:0, groupPriority:0, attendance:0, conflictPenalty:0, total: -100000 };
  }
  const weights: PreferenceWeights = userPreferences?.weights || { professor:50, timeSlot:50, freeDay:50, compactness:50 };
  const { map: prefMap, maxPriority } = buildPrefMap(legacyPreferences);
  const professorScore   = computeProfessorScore(schedule, prefMap, maxPriority);
  const timeSlotScore    = computeTimeSlotScore(schedule, prefMap);
  const freeDayScore     = computeFreeDayScore(schedule, userPreferences);
  const compactnessScore = computeCompactnessScore(schedule);
  const groupSelectionScore = computeGroupPriorityScore(genome, courseGroups);
  const weightNorm = (v:number)=> v/100;
  const GA_SCALE = 1000;
  // Component contributions before blending with group priority
  const profPart = (professorScore * weightNorm(weights.professor))/4 * 0.5 * GA_SCALE;
  const timePart = (timeSlotScore * weightNorm(weights.timeSlot))/4 * 0.5 * GA_SCALE;
  const freePart = (freeDayScore * weightNorm(weights.freeDay))/4 * 0.5 * GA_SCALE;
  const compactPart = (compactnessScore * weightNorm(weights.compactness))/4 * 0.5 * GA_SCALE;
  const groupPart = groupSelectionScore * 0.5 * GA_SCALE; // second half of blend
  const attendanceBoost = schedule.filter(s=>!s.professor.takesAttendance).length * 5;
  const total = profPart + timePart + freePart + compactPart + groupPart + attendanceBoost;
  return {
    professors: Math.round(profPart),
    timeSlots: Math.round(timePart),
    freeDays: Math.round(freePart),
    compactness: Math.round(compactPart),
    groupPriority: Math.round(groupPart),
    attendance: Math.round(attendanceBoost),
    conflictPenalty: 0,
    total: Math.round(total)
  };
}
