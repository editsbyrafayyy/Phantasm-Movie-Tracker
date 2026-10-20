'use client';

interface ScoreFieldProps {
  id:       string;
  label:    string;
  max:      number;
  value:    number | '';
  onChange: (value: number | '') => void;
  disabled?: boolean;
}

export default function ScoreField({ id, label, max, value, onChange, disabled }: ScoreFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') { onChange(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n))   { onChange(''); return; }
    onChange(Math.min(max, Math.max(0, Math.round(n * 100) / 100)));
  }

  return (
    <div className="score-entry">
      <label htmlFor={id} className="form-label score-entry-label">
        <span>{label}</span>
        <span className="score-entry-max">/ {max}</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.01}
        min={0}
        max={max}
        value={value}
        onChange={handleChange}
        placeholder="—"
        className="field-input score-entry-input"
        disabled={disabled}
      />
    </div>
  );
}
