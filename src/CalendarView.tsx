import React from 'react';
import type { Schedule, Day, ScheduleSection } from './shared/types';

const days: Day[] = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const hours = Array.from({length: 11}, (_, i) => 8 + i); // 8:00 to 18:00

function timeToRow(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h - 8) + (m >= 30 ? 0.5 : 0);
}

const colorList = ['#90caf9','#a5d6a7','#ffe082','#ffab91','#ce93d8','#b0bec5','#f48fb1'];

const CalendarView: React.FC<{schedule: Schedule}> = ({ schedule }) => {
  // Map each section to a color
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  for (const sec of schedule.sections) {
    if (!colorMap[sec.courseCode]) {
      colorMap[sec.courseCode] = colorList[colorIdx % colorList.length];
      colorIdx++;
    }
  }
  // Build grid
  return (
    <div style={{flex:1, background:'#f4f6fb', borderRadius:'8px', border:'1px solid #e0e0e0', padding:'16px', marginBottom:'16px', overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{width:60}}></th>
            {days.map(day => <th key={day}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {hours.map(h => (
            <tr key={h}>
              <td style={{textAlign:'right',color:'#888',fontSize:'0.9em'}}>{h}:00</td>
              {days.map(day => (
                <td key={day} style={{position:'relative',height:36,minWidth:90}}>
                  {schedule.sections.flatMap((sec, i) =>
                    sec.schedule.filter(slot => slot.day === day && parseInt(slot.start) === h)
                      .map(slot => (
                        <div key={sec.courseCode+slot.start}
                          style={{
                            position:'absolute',
                            left:2,right:2,top:2,bottom:2,
                            background: colorMap[sec.courseCode],
                            borderRadius:4,
                            color:'#222',
                            fontSize:'0.95em',
                            padding:'2px 4px',
                            border:'1px solid #bbb',
                            zIndex:2
                          }}
                          title={sec.courseName+ ' - ' + sec.professor.name}
                        >
                          {sec.courseName} <br/>
                          {slot.start} - {slot.end} <br/>
                          {sec.professor.name}
                        </div>
                      ))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default CalendarView;
