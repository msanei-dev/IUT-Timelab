import React, { useEffect, useState, useRef } from 'react';
import { CourseGroup, UserSettings, UserPreferences, PreferenceWeights } from './shared/types';
import CourseSelector from './CourseSelector';
import CalendarView from './CalendarView';
import PlanNavigator from './PlanNavigator';
import { parseTableData } from './utils/parsing';
import { buildConflictMessage } from './utils/conflictMessages';
import DataInput from './DataInput';
import PreferencePanel from './PreferencePanel';
import CourseDetails from './CourseDetails';
import GroupManager from './GroupManager';
import { GroupingOverlay } from './components/GroupingOverlay';
import { ScheduleHeader } from './components/ScheduleHeader';
import ScoreDetailsPanel from './components/ScoreDetailsPanel';
import { GroupingConfig } from './grouping'; // (kept for potential future typing references)
import { useCourseData } from './hooks/useCourseData';
import { useScheduling } from './hooks/useScheduling';
import Prism from './components/Prism';
import { runGenetic, convertBestToSchedule } from './solver/genetic';
import { calculateScore } from './solver/scoring';
import TitleBar from './components/TitleBar';

const api = (window as any).api;

// Toggle to show/hide the course data add/import controls globally
const SHOW_COURSE_DATA_IMPORT = true; // set to false to hide DataInput and Excel import button

const App: React.FC = () => {
  const { courseNames, courses, courseNameMapping, reload } = useCourseData();
  const [selected, setSelected] = useState<string[]>([]);
  // New: course groups (read from localStorage v2 if exists)
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // جلوگیری از ذخیره قبل از بارگذاری
  // نگهداری نسخه قبلی برای تشخیص تغییر
  const lastSavedRef = useRef<string>('');
  // Modal to show full course list (CourseSelector) instead of inline massive list
  const [showCourseBrowser, setShowCourseBrowser] = useState(false);
  const { schedules, currentIdx, setCurrentIdx, loading, groupingConfig, setGroupingConfig, options, setOptions, generate } = useScheduling({ groups: [] });
  const [preferences, setPreferences] = useState<any[]>([]);
  // Faculty filter (prefix-based) should be available before syncing effect uses it
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  // همگام سازی بین GroupManager (groupingConfig) و مدل جدید CourseGroup
  useEffect(()=>{
    if (!courses) return;
    const legacy = groupingConfig.groups || [];
    const prevMap: Record<string, CourseGroup> = {};
    for (const g of courseGroups) prevMap[g.id] = g;
    const derived: CourseGroup[] = legacy.map((g, idx) => {
      const codes: string[] = [];
      courses.forEach(c => {
        // Only include course codes for selected faculty (by prefix) when a faculty is chosen
        const inSelectedFaculty = !selectedFaculty || (c.courseCode && c.courseCode.toString().startsWith(selectedFaculty));
        // Only include courses that have at least one section (selectable)
        const hasSections = Array.isArray(c.sections) && c.sections.length > 0;
        if (inSelectedFaculty && hasSections && g.courseNames.includes(c.courseName)) {
          codes.push(c.courseCode);
        }
      });
      const prev = prevMap[g.id];
      return {
        id: g.id,
        name: g.name,
        courseCodes: codes,
        priority: prev?.priority || (idx===0? 'High' : idx<3? 'Medium':'Low'),
        isActive: prev?.isActive !== undefined ? prev.isActive : true
      };
    });
    setCourseGroups(derived);
  }, [groupingConfig, courses, selectedFaculty]);

  // ---------- Settings Persistence (IPC) ----------
  // ساخت UserPreferences از آرایه preferences موجود (الگوی ساده استخراج)
  const defaultWeights: PreferenceWeights = { professor:50, timeSlot:50, freeDay:50, compactness:50 };
  const [prefWeights, setPrefWeights] = useState<PreferenceWeights>(defaultWeights);
  const buildUserPreferences = (): UserPreferences => {
    const preferredProfessorsSet = new Set<string>();
    const timeSlotScores: Record<string, number> = {};
    try {
      preferences.forEach((p: any) => {
        if (p.professorRatings) {
          Object.entries(p.professorRatings).forEach(([prof, rating]) => {
            if (typeof rating === 'number' && rating >= 4) preferredProfessorsSet.add(prof);
          });
        }
        if (p.timeSlotRatings) {
          Object.entries(p.timeSlotRatings).forEach(([slot, rating]) => {
            if (typeof rating === 'number') {
              // بالاترین امتیاز برای هر اسلات ذخیره شود
              timeSlotScores[slot] = Math.max(timeSlotScores[slot] || 0, rating as number);
            }
          });
        }
      });
    } catch {}
    return {
      preferredProfessors: Array.from(preferredProfessorsSet),
      timeSlotScores,
      preferFreeDays: true,
  weights: prefWeights
    };
  };

  // بارگذاری تنظیمات هنگام شروع
  useEffect(() => {
    (async () => {
      try {
        const res = await (window as any).api?.loadSettings?.();
        if (res && res.success && res.data) {
          const data: UserSettings = res.data;
          if (Array.isArray(data.courseGroups)) setCourseGroups(data.courseGroups);
          if (data.preferences && data.preferences.weights) {
            setPrefWeights({
              professor: data.preferences.weights.professor ?? 50,
              timeSlot: data.preferences.weights.timeSlot ?? 50,
              freeDay: data.preferences.weights.freeDay ?? 50,
              compactness: data.preferences.weights.compactness ?? 50
            });
          }
        }
      } catch (e) {
        console.warn('Settings load failed (fallback to empty):', e);
      } finally {
        setIsDataLoaded(true);
      }
    })();
  }, []);

  // ذخیره خودکار (debounced)
  useEffect(() => {
    if (!isDataLoaded) return; // صبر تا بارگذاری اولیه
    const settings: UserSettings = {
      courseGroups,
      preferences: buildUserPreferences()
    };
    const serialized = JSON.stringify(settings);
    if (serialized === lastSavedRef.current) return; // تغییری نکرده
    const handle = setTimeout(() => {
      (async () => {
        try {
          await (window as any).api?.saveSettings?.(settings);
          lastSavedRef.current = serialized;
        } catch (e) {
          console.error('Failed to save settings:', e);
        }
      })();
    }, 400); // debounce 400ms
    return () => clearTimeout(handle);
  }, [courseGroups, preferences, prefWeights, isDataLoaded]);
  // NOTE: useScheduling currently returns schedules as state but not a direct setter.
  // We simulate setSchedules via a local ref to mutate schedules array when using GA.
  // Quick workaround: extend hook or maintain a parallel local state when GA used.
  const [gaSchedules, setGASchedules] = useState<any[] | null>(null);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'preferences' | 'details'>('courses');
  // Theme (light/dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    } catch { return 'dark'; }
  });
  // Grouping configuration state
  // groupingConfig managed by scheduling hook
  const [showGroups, setShowGroups] = useState(false); // overlay modal
  const [minUnits, setMinUnits] = useState<number | ''>('');
  const [maxUnits, setMaxUnits] = useState<number | ''>('');
  const [allowSkipping, setAllowSkipping] = useState<boolean>(true);
  
  // Map between display names and actual course names
  // mapping provided by hook

  // reset faculty when courses reloaded
  useEffect(()=>{ setSelectedFaculty(null); }, [courses]);

  // legacy backtracking تولید برنامه حذف شد؛ فقط GA استفاده می‌شود.

  // Genetic Algorithm schedule generation (group-aware)
  const generateGASchedules = async () => {
    if (!courses || !courses.length) { alert('ابتدا داده دروس را وارد کنید'); return; }
  if (!courseGroups.length) { alert('ابتدا گروه درسی بسازید'); return; }
  const activeGroupsRaw = courseGroups.filter(g => g.isActive);
  if (!activeGroupsRaw.length) { alert('هیچ گروه فعالی برای محاسبه وجود ندارد (همه Off هستند).'); return; }
  const activeGroups = activeGroupsRaw.filter(g => g.courseCodes && g.courseCodes.length > 0);
  if (!activeGroups.length) {
    alert('هیچ گزینه‌ای برای انتخاب در گروه‌های فعال یافت نشد. لطفاً در "مدیریت گروه‌ها" مطمئن شوید هر گروه فعال حداقل یک درس دارای سکشن دارد.');
    return;
  }
    setCurrentIdx(0);
    try {
      // Basic params can be tuned later / maybe add UI controls
      const minU = minUnits === '' ? 0 : Number(minUnits);
      const maxU = maxUnits === '' ? Infinity : Number(maxUnits || Infinity);
      const userPrefsFull = buildUserPreferences();
  const gaResult = runGenetic({
        courseGroups: activeGroups,
        courses,
        preferences,
        userPreferences: userPrefsFull,
        minUnits: minU,
        maxUnits: maxU
  }, { populationSize: 140, generations: 120 });

      // Collect unique schedules from population (top N)
      const seen = new Set<string>();
      const ranked: any[] = [];
      for (const ind of gaResult.population.sort((a,b)=>b.fitness-a.fitness)) {
        const schedule = convertBestToSchedule({ best: ind, history: [], population: [] } as any, courses);
        const key = schedule.map(s => `${s.courseCode}_${s.sectionCode}`).sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        // fitness already incorporates weighted scoring; we can expose as score directly
        const score = ind.fitness;
        // Units
        const totalUnits = schedule.reduce((sum, s) => {
          const c = courses.find(cc => cc.courseCode === s.courseCode); return sum + (c?.units||0);
        },0);
        if (totalUnits < minU || totalUnits > maxU) continue;
        ranked.push({ sections: schedule, score, units: totalUnits, meta: { fitness: ind.fitness } });
        if (ranked.length >= 50) break; // limit display
      }
      if (!ranked.length) {
        alert('برنامه معتبری یافت نشد (محدودیت واحد یا تداخل‌ها). پارامترها را تغییر دهید.');
      }
      ranked.sort((a,b)=>b.score-a.score);
  setGASchedules(ranked as any);
    } catch (err:any) {
      console.error('GA error', err);
      alert('خطا در اجرای الگوریتم ژنتیک');
    }
  };

  // استخراج «دانشکده» ها بر اساس پیشوند کد درس (فرض: سه رقم/کاراکتر اول)
  const facultyPrefixes: string[] = React.useMemo(() => {
  if (!courses) return [];
  const set = new Set<string>();
  courses.forEach((c: any) => {
      if (c.courseCode) {
        const prefix = c.courseCode.toString().slice(0,2); // فقط دو رقم اول طبق درخواست
        if (prefix) set.add(prefix);
      }
    });
    return Array.from(set).sort();
  }, [courses]);

  // نگاشت prefix به لیبل نمایشی (در صورت نبود جدول واقعی، پیشوند خام)
  const facultyNames: Record<string,string> = {
    '11': 'مهندسی مواد',
    '12': 'مهندسی معدن',
    '13': 'مهندسی صنایع',
    '14': 'مهندسی شیمی',
    '15': 'مهندسی مکانیک',
    '16': 'مهندسی عمران',
    '17': 'برق و کامپیوتر',
    '19': 'علوم ریاضی',
    '20': 'فیزیک',
    '21': 'شیمی',
    '22': 'حمل و نقل',
    '24': 'مهارت‌های فنی مهندسی',
    '25': 'مرکز زبان',
    '26': 'معارف',
    '27': 'تربیت بدنی',
    '34': 'نساجی',
    '36': 'کشاورزی',
    '37': 'منابع طبیعی',
    'other': 'سایر'
  };
  const facultyLabel = (prefix: string) => facultyNames[prefix] || facultyNames['other'] || `دانشکده`;

  // فیلتر نام‌های درس بر اساس دانشکده انتخابی
  const filteredCourseNamesForGrouping: string[] = React.useMemo(() => {
    if (!selectedFaculty) return courseNames.map(dn => courseNameMapping.get(dn) || dn);
    if (!courses) return [];
    const allowed = new Set(
      courses.filter((c: any) => c.courseCode && c.courseCode.toString().startsWith(selectedFaculty))
        .map((c: any) => c.courseName)
    );
    // courseNames آرایه نمایش سکشن‌هاست؛ باید تبدیل به نام اصلی سپس فیلتر
    const baseNames = new Set<string>();
    courseNames.forEach(dn => {
      const base = courseNameMapping.get(dn) || dn;
      if (allowed.has(base)) baseNames.add(base);
    });
    return Array.from(baseNames).sort();
  }, [selectedFaculty, courses, courseNames, courseNameMapping]);

  const clearAllData = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه داده‌ها را حذف کنید؟\nاین عمل قابل بازگشت نیست.')) {
      try {
  await api.saveData({ courses: [] });
  await reload();
  setSelected([]);
  setPreferences([]);
  setCurrentIdx(0);
        
        console.log('All data cleared successfully'); // Debug log
        alert('همه داده‌ها با موفقیت حذف شدند!');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('خطا در حذف داده‌ها');
      }
    }
  };

  const importFromExcel = async () => {
    try {
  // show loading via scheduling hook
  setOptions(o=>({...o}));
      
      // انتخاب فایل
      const fileResult = await api.importExcel();
      
      if (!fileResult.success) {
        alert(fileResult.message);
        return;
      }

      // پردازش داده اکسل
      const processResult = await api.processExcelData(fileResult.fileBuffer);
      if (processResult.success) {
        await reload();
        setSelected([]);
        setCurrentIdx(0);
        alert(processResult.message);
      } else {
        alert(processResult.message);
    }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('خطا در خواندن فایل اکسل');
    } finally {
      /* hook manages loading */
  };
  };
  const handleDataSubmit = async (rawData: string) => {
    try {
      console.log('Raw data received:', rawData); // Debug log
      
      // پارس کردن داده‌های خام به فرمت JSON
      const newParsedData = parseTableData(rawData);
      
      console.log('New parsed data:', newParsedData); // Debug log
      
      if (!newParsedData.courses || newParsedData.courses.length === 0) {
        alert('هیچ درسی شناسایی نشد! لطفاً فرمت داده‌ها را بررسی کنید.');
        return;
      }
      
      // دریافت داده‌های موجود
      const existingData = await api.getData();
      console.log('Existing data:', existingData); // Debug log
      
      // ادغام داده‌های جدید با موجود
      const mergedCourses = [...(existingData.courses || [])];
      
      for (const newCourse of newParsedData.courses) {
        const existingIndex = mergedCourses.findIndex(c => c.courseCode === newCourse.courseCode);
        if (existingIndex >= 0) {
          // اگر درس موجود بود، section های جدید رو اضافه کن
          const existingCourse = mergedCourses[existingIndex];
          for (const newSection of newCourse.sections) {
            const sectionExists = existingCourse.sections.some((s: any) => s.sectionCode === newSection.sectionCode);
            if (!sectionExists) {
              existingCourse.sections.push(newSection);
            }
          }
        } else {
          // اگر درس جدید بود، کل درس رو اضافه کن
          mergedCourses.push(newCourse);
        }
      }
      
      const finalData = { courses: mergedCourses };
      console.log('Final merged data:', finalData); // Debug log
      
      // ذخیره‌سازی داده‌های ادغام شده
      await api.saveData(finalData);
      
      // به‌روزرسانی داده‌های کامل درس‌ها
  await reload();
  console.log('Updated course data'); // Debug log
      
      alert(`داده‌ها با موفقیت ذخیره شدند! ${newParsedData.courses.length} درس جدید اضافه شد. مجموع: ${finalData.courses.length} درس`);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('خطا در ذخیره‌سازی داده‌ها: ' + error.message);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      console.log('File content:', text); // Debug log
      
      // Process the file content same as manual input
      await handleDataSubmit(text);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('خطا در خواندن فایل: ' + error.message);
    }
  };

  // parseTableData imported from utils/parsing

  // Apply theme attribute
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('dir', 'rtl');
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t==='dark' ? 'light' : 'dark');

  return (
    <>
      <TitleBar onThemeToggle={toggleTheme} currentTheme={theme} />
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'Estedad, sans-serif',
        background: 'radial-gradient(circle at 30% 30%, #1f2632, #0d1218)',
        paddingTop: '52px', // space for title bar
        padding: '52px 18px 18px 18px',
        gap: '16px',
        boxSizing: 'border-box'
      }}>
        <Prism animationType="rotate" timeScale={0.4} height={3.5} baseWidth={5.5} scale={3.2} hueShift={0.4} colorFrequency={1.2} noise={0.35} glow={1.2} bloom={1.1} />
      {/* Sidebar */}
      <div className="card" style={{
        width: 380,
        padding: '20px 16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        animation: 'slideInLeft 0.6s ease-out',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2
      }}>
        {/* Theme Toggle */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'8px' }}>
          <button onClick={toggleTheme} className="theme-toggle simple" aria-label="تغییر تم">
            {theme==='dark' ? (
              <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"/></svg>
            ) : (
              <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
        </div>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 6px 0',
            color: 'var(--text-primary)'
          }}>
            برنامه‌ساز هوشمند
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            margin: 0,
            fontWeight: '400'
          }}>
            ساخت برنامه کلاسی هوشمند و بهینه
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="card" style={{
          display: 'flex',
          marginBottom: '18px',
          padding: '4px',
          gap: '2px'
        }}>
          <button
            onClick={() => setActiveTab('courses')}
            className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            انتخاب درس‌ها
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            ترجیحات
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`nav-tab ${activeTab === 'details' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            جزئیات
          </button>
        </div>

        {activeTab === 'courses' ? (
          <div className="card" style={{ padding: '16px', position:'relative' }}>
            {SHOW_COURSE_DATA_IMPORT && (
              <DataInput 
                onDataSubmit={handleDataSubmit} 
                onFileUpload={handleFileUpload}
              />
            )}
            <button
              onClick={() => setShowGroups(true)}
              className="btn btn-secondary"
              style={{ width:'100%', marginTop:'8px', fontSize:'12px', fontWeight:600 }}
            >مدیریت گروه‌های انتخابی</button>
            
            {/* Group summary replaces immediate giant course list */}
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button
                  className="btn btn-outline"
                  style={{ fontSize:'11px', fontWeight:600, padding:'6px 10px' }}
                  onClick={()=>setShowCourseBrowser(true)}
                  disabled={!courseNames.length}
                >نمایش همه دروس ({courseNames.length})</button>
              </div>
        {courseGroups.length === 0 ? (
                <div style={{ fontSize:'11px', color:'var(--text-secondary)', lineHeight:1.6 }}>
                  هنوز گروهی ساخته نشده است. روی «مدیریت گروه‌های انتخابی» کلیک کنید تا گروه بسازید.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:'11px', color:'var(--text-secondary)' }}>گروه‌های شما:</div>
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:2, maxHeight:170, overflowY:'auto' }}>
          {courseGroups.map(g => (
                      <li key={g.id} style={{
                        display:'grid',
                        gridTemplateColumns:'minmax(0,1fr) auto auto',
                        alignItems:'center',
                        columnGap:6,
                        background:'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                        border:'1px solid rgba(255,255,255,0.05)',
                        padding:'4px 8px',
                        borderRadius:4,
                        position:'relative'
                      }}>
                        <span style={{ fontSize:'11px', fontWeight:600, color: g.isActive? 'var(--text-primary)':'#f87171', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</span>
                        <span style={{ fontSize:'9px', color:'var(--text-secondary)', padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,0.05)' }}>{g.courseCodes.length}</span>
                        <span style={{
                          fontSize:'9px',
                          fontWeight:600,
                          padding:'2px 6px',
                          borderRadius:4,
                          background: g.priority==='High'? 'linear-gradient(90deg,#dc2626,#b91c1c)': g.priority==='Medium'? 'linear-gradient(90deg,#2563eb,#1d4ed8)':'linear-gradient(90deg,#059669,#047857)',
                          color:'#fff',
                          letterSpacing:0.3,
                          lineHeight:1.2
                        }}>{g.priority==='High'? 'بالا': g.priority==='Medium'? 'متوسط':'کم'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'16px' }}>
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',
                gap:'8px',
                width:'100%',
                boxSizing:'border-box',
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.06)',
                padding:'10px 10px 8px',
                borderRadius:'10px',
                backdropFilter:'blur(14px) saturate(140%)',
                WebkitBackdropFilter:'blur(14px) saturate(140%)'
              }}>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, marginBottom:2, color:'var(--text-secondary)' }}>حداقل واحد</label>
                  <input type="number" min={0} value={minUnits} onChange={e => setMinUnits(e.target.value===''?'' : Number(e.target.value))} className="form-control" style={{ fontSize:'11px', padding:'4px 6px', height:30 }} placeholder="مثلاً 12" />
                </div>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, marginBottom:2, color:'var(--text-secondary)' }}>حداکثر واحد</label>
                  <input type="number" min={0} value={maxUnits} onChange={e => setMaxUnits(e.target.value===''?'' : Number(e.target.value))} className="form-control" style={{ fontSize:'11px', padding:'4px 6px', height:30 }} placeholder="مثلاً 20" />
                </div>
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <label style={{
                    fontSize:'10px',
                    fontWeight:600,
                    display:'flex',
                    alignItems:'center',
                    gap:4,
                    cursor:'pointer',
                    padding:'4px 6px',
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'6px',
                    color:'var(--text-primary)',
                    minHeight:30
                  }} title="اجازه می‌دهد بعضی درس‌ها برای رسیدن به برنامه بهتر حذف شوند">
                    <input type="checkbox" checked={allowSkipping} onChange={e => setAllowSkipping(e.target.checked)} style={{ accentColor:'#3d6bff', margin:0 }} />
                    <span>اجازه حذف</span>
                  </label>
                </div>
              </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap:'wrap' }}>
                {courseGroups.length>0 && (
                  <button
                    onClick={generateGASchedules}
                    disabled={loading}
        className="btn btn-primary"
                    style={{ flex: 2, fontSize:'12px', fontWeight:600, padding:'8px 12px' }}
                    title="الگوریتم ژنتیک: انتخاب حداکثر یک درس از هر گروه بر اساس ترجیحات"
                  >
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14l3 3-3 3-3-3z" />
                    </svg>
        تولید برنامه (GA)
                  </button>
                )}
                <button 
                  onClick={clearAllData}
                  disabled={loading}
                  className="btn btn-danger"
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 12px'
                  }}
                  title="حذف همه داده‌ها"
                >
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  حذف
                </button>
                {SHOW_COURSE_DATA_IMPORT && (
                  <button 
                    onClick={importFromExcel}
                    disabled={loading}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '8px 12px'
                    }}
                    title="خواندن دروس از فایل اکسل"
                  >
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <path d="M9 15h6M9 12h6M9 9h6" />
                    </svg>
                    اکسل
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'preferences' ? (
          <div className="card" style={{ padding: '16px' }}>
            <PreferencePanel
              courses={courses || []}
              courseGroups={courseGroups}
              onPreferencesChange={setPreferences}
              weights={prefWeights}
              onWeightsChange={setPrefWeights}
              selectedFaculty={selectedFaculty}
              onGroupOrderChange={(orderedIds)=>{
                // Map ordered IDs to new priorities: first -> High, next two -> Medium, rest -> Low (保持 منطق قبلی تقریبی)
                setCourseGroups(prev => {
                  const idToIndex: Record<string, number> = {};
                  orderedIds.forEach((id, idx)=>{ idToIndex[id]=idx; });
                  return [...prev]
                    .sort((a,b)=> (idToIndex[a.id]??999) - (idToIndex[b.id]??999))
                    .map((g, idx) => ({
                      ...g,
                      priority: idx===0 ? 'High' : idx<3 ? 'Medium' : 'Low'
                    }));
                });
              }}
            />
          </div>
        ) : (
          <div className="card" style={{ padding: '16px' }}>
            <CourseDetails 
              courses={courses} 
              activeCourseCodes={courseGroups
                .filter(g=>g.isActive)
                .flatMap(g=>g.courseCodes)
                .filter(code => (courses||[]).some(c=>c.courseCode===code && c.sections && c.sections.length>0))}
            />
          </div>
        )}
      </div>
      
      <GroupingOverlay
        show={showGroups}
        onClose={()=>setShowGroups(false)}
        selectedFaculty={selectedFaculty}
        setSelectedFaculty={setSelectedFaculty}
        facultyPrefixes={facultyPrefixes}
        facultyLabel={facultyLabel}
        groupingConfig={groupingConfig}
        setGroupingConfig={setGroupingConfig}
        filteredCourseNamesForGrouping={filteredCourseNamesForGrouping}
      />
      {showCourseBrowser && (
        <div className="modal-overlay">
          <div className="card course-browser">
            <button onClick={()=>setShowCourseBrowser(false)} className="modal-close">بستن</button>
            <h2 className="modal-title">لیست کامل دروس</h2>
            <div style={{ height:'calc(100% - 40px)', overflow:'auto' }}>
              <CourseSelector courseNames={courseNames} selected={selected} setSelected={setSelected} />
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="card" style={{
        flex: 1,
        minWidth: 0,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        animation: 'fadeInUp 0.6s ease-out',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {(gaSchedules ? gaSchedules : schedules).length > 0 ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              rowGap: 8
            }}>
              <ScheduleHeader schedules={(gaSchedules? gaSchedules : schedules) as any} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} />
              <button
                onClick={()=>setShowScoreDetails(true)}
                style={{
                  background: 'var(--primary-gradient)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px -4px rgba(37,99,235,0.4)',
                  height: '40px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                </svg>
                جزئیات امتیاز
              </button>
            </div>
            <div style={{ flex: 1, marginBottom: '24px' }}>
              <CalendarView schedule={(gaSchedules? gaSchedules : schedules)[currentIdx]} />
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'var(--secondary-gradient)',
              borderRadius: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-medium)',
              animation: 'pulse 2s infinite'
            }}>
              <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              آماده برای شروع!
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '400px',
              lineHeight: '1.6',
              margin: 0
            }}>
              لطفاً اطلاعات درس‌ها را وارد کرده، درس‌های مورد نظر و ترجیحات خود را انتخاب کنید
            </p>
          </div>
        )}
        <ScoreDetailsPanel
          open={showScoreDetails}
          onClose={()=>setShowScoreDetails(false)}
          schedule={(gaSchedules? gaSchedules : schedules)[currentIdx] || null}
          courseGroups={courseGroups.filter(g=>g.isActive)}
          userPreferences={buildUserPreferences()}
        />
      </div>
    </div>
    </>
  );
};

export default App;

