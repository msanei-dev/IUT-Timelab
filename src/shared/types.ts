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
}

// User selection is simply a list of groups
export type UserSelection = CourseGroup[];
