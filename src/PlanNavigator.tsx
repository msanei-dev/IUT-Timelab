import React from 'react';

interface Props {
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  total: number;
}

const PlanNavigator: React.FC<Props> = ({ currentIdx, setCurrentIdx, total }) => (
  <div style={{display:'flex', justifyContent:'center', gap:'16px'}}>
    <button onClick={() => setCurrentIdx(currentIdx-1)} disabled={currentIdx === 0} style={{margin:'8px 0', padding:'8px 16px', fontSize:'1rem', border:'none', background:'#1976d2', color:'#fff', borderRadius:'4px', cursor:'pointer'}}>&lt; Previous Plan</button>
    <span>Plan {currentIdx+1} of {total}</span>
    <button onClick={() => setCurrentIdx(currentIdx+1)} disabled={currentIdx === total-1} style={{margin:'8px 0', padding:'8px 16px', fontSize:'1rem', border:'none', background:'#1976d2', color:'#fff', borderRadius:'4px', cursor:'pointer'}}>Next Plan &gt;</button>
  </div>
);
export default PlanNavigator;
