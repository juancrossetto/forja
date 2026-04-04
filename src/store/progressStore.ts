import { create } from 'zustand';
import { ProgressEntry } from '../types';

interface ProgressState {
  entries: ProgressEntry[];
  latestEntry: ProgressEntry | null;
  addEntry: (entry: ProgressEntry) => Promise<void>;
  getWeightHistory: () => { date: Date; weight: number }[];
  getBodyFatHistory: () => { date: Date; bodyFat: number }[];
  getLatestEntry: () => ProgressEntry | null;
  getProgressSummary: () => {
    weightChange: number;
    bodyFatChange: number;
    leanMassChange: number;
  };
}

// Mock progress data with realistic fitness values
const MOCK_ENTRIES: ProgressEntry[] = [
  {
    date: new Date('2024-03-25'),
    weight: 82.5,
    bodyFat: 18.2,
    photos: { front: null, side: null, back: null },
    steps: 8500,
    sleep: 7.5,
    bloodPressure: { systolic: 125, diastolic: 82 },
    leanMass: 67.4,
  },
  {
    date: new Date('2024-03-18'),
    weight: 83.2,
    bodyFat: 18.8,
    photos: { front: null, side: null, back: null },
    steps: 9200,
    sleep: 7.2,
    bloodPressure: { systolic: 128, diastolic: 84 },
    leanMass: 67.1,
  },
  {
    date: new Date('2024-03-11'),
    weight: 83.8,
    bodyFat: 19.4,
    photos: { front: null, side: null, back: null },
    steps: 7800,
    sleep: 6.8,
    bloodPressure: { systolic: 130, diastolic: 85 },
    leanMass: 67.4,
  },
  {
    date: new Date('2024-03-04'),
    weight: 84.5,
    bodyFat: 20.1,
    photos: { front: null, side: null, back: null },
    steps: 8200,
    sleep: 7.0,
    bloodPressure: { systolic: 132, diastolic: 86 },
    leanMass: 67.4,
  },
  {
    date: new Date('2024-02-25'),
    weight: 85.2,
    bodyFat: 20.8,
    photos: { front: null, side: null, back: null },
    steps: 7500,
    sleep: 7.1,
    bloodPressure: { systolic: 135, diastolic: 87 },
    leanMass: 67.3,
  },
  {
    date: new Date('2024-02-18'),
    weight: 85.9,
    bodyFat: 21.3,
    photos: { front: null, side: null, back: null },
    steps: 9000,
    sleep: 7.4,
    bloodPressure: { systolic: 138, diastolic: 88 },
    leanMass: 67.5,
  },
  {
    date: new Date('2024-02-11'),
    weight: 86.5,
    bodyFat: 21.9,
    photos: { front: null, side: null, back: null },
    steps: 8100,
    sleep: 7.0,
    bloodPressure: { systolic: 140, diastolic: 89 },
    leanMass: 67.2,
  },
  {
    date: new Date('2024-02-04'),
    weight: 87.2,
    bodyFat: 22.5,
    photos: { front: null, side: null, back: null },
    steps: 8700,
    sleep: 7.3,
    bloodPressure: { systolic: 142, diastolic: 90 },
    leanMass: 67.3,
  },
];

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: MOCK_ENTRIES,
  latestEntry: MOCK_ENTRIES[0] || null,

  addEntry: async (entry: ProgressEntry) => {
    try {
      // Simulate API call
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
      return {
        weightChange: 0,
        bodyFatChange: 0,
        leanMassChange: 0,
      };
    }

    const latest = entries[0];
    const oldest = entries[entries.length - 1];

    return {
      weightChange: oldest.weight - latest.weight, // Positive = weight loss
      bodyFatChange: oldest.bodyFat - latest.bodyFat, // Positive = fat loss
      leanMassChange: latest.leanMass - oldest.leanMass, // Positive = muscle gain
    };
  },
}));
