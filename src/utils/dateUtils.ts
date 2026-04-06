/**
 * Centralized date utilities for Método R3SET.
 * Display format: DD/MM/YYYY
 */

/** Returns today as ISO string YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Converts a Date to ISO string YYYY-MM-DD */
export function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
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
