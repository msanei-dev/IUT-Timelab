import React, { useState, useEffect } from 'react';
import { CourseGroup, GroupingConfig } from './grouping';

interface Props {
  allCourseNames: string[];
  value: GroupingConfig;
  onChange: (cfg: GroupingConfig) => void;
}

// UI ساده مدیریت گروه‌ها: ایجاد، حذف، افزودن/حذف درس داخل هر گروه
const GroupManager: React.FC<Props> = ({ allCourseNames, value, onChange }) => {
  const [groups, setGroups] = useState<CourseGroup[]>(value.groups);
  const [newGroupName, setNewGroupName] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => { setGroups(value.groups); }, [value]);

  const persist = (next: CourseGroup[]) => {
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

  return (
    <div className="card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>مدیریت گروه‌ها</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="نام گروه جدید" className="form-control" style={{ flex: 1, fontSize: '0.85rem' }} />
        <button onClick={createGroup} className="btn btn-secondary" disabled={!newGroupName.trim()} style={{ fontSize: '0.75rem' }}>ایجاد</button>
      </div>
      <div style={{ display:'flex', gap:'12px', alignItems:'stretch' }}>
        <div style={{ flex:1, minWidth: '180px', maxHeight:'260px', overflowY:'auto', border:'1px solid var(--border-light)', borderRadius: '8px' }}>
          {groups.length === 0 && <div style={{ padding:'12px', fontSize:'0.75rem', color:'var(--text-secondary)' }}>هیچ گروهی نیست</div>}
          {groups.map(g => (
            <div key={g.id} style={{ padding:'8px 10px', borderBottom: '1px solid var(--border-light)', background: selectedGroupId===g.id ? 'var(--bg-accent)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }} onClick={() => setSelectedGroupId(g.id)}>
              <div style={{ fontSize:'0.8rem', fontWeight:600 }}>{g.name} <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>({g.courseNames.length})</span></div>
              <button onClick={e => { e.stopPropagation(); removeGroup(g.id); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626' }} title="حذف">×</button>
            </div>
          ))}
        </div>
        <div style={{ flex:2, display:'flex', flexDirection:'column', gap:'8px' }}>
          {selectedGroup ? (
            <>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <strong style={{ fontSize:'0.85rem' }}>{selectedGroup.name}</strong>
                <span style={{ fontSize:'0.65rem', color:'var(--text-secondary)' }}>انتخاب/حذف دروس</span>
              </div>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="جستجو درس..." className="form-control" style={{ fontSize:'0.7rem' }} />
              <div style={{ display:'grid', gap:'4px', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', maxHeight:'220px', overflowY:'auto', padding:'4px' }}>
                {filteredCourses.map(cn => {
                  const active = selectedGroup.courseNames.includes(cn);
                  return (
                    <button key={cn} onClick={() => toggleCourseInGroup(selectedGroup.id, cn)} style={{
                      fontSize:'0.6rem',
                      padding:'6px 4px',
                      lineHeight:1.2,
                      borderRadius:'6px',
                      border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-light)',
                      background: active ? 'rgba(30,64,175,0.15)' : 'white',
                      cursor:'pointer',
                      textAlign:'center'
                    }} title={cn}>{cn.length>22?cn.slice(0,21)+'…':cn}</button>
                  );
                })}
                {filteredCourses.length===0 && <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', padding:'8px' }}>موردی نیست</div>}
              </div>
            </>
          ) : (
            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', padding:'8px' }}>یک گروه را از سمت چپ انتخاب کنید یا بسازید.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManager;
