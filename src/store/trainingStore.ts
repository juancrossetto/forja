import { create } from 'zustand';
import {
  Workout,
  WorkoutSession,
  Exercise,
  TrainingPhase,
} from '../types';
import {
  startActiveSession,
  finishActiveSession,
  cancelActiveSession,
  getActiveSession,
} from '../services/workoutService';
import { fetchTrainingProgram } from '../services/trainingCatalogService';
import {
  fetchExercisesByBodyParts,
  type CatalogExercise,
} from '../services/exerciseService';
import { exerciseImageUrlForApp } from '../services/exerciseMedia';

/** Sin datos en `training_phases` / `training_days` o error de red. */
export type TrainingCatalogSource = 'supabase' | 'empty';

const FALLBACK_EXERCISE_IMAGE =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400';

/** IDs locales mock antiguos (ex_001) — si quedaran, se reemplazan por catálogo global. */
const MOCK_EXERCISE_ID = /^ex_\d+$/i;

/**
 * Solo rellenar desde `exercises` por body_part cuando no hay filas en el plan
 * o siguen siendo placeholders mock.
 */
function needsGlobalCatalogHydration(workout: Workout): boolean {
  if (!workout.bodyParts?.length) return false;
  if (workout.exercises.length === 0) return true;
  return workout.exercises.every((e) => MOCK_EXERCISE_ID.test(e.id));
}

function applyCatalogToWorkoutExercises(
  workout: Workout,
  catalogItems: CatalogExercise[],
): Exercise[] {
  if (catalogItems.length === 0) return workout.exercises;
  const sorted = [...catalogItems].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
  );
  const n = Math.min(workout.exerciseCount ?? 5, sorted.length);
  const picked = sorted.slice(0, n);
  return picked.map((ex, idx) => ({
    id: ex.id,
    name: ex.name,
    sets: workout.defaultSets ?? 3,
    reps: workout.defaultReps ?? '10-12',
    weight: null,
    tempo: '2-0-2-0',
    image:
      exerciseImageUrlForApp({
        image_url: ex.image_url,
        metadata: ex.metadata,
      }) ?? FALLBACK_EXERCISE_IMAGE,
    order: idx + 1,
  }));
}

interface TrainingState {
  currentPhase: TrainingPhase | null;
  workouts: Workout[];
  catalogSource: TrainingCatalogSource;
  loadTrainingCatalog: () => Promise<void>;
  activeSession: WorkoutSession | null;
  sessionLogId: string | null;
  restoredElapsedSeconds: number;
  workoutStartedAt: number | null;
  elapsedSeconds: number;
  isWorkoutTimerPaused: boolean;
  setWorkoutTimerPaused: (paused: boolean) => void;
  isLoading: boolean;
  startWorkout: (workoutId: string) => Promise<void>;
  hydrateWorkoutExercisesFromCatalog: (workoutId: string) => Promise<void>;
  completeExercise: (exerciseId: string) => void;
  endWorkout: (rpe: number, notes: string) => Promise<void>;
  initActiveSession: () => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;
  getCurrentWorkout: () => Workout | undefined;
  cancelWorkout: () => Promise<void>;
  clearSession: () => void;
  setElapsed: (seconds: number) => void;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  currentPhase: null,
  workouts: [],
  catalogSource: 'empty',
  activeSession: null,
  sessionLogId: null,
  restoredElapsedSeconds: 0,
  workoutStartedAt: null,
  elapsedSeconds: 0,
  isWorkoutTimerPaused: false,
  isLoading: false,

  setWorkoutTimerPaused: (paused: boolean) => {
    set({ isWorkoutTimerPaused: paused });
  },

  loadTrainingCatalog: async () => {
    set({ isLoading: true });
    try {
      const result = await fetchTrainingProgram();
      if (result?.workouts?.length) {
        set({
          currentPhase: result.phase,
          workouts: result.workouts,
          catalogSource: 'supabase',
        });
      } else {
        set({
          currentPhase: null,
          workouts: [],
          catalogSource: 'empty',
        });
      }
    } catch (e) {
      console.warn('loadTrainingCatalog:', e);
      set({
        currentPhase: null,
        workouts: [],
        catalogSource: 'empty',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  hydrateWorkoutExercisesFromCatalog: async (workoutId: string) => {
    const workout = get().getWorkoutById(workoutId);
    if (!workout || !needsGlobalCatalogHydration(workout)) {
      return;
    }
    try {
      const catalogItems = await fetchExercisesByBodyParts(
        workout.bodyParts!,
        30,
      );
      if (catalogItems.length === 0) return;
      const exercises = applyCatalogToWorkoutExercises(workout, catalogItems);
      set({
        workouts: get().workouts.map((w) =>
          w.id === workoutId ? { ...w, exercises } : w,
        ),
      });
    } catch (e) {
      console.warn('hydrateWorkoutExercisesFromCatalog:', e);
    }
  },

  startWorkout: async (workoutId: string) => {
    const workout = get().getWorkoutById(workoutId);
    if (!workout) return;

    let exercises: Exercise[] = workout.exercises;
    if (needsGlobalCatalogHydration(workout)) {
      try {
        const catalogItems = await fetchExercisesByBodyParts(
          workout.bodyParts!,
          30,
        );
        if (catalogItems.length > 0) {
          exercises = applyCatalogToWorkoutExercises(workout, catalogItems);
        }
      } catch (e) {
        console.warn(
          'startWorkout: failed to fetch catalog exercises, using workout as-is',
          e,
        );
      }
    }

    const workoutWithRealExercises: typeof workout = { ...workout, exercises };

    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      workoutId,
      startTime: new Date(),
      endTime: null,
      completedExercises: [],
      rpe: null,
      notes: '',
      heartRate: null,
      caloriesBurned: null,
    };

    set({
      activeSession: session,
      sessionLogId: null,
      restoredElapsedSeconds: 0,
      workoutStartedAt: Date.now(),
      elapsedSeconds: 0,
      isWorkoutTimerPaused: false,
      workouts: get().workouts.map((w) =>
        w.id === workoutId ? workoutWithRealExercises : w,
      ),
    });

    const logId = await startActiveSession({
      workout_name: workout.title,
      workout_type: workout.type,
    });
    set({ sessionLogId: logId });
  },

  completeExercise: (exerciseId: string) => {
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          completedExercises: [
            ...state.activeSession.completedExercises,
            exerciseId,
          ],
        },
      };
    });
  },

  endWorkout: async (rpe: number, notes: string) => {
    set({ isLoading: true });
    try {
      const { activeSession, sessionLogId } = get();
      if (!activeSession) return;

      const durationSeconds = Math.round(
        (new Date().getTime() - activeSession.startTime.getTime()) / 1000,
      );
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      if (sessionLogId) {
        await finishActiveSession(sessionLogId, {
          duration_min: durationMinutes,
          rpe,
          comments: notes || null,
        });
      }

      set({
        activeSession: {
          ...activeSession,
          endTime: new Date(),
          rpe,
          notes,
          caloriesBurned: Math.round((durationMinutes / 60) * 350),
        },
        sessionLogId: null,
        workoutStartedAt: null,
      });
    } catch (error) {
      console.error('Error ending workout:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  initActiveSession: async () => {
    if (get().activeSession) return;

    const record = await getActiveSession();
    if (!record) return;

    const workout = get().workouts.find((w) => w.title === record.workout_name);
    if (!workout) return;

    const session: WorkoutSession = {
      id: `session_restored_${record.id}`,
      workoutId: workout.id,
      startTime: new Date(Date.now() - record.elapsed_seconds * 1000),
      endTime: null,
      completedExercises: record.completed_exercises,
      rpe: null,
      notes: '',
      heartRate: null,
      caloriesBurned: null,
    };

    set({
      activeSession: session,
      sessionLogId: record.id,
      restoredElapsedSeconds: record.elapsed_seconds,
      workoutStartedAt: Date.now() - record.elapsed_seconds * 1000,
      elapsedSeconds: record.elapsed_seconds,
      isWorkoutTimerPaused: false,
    });
  },

  getWorkoutById: (id: string) => {
    return get().workouts.find((w) => w.id === id);
  },

  getCurrentWorkout: () => {
    const { activeSession, workouts } = get();
    if (!activeSession) return undefined;
    return workouts.find((w) => w.id === activeSession.workoutId);
  },

  cancelWorkout: async () => {
    const sessionLogId = get().sessionLogId;
    set({
      activeSession: null,
      sessionLogId: null,
      restoredElapsedSeconds: 0,
      workoutStartedAt: null,
      elapsedSeconds: 0,
      isWorkoutTimerPaused: false,
    });
    if (sessionLogId) {
      void cancelActiveSession(sessionLogId);
    }
  },

  clearSession: () => {
    set({
      activeSession: null,
      sessionLogId: null,
      restoredElapsedSeconds: 0,
      workoutStartedAt: null,
      elapsedSeconds: 0,
      isWorkoutTimerPaused: false,
    });
  },

  setElapsed: (seconds: number) => {
    set({ elapsedSeconds: seconds });
  },
}));
