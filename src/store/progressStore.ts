import { create } from 'zustand';
import { ProgressEntry } from '../types';
import { getMeasurementHistory, BodyMeasurement } from '../services/measurementsService';
import { getWorkoutsForDate, WorkoutLog } from '../services/workoutService';
import { getHydrationForDate, HydrationLog } from '../services/hydrationService';

interface ProgressState {
  entries: ProgressEntry[];
  latestEntry: ProgressEntry | null;

  // Real Supabase data
  measurements: BodyMeasurement[];
  todayWorkouts: WorkoutLog[];
  todayHydration: HydrationLog | null;
  isLoading: boolean;

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

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],
  latestEntry: null,
  measurements: [],
  todayWorkouts: [],
  todayHydration: null,
  isLoading: false,

  loadProgressData: async () => {
    set({ isLoading: true });
    try {
      const [measurements, todayWorkouts, todayHydration] = await Promise.all([
        getMeasurementHistory(10),
        getWorkoutsForDate(),
        getHydrationForDate(),
      ]);
      set({ measurements, todayWorkouts, todayHydration });
    } catch (e) {
      console.warn('loadProgressData:', e);
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
