/**
 * Centralized date utilities for Método R3SET.
 * Display format: DD/MM/YYYY
 *
 * Calendar dates use the device local timezone (not UTC midnight from toISOString).
 */

/** YYYY-MM-DD for the given date in local time */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today as YYYY-MM-DD (local calendar) */
export function todayISO(): string {
  return toLocalISODate(new Date());
}

/** Converts a Date to YYYY-MM-DD in local time */
export function toISO(date: Date): string {
  return toLocalISODate(date);
}

/** Formats an ISO date string (YYYY-MM-DD) to DD/MM/YYYY */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Formats a Date object to DD/MM/YYYY */
export function formatDateObj(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Returns ISO string for N days ago from today */
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}
