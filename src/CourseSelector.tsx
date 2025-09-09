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
  return (
    <ul style={{listStyle:'none', padding:0, margin:'0 0 24px 0', maxHeight:'60vh', overflowY:'auto'}}>
      {courseNames.map(name => (
        <li key={name} style={{marginBottom:'8px'}}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(name)}
              onChange={() => toggle(name)}
            />
            {name}
          </label>
        </li>
      ))}
    </ul>
  );
};
export default CourseSelector;
