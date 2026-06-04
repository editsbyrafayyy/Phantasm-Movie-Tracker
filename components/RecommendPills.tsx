'use client';

import type { Recommend } from '@/lib/config';

interface RecommendPillsProps {
  value:    Recommend;
  onChange: (value: Recommend) => void;
  disabled?: boolean;
}

const PILLS: { value: Exclude<Recommend, ''>; label: string; className: string }[] = [
  { value: 'Yes',     label: 'Yes',     className: 'pill-yes'     },
  { value: 'No',      label: 'No',      className: 'pill-no'      },
  { value: 'Peak',    label: 'Peak',    className: 'pill-peak'    },
  { value: 'Garbage', label: 'Garbage', className: 'pill-garbage' },
];

export default function RecommendPills({ value, onChange, disabled }: RecommendPillsProps) {
  return (
    <div className="pill-row" role="group" aria-label="Recommendation">
      {PILLS.map(pill => (
        <button
          key={pill.value}
          type="button"
          id={`recommend-${pill.value.toLowerCase()}`}
          onClick={() => onChange(value === pill.value ? '' : pill.value)}
          className={`pill ${pill.className}${value === pill.value ? ' selected' : ''}`}
          aria-pressed={value === pill.value}
          disabled={disabled}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}
