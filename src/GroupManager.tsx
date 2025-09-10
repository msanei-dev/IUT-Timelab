import React, { useState, useEffect } from 'react';
import { CourseGroup as LegacyCourseGroup, GroupingConfig } from './grouping';
import { CourseGroup } from './shared/types';

interface Props {
  allCourseNames: string[];
  value: GroupingConfig;
  onChange: (cfg: GroupingConfig) => void;
}

// UI ساده مدیریت گروه‌ها: ایجاد، حذف، افزودن/حذف درس داخل هر گروه
const GroupManager: React.FC<Props> = ({ allCourseNames, value, onChange }) => {
  // local groups kept in legacy shape; we enhance with enabled flag when persisting via shared/types CourseGroup
  const [groups, setGroups] = useState<LegacyCourseGroup[]>(value.groups);
  const [newGroupName, setNewGroupName] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // حالت پیش‌فرض نمایش: لیست
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('list');

  useEffect(() => { setGroups(value.groups); }, [value]);

  const persist = (next: LegacyCourseGroup[]) => {
    setGroups(next);
    onChange({ groups: next });
    localStorage.setItem('courseGroups', JSON.stringify(next));
  };

  useEffect(() => {
    const stored = localStorage.getItem('courseGroups');
    if (stored) {
      try { onChange({ groups: JSON.parse(stored) }); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = name.replace(/\s+/g,'_').toLowerCase() + '_' + Date.now().toString(36);
    persist([...groups, { id, name, courseNames: [] }]);
    setNewGroupName('');
    setSelectedGroupId(id);
  };

  const removeGroup = (id: string) => {
    persist(groups.filter(g => g.id !== id));
    if (selectedGroupId === id) setSelectedGroupId(null);
  };

  const toggleCourseInGroup = (groupId: string, courseName: string) => {
    persist(groups.map(g => {
      if (g.id !== groupId) return g;
      const exists = g.courseNames.includes(courseName);
      return { ...g, courseNames: exists ? g.courseNames.filter(c => c !== courseName) : [...g.courseNames, courseName] };
    }));
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const filteredCourses = allCourseNames.filter(n => n.toLowerCase().includes(filter.toLowerCase()));

  // برجسته کردن بخش جستجو شده داخل نام درس
  const highlightMatch = (name: string) => {
    if (!filter.trim()) return <span style={{ fontWeight:600 }}>{name}</span>;
    const idx = name.toLowerCase().indexOf(filter.toLowerCase());
    if (idx === -1) return <span style={{ fontWeight:600 }}>{name}</span>;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + filter.length);
    const after = name.slice(idx + filter.length);
    return (
      <span style={{ fontWeight:600 }}>
        {before}
        <span style={{ background:'var(--primary-color)', color:'#fff', padding:'0 2px', borderRadius:3 }}>{match}</span>
        {after}
      </span>
    );
  };

  const containerStyle: React.CSSProperties & { [key:string]: any } = {
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: 'calc(100vh - 220px)',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };
  // جلوگیری از drag برای اجازه تایپ داخل input ها
  (containerStyle as any).WebkitAppRegion = 'no-drag';

  return (
    <div className="card" style={containerStyle}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>مدیریت گروه‌ها</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="نام گروه جدید" className="form-control" style={{ flex: 1, fontSize: '0.85rem' }} />
        <button onClick={createGroup} className="btn btn-secondary" disabled={!newGroupName.trim()} style={{ fontSize: '0.75rem' }}>ایجاد</button>
      </div>
      <div style={{ display:'flex', gap:'12px', alignItems:'stretch', minHeight: '320px', flex:1, overflow:'hidden' }}>
        <div style={{ flex:1, minWidth: '180px', maxHeight:'340px', overflowY:'auto', border:'1px solid var(--border-light)', borderRadius: '10px', background:'var(--bg-soft)' }}>
          {groups.length === 0 && <div style={{ padding:'12px', fontSize:'0.75rem', color:'var(--text-secondary)' }}>هیچ گروهی نیست</div>}
          {groups.map(g => {
            const isSel = selectedGroupId===g.id;
            return (
              <div
                key={g.id}
                style={{
                  padding:'10px 12px',
                  borderBottom: '1px solid var(--border-light)',
                  background: isSel ? 'linear-gradient(90deg,var(--bg-accent),rgba(0,0,0,0))' : 'transparent',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  gap:8,
                  transition:'background 120ms'
                }}
                onClick={() => setSelectedGroupId(g.id)}
              >
                <div style={{ fontSize:'0.82rem', fontWeight:600, display:'flex', flexDirection:'column', flex:1 }}>
                  <span style={{ lineHeight:1.2 }}>{g.name}</span>
                  <span style={{ color:'var(--text-secondary)', fontWeight:400, fontSize:'0.65rem' }}>{g.courseNames.length} درس</span>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); persist(groups.map(gr => gr.id===g.id ? { ...gr, // @ts-ignore legacy shape accept
                      isActive: (gr as any).isActive === false ? true : !(gr as any).isActive } : gr)); }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.65rem', color:(g as any).isActive===false ? '#dc2626' : 'var(--primary-color)' }}
                    title={(g as any).isActive===false ? 'فعال سازی گروه' : 'غیرفعال کردن گروه'}
                  >{(g as any).isActive===false ? 'Off' : 'On'}</button>
                  <button
                    onClick={e => { e.stopPropagation(); removeGroup(g.id); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:'0.9rem', lineHeight:1 }}
                    title="حذف"
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex:2.4, display:'flex', flexDirection:'column', gap:'10px', minHeight:'100%', overflow:'hidden' }}>
          {selectedGroup ? (
            <>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:'8px', alignItems:'baseline' }}>
                  <strong style={{ fontSize:'0.95rem' }}>{selectedGroup.name}</strong>
                  <span style={{ fontSize:'0.65rem', color:'var(--text-secondary)' }}>انتخاب / حذف درس‌ها</span>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={() => setLayoutMode('grid')}
                    style={{
                      fontSize:'0.6rem',
                      padding:'4px 8px',
                      borderRadius:6,
                      border: layoutMode==='grid' ? '1px solid var(--primary-color)' : '1px solid var(--border-light)',
                      background: layoutMode==='grid' ? 'var(--bg-accent)' : 'white',
                      cursor:'pointer'
                    }}
                  >شبکه</button>
                  <button
                    onClick={() => setLayoutMode('list')}
                    style={{
                      fontSize:'0.6rem',
                      padding:'4px 8px',
                      borderRadius:6,
                      border: layoutMode==='list' ? '1px solid var(--primary-color)' : '1px solid var(--border-light)',
                      background: layoutMode==='list' ? 'var(--bg-accent)' : 'white',
                      cursor:'pointer'
                    }}
                  >لیست</button>
                </div>
              </div>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="جستجو سریع درس..." className="form-control" style={{ fontSize:'0.75rem' }} />
              <div style={{ fontSize:'0.58rem', color:'var(--text-secondary)', display:'flex', justifyContent:'space-between', padding:'0 4px' }}>
                <span>روی یک درس کلیک کنید تا به گروه اضافه/حذف شود.</span>
                <span style={{ direction:'ltr' }}>اسکرول ↑↓</span>
              </div>
              <div
                style={{
                  display: layoutMode==='grid' ? 'grid' : 'block',
                  gridTemplateColumns: layoutMode==='grid' ? 'repeat(auto-fill,minmax(170px,1fr))' : undefined,
                  gap: layoutMode==='grid' ? '10px' : undefined,
                  flex:1,
                  overflowY:'auto',
                  padding:'6px',
                  minHeight:'220px',
                  border:'1px solid var(--border-light)',
                  borderRadius:'8px',
                  background:'#fff'
                }}
              >
                {filteredCourses.map((cn, idx) => {
                  const active = selectedGroup.courseNames.includes(cn);
                  const baseStyle: React.CSSProperties = {
                    fontSize:'0.7rem',
                    lineHeight:1.25,
                    borderRadius:'10px',
                    border: active ? '1px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.1)',
                    background: active ? 'linear-gradient(135deg, rgba(30,64,175,0.22), rgba(30,64,175,0.12))' : 'linear-gradient(135deg,#eef2f7,#e2e8f0)',
                    cursor:'pointer',
                    textAlign:'start',
                    width:'100%',
                    padding: layoutMode==='grid' ? '12px 12px 14px 14px' : '12px 14px',
                    position:'relative',
                    boxShadow: active ? '0 3px 6px -1px rgba(30,64,175,0.35), 0 0 0 1px rgba(30,64,175,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
                    transition:'background 140ms, box-shadow 140ms, border-color 140ms, transform 140ms',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'flex-start',
                    gap:6,
                    marginBottom: layoutMode==='list' ? '10px' : 0,
                    whiteSpace:'normal',
                    wordBreak:'break-word',
                    overflow:'hidden'
                  };
                  return (
                    <button
                      key={cn}
                      onClick={() => toggleCourseInGroup(selectedGroup.id, cn)}
                      style={baseStyle as any}
                      title={cn}
                      role="checkbox"
                      aria-checked={active}
                      onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}
                    >
                      <span style={{ position:'absolute', top:0, left:0, width: active ? 4 : 4, height:'100%', background: active ? 'var(--primary-color)' : 'rgba(0,0,0,0.08)' }} />
                      <div style={{ display:'flex', width:'100%', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                          {highlightMatch(cn)}
                          <span style={{ fontSize:'0.5rem', letterSpacing:0.3, color: active ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                            {active ? 'در این گروه' : `کلیک برای افزودن (${idx+1})`}
                          </span>
                        </div>
                        {active && (
                          <span style={{
                            background:'var(--primary-color)',
                            color:'#fff',
                            fontSize:'0.55rem',
                            padding:'2px 6px',
                            borderRadius:20,
                            display:'inline-flex',
                            alignItems:'center',
                            gap:4,
                            boxShadow:'0 0 0 1px rgba(255,255,255,0.4)'
                          }}>✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {filteredCourses.length===0 && <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', padding:'8px' }}>موردی یافت نشد</div>}
              </div>
            </>
          ) : (
            <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', padding:'8px' }}>یک گروه را از ستون سمت چپ انتخاب کنید یا بسازید.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManager;
