'use client';

interface BonusToggleProps {
  value:    0 | 1;
  onChange: (value: 0 | 1) => void;
  disabled?: boolean;
}

/** Whole row is the switch, so the tap target is the full width on phones. */
export default function BonusToggle({ value, onChange, disabled }: BonusToggleProps) {
  const isOn = value === 1;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => onChange(isOn ? 0 : 1)}
      className={`bonus-row${isOn ? ' on' : ''}`}
      disabled={disabled}
    >
      <span className="bonus-text">
        <span className="bonus-label">Bonus point</span>
        <span className="bonus-desc">Adds +1 to the total</span>
      </span>
      <span className="toggle-wrap" aria-hidden="true">
        <span className="toggle-val">{isOn ? '+1' : '0'}</span>
        <span className="toggle" />
      </span>
    </button>
  );
}
