'use client';

interface ScoreFieldProps {
  id:       string;
  label:    string;
  max:      number;
  value:    number | '';
  onChange: (value: number | '') => void;
}

export default function ScoreField({ id, label, max, value, onChange }: ScoreFieldProps) {
  const displayVal = value === '' ? '—' : Number(value).toString();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') { onChange(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n))   { onChange(''); return; }
    onChange(Math.min(max, Math.max(0, Math.round(n * 100) / 100)));
  }

  return (
    <div className="score-field">
      <div className="score-field-header">
        <label htmlFor={id} className="score-label">{label}</label>
        <span className="score-val">{displayVal}</span>
      </div>
      <input
        id={id}
        type="number"
        step={0.01}
        min={0}
        max={max}
        value={value}
        onChange={handleChange}
        placeholder="—"
        className="score-input"
      />
    </div>
  );
}
