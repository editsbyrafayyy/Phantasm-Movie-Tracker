import type { ComponentType, SVGProps } from 'react';

/**
 * Phantasm's own icon set for navigation and signature actions. Drawn on Lucide's
 * 24px grid with the same stroke (1.75 via `svg.lucide` in globals.css), round caps
 * and joins, so they sit next to Lucide icons without looking borrowed.
 */
export interface HorrorIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  strokeWidth?: number | string;
}

export type IconComponent = ComponentType<HorrorIconProps>;

function make(name: string, body: React.ReactNode, filled?: React.ReactNode) {
  function Icon({ size = 24, className, strokeWidth, ...rest }: HorrorIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide horror-icon horror-icon-${name}${className ? ` ${className}` : ''}`}
        {...rest}
      >
        {filled}
        {body}
      </svg>
    );
  }
  Icon.displayName = `HorrorIcon(${name})`;
  return Icon;
}

/** Home — a steep-roofed old house with an arched door and attic window. */
export const HauntedHouse = make('house', <>
  <path d="M3 12.5 12 3l9 9.5" />
  <path d="M16 7.7V4.5h2.25v5.6" />
  <path d="M5.5 10v11h13V10" />
  <path d="M10 21v-3.5a2 2 0 0 1 4 0V21" />
  <circle cx="12" cy="10.5" r="1.5" />
</>);

/** Vault — a coffin with a cross. */
export const Coffin = make('coffin', <>
  <path d="M9 2h6l3.5 6.5L15 22H9L5.5 8.5Z" />
  <path d="M12 7v7" />
  <path d="M9.5 9.5h5" />
</>);

/** Stream — an eye with a slit pupil. */
export const WatchingEye = make('eye', <>
  <path d="M2.5 12C4.6 7.8 8 5.5 12 5.5s7.4 2.3 9.5 6.5c-2.1 4.2-5.5 6.5-9.5 6.5S4.6 16.2 2.5 12Z" />
  <path d="M12 8.6c-.8 1-1.2 2.1-1.2 3.4s.4 2.4 1.2 3.4c.8-1 1.2-2.1 1.2-3.4s-.4-2.4-1.2-3.4Z" />
</>);

/** Watch Later — a gravestone: films laid to rest until you get to them. */
export const Gravestone = make('grave', <>
  <path d="M6 20V9.5a6 6 0 0 1 12 0V20" />
  <path d="M3.5 20.5h17" />
  <path d="M12 8v6.5" />
  <path d="M9.75 10.25h4.5" />
</>);

/** Watch Later, saved — the same stone, filled, with a check carved in. */
export const GravestoneSaved = make('grave-saved', <>
  <path d="M3.5 20.5h17" />
  <path d="M9.4 12.4l1.9 1.9 3.4-3.8" stroke="var(--icon-carve, #080808)" />
</>, <path d="M6 20V9.5a6 6 0 0 1 12 0V20Z" fill="currentColor" />);

/** Roulette — a Ouija planchette. */
export const Planchette = make('planchette', <>
  <path d="M12 3.5 19 15a4 4 0 0 1-3.4 6H8.4A4 4 0 0 1 5 15Z" />
  <circle cx="12" cy="14" r="2.5" />
</>);

/** Sign in — a skeleton key. */
export const SkeletonKey = make('key', <>
  <circle cx="7" cy="7" r="3.5" />
  <circle cx="7" cy="7" r="1" />
  <path d="M9.5 9.5 20.5 20.5" />
  <path d="m15 15 2-2" />
  <path d="m17.5 17.5 2-2" />
</>);
