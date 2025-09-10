import React, { useState, useMemo } from 'react';

interface Props {
  courseNames: string[];
  selected: string[];
  setSelected: (sel: string[]) => void;
}

const CourseSelector: React.FC<Props> = ({ courseNames, selected, setSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  // Test the faculty code extraction with sample data
  React.useEffect(() => {
    // Test with sample course name with section code
    const sampleCourse = "1510205_01 - علم مواد";
    console.log('Testing with sample course:', sampleCourse);
    const testCode = extractFacultyCode(sampleCourse);
    console.log('Extracted faculty code:', testCode);
  }, []);

  // Extract faculty code from course name
  const extractFacultyCode = (courseName: string): string => {
    // Look for patterns like "1510205_01" in course name (courseCode_sectionCode format)
    const sectionCodeMatch = courseName.match(/(\d{7})_\d+/);
    if (sectionCodeMatch) {
      const facultyCode = sectionCodeMatch[1].substring(0, 2);
      return facultyCode;
    }
    
    // Look for patterns like "1510205" in course name (just courseCode)
    const codeMatch = courseName.match(/(\d{7})/);
    if (codeMatch) {
      const facultyCode = codeMatch[1].substring(0, 2);
      return facultyCode;
    }
    
    // Alternative: look for patterns like "(1510205)" 
    const parenthesesMatch = courseName.match(/\((\d{7})\)/);
    if (parenthesesMatch) {
      const facultyCode = parenthesesMatch[1].substring(0, 2);
      return facultyCode;
    }
    
    // Look for standalone codes at the beginning of course name
    const beginMatch = courseName.match(/^(\d{2})\d{5}/);
    if (beginMatch) {
      const facultyCode = beginMatch[1];
      return facultyCode;
    }
    
    return 'other';
  };

  // Get all faculties with their codes
  const faculties = useMemo(() => {
    const facultyMap = new Map<string, { code: string; count: number; courses: string[] }>();
    
    courseNames.forEach(course => {
      const facultyCode = extractFacultyCode(course);
      if (!facultyMap.has(facultyCode)) {
        facultyMap.set(facultyCode, { code: facultyCode, count: 0, courses: [] });
      }
      const faculty = facultyMap.get(facultyCode)!;
      faculty.count++;
      faculty.courses.push(course);
    });

    // Only include valid faculty codes in the dropdown
    const validFacultyCodes = [
      '11','12','13','14','15','16','17','19','20','21','22','24','25','26','27','34','36','37'
    ];

    // Filter and convert to array
    const facultiesArray = Array.from(facultyMap.values())
      .filter(faculty => validFacultyCodes.includes(faculty.code))
      .sort((a, b) => a.code.localeCompare(b.code));

    // Debug: log all faculty codes found
    if (courseNames.length > 0) {
      console.log('All faculty codes found:', Array.from(facultyMap.keys()));
      console.log('Valid faculties:', facultiesArray.map(f => `${f.code}: ${f.count} courses`));
    }

    return facultiesArray;
  }, [courseNames]);

  // Get faculty name based on code
  const getFacultyName = (code: string): string => {
    const facultyNames: Record<string, string> = {
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
    return facultyNames[code] || `دانشکده ${code}`;
  };

  // Fuzzy search function
  const fuzzySearch = (searchTerm: string, text: string): boolean => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase().replace(/\s+/g, '');
    const target = text.toLowerCase().replace(/\s+/g, '');
    
    // Exact match
    if (target.includes(search)) return true;
    
    // Character-by-character fuzzy matching
    let searchIndex = 0;
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
      if (target[i] === search[searchIndex]) {
        searchIndex++;
      }
    }
    
    return searchIndex === search.length;
  };

  // Filter courses based on search term and faculty
  const filteredCourses = useMemo(() => {
    // Only allow filtering for known faculty codes
    const validFacultyCodes = [
      '11','12','13','14','15','16','17','19','20','21','22','24','25','26','27','34','36','37'
    ];
    let courses = courseNames;
    
    // Filter by faculty only if selectedFaculty is a valid code
    if (selectedFaculty !== 'all' && validFacultyCodes.includes(selectedFaculty)) {
      courses = courses.filter(course => extractFacultyCode(course) === selectedFaculty);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      courses = courses.filter(name => fuzzySearch(searchTerm, name));
    }
    
    return courses;
  }, [courseNames, searchTerm, selectedFaculty]);

  const toggle = (name: string) => {
    setSelected(selected.includes(name)
      ? selected.filter(n => n !== name)
      : [...selected, name]);
  };

  const selectAll = () => {
    setSelected([...filteredCourses]);
  };

  const selectNone = () => {
    const filteredSelected = selected.filter(name => !filteredCourses.includes(name));
    setSelected(filteredSelected);
  };

  return (
    <div>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '16px',
        color: 'var(--text-primary)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        انتخاب درس‌ها
      </h3>

      {/* Faculty Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '8px',
          display: 'block'
        }}>
          انتخاب دانشکده:
        </label>
        <select
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          className="form-control"
          style={{
            width: '100%',
            fontSize: '13px',
            direction: 'rtl'
          }}
        >
          <option value="all">همه دانشکده‌ها ({courseNames.length} درس)</option>
          {faculties.map(faculty => (
            <option key={faculty.code} value={faculty.code}>
              {getFacultyName(faculty.code)} ({faculty.count} درس)
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg 
            className="icon-sm" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--text-secondary)',
              zIndex: 1
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={selectedFaculty === 'all' ? 'جستجوی درس...' : `جستجو در ${getFacultyName(selectedFaculty)}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{
              width: '100%',
              paddingRight: '40px',
              fontSize: '13px',
              direction: 'rtl'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                left: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="پاک کردن جستجو"
            >
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        
        {(searchTerm || selectedFaculty !== 'all') && (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            {filteredCourses.length} درس 
            {selectedFaculty !== 'all' && ` از ${getFacultyName(selectedFaculty)}`}
            {searchTerm && ` با عبارت "${searchTerm}"`} 
            یافت شد
          </div>
        )}
      </div>
      
      {filteredCourses.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          gap: '8px'
        }}>
          <button
            onClick={selectAll}
            className="btn btn-secondary"
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: '600',
              padding: '6px 10px'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,11 12,14 22,4" />
              <path d="M21,12v7a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16" />
            </svg>
            انتخاب {searchTerm ? 'نتایج' : 'همه'}
          </button>
          <button
            onClick={selectNone}
            className="btn btn-outline"
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: '600',
              padding: '6px 10px'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            لغو {searchTerm ? 'نتایج' : 'همه'}
          </button>
        </div>
      )}
      
      <div className="card" style={{
        padding: '12px',
        maxHeight: '40vh',
        overflowY: 'auto'
      }}>
        {filteredCourses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'var(--text-secondary)'
          }}>
            <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <div>
              {selectedFaculty !== 'all' && searchTerm 
                ? `هیچ درسی در ${getFacultyName(selectedFaculty)} با عبارت "${searchTerm}" یافت نشد`
                : selectedFaculty !== 'all'
                ? `هیچ درسی در ${getFacultyName(selectedFaculty)} یافت نشد`
                : `هیچ درسی با عبارت "${searchTerm}" یافت نشد`
              }
            </div>
          </div>
        ) : (
          <ul style={{
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {filteredCourses.map((name, index) => (
              <li 
                key={name} 
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`
                }}
              >
                <label className="card" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '10px 12px',
                  margin: 0,
                  background: selected.includes(name) 
                    ? 'rgba(30, 60, 114, 0.1)' 
                    : 'var(--card-bg)',
                  border: '1px solid ' + (selected.includes(name) 
                    ? 'var(--primary-color)' 
                    : 'var(--border-light)'),
                  transition: 'all 0.2s ease',
                  borderRadius: 'var(--border-radius-sm)'
                }}
                onMouseOver={(e) => {
                  if (!selected.includes(name)) {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!selected.includes(name)) {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '2px solid ' + (selected.includes(name) ? 'var(--primary-color)' : 'var(--border-medium)'),
                    marginLeft: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selected.includes(name) 
                      ? 'var(--primary-color)' 
                      : 'transparent',
                    transition: 'all 0.2s ease'
                  }}>
                    {selected.includes(name) && (
                      <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.includes(name)}
                    onChange={() => toggle(name)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-primary)',
                    fontWeight: selected.includes(name) ? '600' : '400',
                    flex: 1,
                    lineHeight: '1.4'
                  }}>
                    {name}
                  </span>
                  {selected.includes(name) && (
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                      color: 'var(--primary-color)'
                    }}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CourseSelector;
