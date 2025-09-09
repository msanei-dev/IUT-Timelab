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
