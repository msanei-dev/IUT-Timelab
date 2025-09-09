import React from 'react';

interface Props {
  courseNames: string[];
  selected: string[];
  setSelected: (sel: string[]) => void;
}

const CourseSelector: React.FC<Props> = ({ courseNames, selected, setSelected }) => {
  const toggle = (name: string) => {
    setSelected(selected.includes(name)
      ? selected.filter(n => n !== name)
      : [...selected, name]);
  };

  const selectAll = () => {
    setSelected([...courseNames]);
  };

  const selectNone = () => {
    setSelected([]);
  };

  return (
    <div>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '20px',
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
      
      {courseNames.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          gap: '12px'
        }}>
          <button
            onClick={selectAll}
            className="btn-modern btn-secondary"
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: '600',
              padding: '10px 16px'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,11 12,14 22,4" />
              <path d="M21,12v7a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16" />
            </svg>
            انتخاب همه
          </button>
          <button
            onClick={selectNone}
            className="btn-modern btn-glass"
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: '600',
              padding: '10px 16px'
            }}
          >
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            عدم انتخاب همه
          </button>
        </div>
      )}
      
      <div className="glass-card" style={{
        padding: '16px',
        maxHeight: '45vh',
        overflowY: 'auto'
      }}>
        <ul style={{
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {courseNames.map((name, index) => (
            <li 
              key={name} 
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <label className="glass-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '12px 16px',
                margin: 0,
                background: selected.includes(name) 
                  ? 'rgba(30, 60, 114, 0.2)' 
                  : 'rgba(255, 250, 250, 0.08)',
                border: '1px solid ' + (selected.includes(name) 
                  ? 'rgba(30, 60, 114, 0.4)' 
                  : 'rgba(255, 250, 250, 0.15)'),
                transition: 'var(--transition)',
                borderRadius: 'var(--border-radius)'
              }}
              onMouseOver={(e) => {
                if (!selected.includes(name)) {
                  e.currentTarget.style.background = 'rgba(255, 250, 250, 0.12)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseOut={(e) => {
                if (!selected.includes(name)) {
                  e.currentTarget.style.background = 'rgba(255, 250, 250, 0.08)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: '2px solid var(--glass-border)',
                  marginLeft: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selected.includes(name) 
                    ? 'var(--secondary-gradient)' 
                    : 'transparent',
                  transition: 'var(--transition)',
                  boxShadow: selected.includes(name) 
                    ? '0 2px 8px rgba(30, 60, 114, 0.3)' 
                    : 'none'
                }}>
                  {selected.includes(name) && (
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3">
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
                  fontSize: '14px', 
                  color: 'var(--text-primary)',
                  fontWeight: selected.includes(name) ? '600' : '400',
                  flex: 1
                }}>
                  {name}
                </span>
                {selected.includes(name) && (
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                    color: 'rgba(30, 60, 114, 0.8)'
                  }}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                )}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseSelector;
