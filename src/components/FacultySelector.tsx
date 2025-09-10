import React from 'react';

interface Props {
  facultyPrefixes: string[];
  facultyLabel: (p: string) => string;
  onSelect: (p: string) => void;
}

export const FacultySelector: React.FC<Props> = ({ facultyPrefixes, facultyLabel, onSelect }) => {
  return (
    <div style={{ display:'grid', gap:'12px', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))' }}>
      {facultyPrefixes.map(p => (
        <button key={p} onClick={()=>onSelect(p)} className="btn btn-primary" style={{ fontSize:'0.8rem', padding:'12px 8px', fontWeight:600 }} title={facultyLabel(p)}>
          {facultyLabel(p)}
        </button>
      ))}
      {facultyPrefixes.length===0 && <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>داده‌ای برای استخراج دانشکده موجود نیست.</div>}
    </div>
  );
};
