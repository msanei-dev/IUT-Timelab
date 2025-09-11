import React from 'react';
import GroupManager from '../GroupManager';
import { GroupingConfig } from '../grouping';
import { FacultySelector } from './FacultySelector';

interface Props {
  show: boolean;
  onClose: () => void;
  selectedFaculty: string | null;
  setSelectedFaculty: (f: string | null) => void;
  facultyPrefixes: string[];
  facultyLabel: (p: string) => string;
  groupingConfig: GroupingConfig;
  setGroupingConfig: (g: GroupingConfig) => void;
  filteredCourseNamesForGrouping: string[];
}

export const GroupingOverlay: React.FC<Props> = ({ show, onClose, selectedFaculty, setSelectedFaculty, facultyPrefixes, facultyLabel, groupingConfig, setGroupingConfig, filteredCourseNamesForGrouping }) => {
  if (!show) return null;
  return (
    <div className="grouping-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(2px)', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'40px 32px', zIndex:2000 } as any}>
      <div className="grouping-overlay-container" style={{ width:'780px', maxWidth:'100%', background:'var(--card-bg)', borderRadius:'18px', boxShadow:'0 12px 32px rgba(0,0,0,0.25)', position:'relative', display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 80px)', border:'1px solid var(--border-light)' } as any}>
        <div style={{ padding:'14px 22px', borderBottom:'1px solid var(--border-light)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:700 }}>مدیریت گروه‌های انتخابی</h2>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {selectedFaculty && (
              <>
                <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{facultyLabel(selectedFaculty)}</span>
                <button onClick={()=>setSelectedFaculty(null)} className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'4px 10px' }}>تغییر دانشکده</button>
              </>
            )}
            <button onClick={onClose} className="btn btn-danger" style={{ fontSize:'0.7rem' }}>بستن</button>
          </div>
        </div>
        {!selectedFaculty ? (
          <div style={{ padding:'24px', overflow:'auto', display:'flex', flexDirection:'column', gap:'20px' }}>
            <div>
              <h3 style={{ margin:'0 0 12px 0', fontSize:'1rem' }}>انتخاب دانشکده</h3>
              <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)' }}>ابتدا دانشکده (بر اساس پیشوند کد درس) را انتخاب کنید تا فقط همان دروس برای گروه‌بندی نمایش داده شوند.</p>
            </div>
            <FacultySelector facultyPrefixes={facultyPrefixes} facultyLabel={facultyLabel} onSelect={p=>setSelectedFaculty(p)} />
          </div>
        ) : (
          <div style={{ flex:1, overflow:'auto', padding:'16px 16px 20px 16px' }}>
            <GroupManager
              allCourseNames={filteredCourseNamesForGrouping}
              value={groupingConfig}
              onChange={setGroupingConfig}
            />
          </div>
        )}
      </div>
    </div>
  );
};
