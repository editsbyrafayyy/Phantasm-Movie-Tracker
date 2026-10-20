'use client';

import type { Recommend } from '@/lib/config';

interface RecommendPillsProps {
  value:    Recommend;
  onChange: (value: Recommend) => void;
  disabled?: boolean;
  labelledBy?: string;
}

const PILLS: { value: Exclude<Recommend, ''>; className: string }[] = [
  { value: 'Peak',    className: 'pill-peak'    },
  { value: 'Yes',     className: 'pill-yes'     },
  { value: 'No',      className: 'pill-no'      },
  { value: 'Garbage', className: 'pill-garbage' },
];

export default function RecommendPills({ value, onChange, disabled, labelledBy }: RecommendPillsProps) {
  return (
    <div
      className="pill-row"
      role="group"
      aria-label={labelledBy ? undefined : 'Recommendation'}
      aria-labelledby={labelledBy}
    >
      {PILLS.map(pill => {
        const selected = value === pill.value;
        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => onChange(selected ? '' : pill.value)}
            className={`pill ${pill.className}${selected ? ' selected' : ''}`}
            aria-pressed={selected}
            disabled={disabled}
          >
            {pill.value}
          </button>
        );
      })}
    </div>
  );
}
