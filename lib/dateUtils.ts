/**
 * Utility functions for date formatting across the app.
 */

/**
 * Returns a human-readable relative date string (e.g. "Today", "Yesterday", "3 days ago").
 */
export function formatRelativeDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  let date: Date;
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const [y, m, d] = dateInput.slice(0, 10).split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  // Normalize to start of day for accurate day difference calculations
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Future date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Returns a full formatted date string for tooltips/titles (e.g. "August 2, 2026").
 */
export function formatFullDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
