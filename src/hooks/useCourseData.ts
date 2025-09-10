import { useEffect, useState, useMemo } from 'react';

interface UseCourseDataResult {
  courseNames: string[];
  courses: any[] | null;
  courseNameMapping: Map<string,string>;
  reload: () => Promise<void>;
}

const api = (window as any).api;

export function useCourseData(): UseCourseDataResult {
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[] | null>(null);
  const [mapping, setMapping] = useState<Map<string,string>>(new Map());

  const buildDisplay = (coursesData: any) => {
    const map = new Map<string,string>();
    const display: string[] = [];
    coursesData.courses.forEach((c: any) => {
      if (c.sections && c.sections.length) {
        c.sections.forEach((section: any) => {
          const displayName = `${c.courseCode}_${section.sectionCode} - ${c.courseName}`;
          map.set(displayName, c.courseName);
          display.push(displayName);
        });
      } else {
        const displayName = `${c.courseCode} - ${c.courseName}`;
        map.set(displayName, c.courseName);
        display.push(displayName);
      }
    });
    setCourseNames(display);
    setMapping(map);
  };

  const reload = async () => {
    const data = await api.getData();
    setCourses(data.courses);
    buildDisplay(data);
  };

  useEffect(() => { reload(); }, []);

  return { courseNames, courses, courseNameMapping: mapping, reload };
}
