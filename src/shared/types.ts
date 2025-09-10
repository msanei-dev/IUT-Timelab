// Shared types for course data and schedules

export type Day = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimeSlot {
  day: Day;
  start: string; // 'HH:MM'
  end: string;   // 'HH:MM'
}

export interface Professor {
  name: string;
  takesAttendance: boolean;
  teachingQuality: 'excellent' | 'good' | 'average' | 'poor';
}

export interface Section {
  sectionCode: string;
  professor: Professor;
  schedule: TimeSlot[];
}

export interface Course {
  courseName: string;
  courseCode: string;
  units: number;
  sections: Section[];
}

export interface DataFile {
  courses: Course[];
}

export interface ScheduleSection {
  courseName: string;
  courseCode: string;
  sectionCode: string;
  professor: Professor;
  schedule: TimeSlot[];
}

export interface Schedule {
  sections: ScheduleSection[];
  score: number;
}

// ----- Course Grouping (new) -----
// Priority levels for course groups
export type CourseGroupPriority = 'High' | 'Medium' | 'Low';

// A logical grouping of alternative courses where the solver will pick at most one
export interface CourseGroup {
  id: string;              // unique identifier (e.g., UUID)
  name: string;            // user-defined label (e.g., 'ریاضیات')
  priority: CourseGroupPriority; // relative importance in selection/scoring
  courseCodes: string[];   // list of courseCode values belonging to this group
  isActive: boolean;       // whether this group participates in solving
}

// ----- Persistent User Settings -----
export interface UserPreferences {
  preferredProfessors: string[]; // global list of professor names user prefers
  timeSlotScores: Record<string, number>; // key: Day-Start-End -> score (e.g., Saturday-08:00-10:00)
  preferFreeDays: boolean; // whether free days should be emphasized
  weights: PreferenceWeights; // relative importance weights
}

export interface UserSettings {
  courseGroups: CourseGroup[];
  preferences: UserPreferences;
}

// Weights definition (extracted after UserSettings to avoid circular ordering issues when patching)
export interface PreferenceWeights {
  professor: number;   // weight for professor ratings influence
  timeSlot: number;    // weight for preferred time slots
  freeDay: number;     // weight for having free days
  compactness: number; // weight for schedule compactness metric
}

// User selection is simply a list of groups
export type UserSelection = CourseGroup[];
