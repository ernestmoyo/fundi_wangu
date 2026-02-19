/**
 * Date/time utilities for Tanzania.
 * All timestamps are stored in UTC and converted to EAT (UTC+3) at presentation layer.
 * Display format: DD/MM/YYYY for dates, h:mm AM/PM for times.
 */

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Convert UTC date to East Africa Time (UTC+3) */
export function utcToEAT(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + EAT_OFFSET_MS);
}

/** Format date for Tanzanian display: "19/02/2026" */
export function formatDateTZ(date: Date | string): string {
  const eat = utcToEAT(date);
  const day = String(eat.getUTCDate()).padStart(2, '0');
  const month = String(eat.getUTCMonth() + 1).padStart(2, '0');
  const year = eat.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Format time for display: "2:30 PM" */
export function formatTimeTZ(date: Date | string): string {
  const eat = utcToEAT(date);
  let hours = eat.getUTCHours();
  const minutes = String(eat.getUTCMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

/** Format date and time: "19/02/2026, 2:30 PM" */
export function formatDateTimeTZ(date: Date | string): string {
  return `${formatDateTZ(date)}, ${formatTimeTZ(date)}`;
}

/** Get relative time description in Swahili or English */
export function relativeTime(date: Date | string, language: 'sw' | 'en'): string {
  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (language === 'sw') {
    if (diffSec < 60) return 'sasa hivi';
    if (diffMin < 60) return `dakika ${diffMin} zilizopita`;
    if (diffHour < 24) return `saa ${diffHour} zilizopita`;
    if (diffDay < 7) return `siku ${diffDay} zilizopita`;
    return formatDateTZ(date);
  }

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return formatDateTZ(date);
}
