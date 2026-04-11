/**
 * Local cache using expo-file-system.
 * Stores JSON blobs keyed by name in the app's cache directory.
 * Each entry includes a timestamp so callers can decide if data is stale.
 */

import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = `${FileSystem.cacheDirectory}forja/`;

interface CacheEntry<T> {
  data: T;
  cachedAt: number; // Unix ms
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

function filePath(key: string): string {
  return `${CACHE_DIR}${key}.json`;
}

export async function cacheWrite<T>(key: string, data: T): Promise<void> {
  try {
    await ensureDir();
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath(key), JSON.stringify(entry));
  } catch (e) {
    console.warn(`cache write [${key}]:`, e);
  }
}

export async function cacheRead<T>(
  key: string,
  maxAgeMs?: number,
): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(filePath(key));
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(filePath(key));
    const entry: CacheEntry<T> = JSON.parse(raw);

    if (maxAgeMs != null && Date.now() - entry.cachedAt > maxAgeMs) {
      return null;
    }

    return entry.data;
  } catch (e) {
    console.warn(`cache read [${key}]:`, e);
    return null;
  }
}

export async function cacheClear(key: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(filePath(key));
    if (info.exists) await FileSystem.deleteAsync(filePath(key));
  } catch (e) {
    console.warn(`cache clear [${key}]:`, e);
  }
}

// Cache keys
export const CACHE_KEYS = {
  measurements: 'measurements',
  todayGoals: (date: string) => `goals_${date}`,
  todayHydration: (date: string) => `hydration_${date}`,
  todayWorkouts: (date: string) => `workouts_${date}`,
} as const;
