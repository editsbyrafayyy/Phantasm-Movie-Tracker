'use client';

interface BonusToggleProps {
  value:    0 | 1;
  onChange: (value: 0 | 1) => void;
}

export default function BonusToggle({ value, onChange }: BonusToggleProps) {
  const isOn = value === 1;

  return (
    <div className="bonus-row">
      <div>
        <div className="bonus-label">Bonus Point</div>
        <div className="bonus-desc">Adds +1 to total</div>
      </div>
      <div className="toggle-wrap">
        <span key={value} className="toggle-val">{isOn ? '+1' : '0'}</span>
        <button
          id="bonus-toggle"
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={() => onChange(isOn ? 0 : 1)}
          className={`toggle${isOn ? ' on' : ''}`}
          aria-label="Bonus point toggle"
        />
      </div>
    </div>
  );
}
