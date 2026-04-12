import { create } from 'zustand';
import { ProgressEntry } from '../types';
import { getMeasurementHistory, BodyMeasurement } from '../services/measurementsService';
import { getWorkoutsForDate, WorkoutLog } from '../services/workoutService';
import { getHydrationForDate, HydrationLog } from '../services/hydrationService';
import { getGoalsForDate, DailyGoal } from '../services/goalsService';
import { syncAllGoalsForDate } from '../services/goalProgressService';
import { cacheRead, cacheWrite, CACHE_KEYS } from '../lib/cache';
import { todayISO } from '../utils/dateUtils';

interface ProgressState {
  entries: ProgressEntry[];
  latestEntry: ProgressEntry | null;

  // Real Supabase data
  measurements: BodyMeasurement[];
  todayWorkouts: WorkoutLog[];
  todayHydration: HydrationLog | null;
  todayGoals: DailyGoal[];

  isLoading: boolean;
  isStale: boolean; // true when showing cached data because network failed

  addEntry: (entry: ProgressEntry) => Promise<void>;
  getWeightHistory: () => { date: Date; weight: number }[];
  getBodyFatHistory: () => { date: Date; bodyFat: number }[];
  getLatestEntry: () => ProgressEntry | null;
  getProgressSummary: () => {
    weightChange: number;
    bodyFatChange: number;
    leanMassChange: number;
  };
  loadProgressData: () => Promise<void>;
}

// 24 h max age for measurements cache; today's data is keyed by date so it
// auto-refreshes the next day regardless.
const MEASUREMENTS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],
  latestEntry: null,
  measurements: [],
  todayWorkouts: [],
  todayHydration: null,
  todayGoals: [],
  isLoading: false,
  isStale: false,

  loadProgressData: async () => {
    set({ isLoading: true });

    const dateKey = todayISO();

    // ── 1. Hydrate from cache immediately so UI isn't blank ──────────
    const [cachedMeasurements, cachedGoals, cachedHydration, cachedWorkouts] =
      await Promise.all([
        cacheRead<BodyMeasurement[]>(CACHE_KEYS.measurements, MEASUREMENTS_MAX_AGE_MS),
        cacheRead<DailyGoal[]>(CACHE_KEYS.todayGoals(dateKey)),
        cacheRead<HydrationLog | null>(CACHE_KEYS.todayHydration(dateKey)),
        cacheRead<WorkoutLog[]>(CACHE_KEYS.todayWorkouts(dateKey)),
      ]);

    const hasCached =
      cachedMeasurements != null ||
      cachedGoals != null ||
      cachedHydration != null ||
      cachedWorkouts != null;

    if (hasCached) {
      set({
        measurements: cachedMeasurements ?? [],
        todayGoals: cachedGoals ?? [],
        todayHydration: cachedHydration ?? null,
        todayWorkouts: cachedWorkouts ?? [],
        isStale: true,
      });
    }

    // ── 2. Reconcile goals from source tables, then fetch fresh data ──
    try {
      await syncAllGoalsForDate(dateKey);
      const today = new Date();
      const [measurements, todayWorkouts, todayHydration, todayGoals] = await Promise.all([
        getMeasurementHistory(10),
        getWorkoutsForDate(),
        getHydrationForDate(dateKey),
        getGoalsForDate(today),
      ]);

      set({ measurements, todayWorkouts, todayHydration, todayGoals, isStale: false });

      // ── 3. Persist fresh data to cache ──────────────────────────────
      await Promise.all([
        cacheWrite(CACHE_KEYS.measurements, measurements),
        cacheWrite(CACHE_KEYS.todayGoals(dateKey), todayGoals),
        cacheWrite(CACHE_KEYS.todayHydration(dateKey), todayHydration),
        cacheWrite(CACHE_KEYS.todayWorkouts(dateKey), todayWorkouts),
      ]);
    } catch (e) {
      // Network or Supabase error — keep cached state, flag as stale
      if (!hasCached) {
        // Nothing in cache either — surface an empty but non-crashing state
        set({ measurements: [], todayGoals: [], todayHydration: null, todayWorkouts: [] });
      }
      console.warn('loadProgressData (network error, using cache):', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addEntry: async (entry: ProgressEntry) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      set((state) => ({
        entries: [entry, ...state.entries],
        latestEntry: entry,
      }));
    } catch (error) {
      console.error('Error adding progress entry:', error);
      throw error;
    }
  },

  getWeightHistory: () => {
    return get()
      .entries.map((entry) => ({
        date: entry.date,
        weight: entry.weight,
      }))
      .reverse();
  },

  getBodyFatHistory: () => {
    return get()
      .entries.map((entry) => ({
        date: entry.date,
        bodyFat: entry.bodyFat,
      }))
      .reverse();
  },

  getLatestEntry: () => {
    return get().latestEntry;
  },

  getProgressSummary: () => {
    const entries = get().entries;
    if (entries.length < 2) {
      return { weightChange: 0, bodyFatChange: 0, leanMassChange: 0 };
    }
    const latest = entries[0];
    const oldest = entries[entries.length - 1];
    return {
      weightChange: oldest.weight - latest.weight,
      bodyFatChange: oldest.bodyFat - latest.bodyFat,
      leanMassChange: latest.leanMass - oldest.leanMass,
    };
  },
}));
