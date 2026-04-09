import { create } from 'zustand';
import { Workout, WorkoutSession, Exercise, TrainingPhase, TrainingDay } from '../types';
import {
  startActiveSession,
  finishActiveSession,
  cancelActiveSession,
  getActiveSession,
} from '../services/workoutService';

interface TrainingState {
  currentPhase: TrainingPhase | null;
  workouts: Workout[];
  activeSession: WorkoutSession | null;
  sessionLogId: string | null;       // Supabase workout_logs id for the active session
  restoredElapsedSeconds: number;    // elapsed seconds loaded from DB on restore
  workoutStartedAt: number | null;   // Unix ms timestamp — accounts for restored offset
  elapsedSeconds: number;            // live elapsed seconds — single source of truth for UI
  /** When false, global timer ticks (banner + live screen). When true, timer frozen until resume. */
  isWorkoutTimerPaused: boolean;
  setWorkoutTimerPaused: (paused: boolean) => void;
  isLoading: boolean;
  startWorkout: (workoutId: string) => Promise<void>;
  completeExercise: (exerciseId: string) => void;
  endWorkout: (rpe: number, notes: string) => Promise<void>;
  initActiveSession: () => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;
  getCurrentWorkout: () => Workout | undefined;
  cancelWorkout: () => Promise<void>;
  clearSession: () => void;
  setElapsed: (seconds: number) => void;
}

// Mock exercises for Phase 02: Potencia Estructural
const PRESS_BANCA: Exercise = {
  id: 'ex_001',
  name: 'Press de Banca',
  sets: 4,
  reps: '6-8',
  weight: 80,
  tempo: '3-1-2-0',
  image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
  order: 1,
};

const VUELOS_LATERALES: Exercise = {
  id: 'ex_002',
  name: 'Vuelos Laterales',
  sets: 3,
  reps: '10-12',
  weight: 20,
  tempo: '2-0-2-0',
  image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
  order: 2,
};

const PULL_UPS: Exercise = {
  id: 'ex_003',
  name: 'Pull-ups (Asistidos)',
  sets: 3,
  reps: '8-10',
  weight: null,
  tempo: '2-0-2-1',
  image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400',
  order: 3,
};

const REMO_HORIZONTAL: Exercise = {
  id: 'ex_004',
  name: 'Remo Horizontal',
  sets: 4,
  reps: '6-8',
  weight: 75,
  tempo: '2-1-2-0',
  image: 'https://images.unsplash.com/photo-1607291555033-d30d7f88d6ca?w=400',
  order: 4,
};

const CURL_BICEPS: Exercise = {
  id: 'ex_005',
  name: 'Curl de Bíceps',
  sets: 3,
  reps: '10-12',
  weight: 25,
  tempo: '2-0-2-1',
  image: 'https://images.unsplash.com/photo-1581009146989-b79b961f48f7?w=400',
  order: 5,
};

const EXTENSIONES_TRICEPS: Exercise = {
  id: 'ex_006',
  name: 'Extensiones de Tríceps',
  sets: 3,
  reps: '10-12',
  weight: 22,
  tempo: '2-0-2-1',
  image: 'https://images.unsplash.com/photo-1580822261290-991b38693d1b?w=400',
  order: 6,
};

const SENTADILLAS: Exercise = {
  id: 'ex_007',
  name: 'Sentadillas',
  sets: 4,
  reps: '6-8',
  weight: 100,
  tempo: '3-1-2-0',
  image: 'https://images.unsplash.com/photo-1598971331058-87ff51c53de7?w=400',
  order: 1,
};

const PRENSA: Exercise = {
  id: 'ex_008',
  name: 'Prensa de Piernas',
  sets: 4,
  reps: '8-10',
  weight: 150,
  tempo: '2-1-2-0',
  image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
  order: 2,
};

const LEG_CURL: Exercise = {
  id: 'ex_009',
  name: 'Leg Curl Máquina',
  sets: 3,
  reps: '10-12',
  weight: 45,
  tempo: '2-0-2-1',
  image: 'https://images.unsplash.com/photo-1598971331058-87ff51c53de7?w=400',
  order: 3,
};

const ELEVACIONES_GEMELOS: Exercise = {
  id: 'ex_010',
  name: 'Elevaciones de Gemelos',
  sets: 4,
  reps: '12-15',
  weight: 50,
  tempo: '2-1-2-0',
  image: 'https://images.unsplash.com/photo-1577221084712-cd5181e3a57a?w=400',
  order: 4,
};

// Mock workouts
const WORKOUT_PECHO_ESPALDA: Workout = {
  id: 'wk_001',
  title: 'Pecho y Espalda',
  type: 'fuerza',
  duration: 65,
  blocks: 2,
  calories: 380,
  exercises: [PRESS_BANCA, VUELOS_LATERALES, PULL_UPS, REMO_HORIZONTAL],
};

const WORKOUT_BRAZOS: Workout = {
  id: 'wk_002',
  title: 'Brazos y Antebrazos',
  type: 'fuerza',
  duration: 50,
  blocks: 1,
  calories: 250,
  exercises: [CURL_BICEPS, EXTENSIONES_TRICEPS],
};

const WORKOUT_PIERNAS: Workout = {
  id: 'wk_003',
  title: 'Piernas',
  type: 'fuerza',
  duration: 75,
  blocks: 2,
  calories: 450,
  exercises: [SENTADILLAS, PRENSA, LEG_CURL, ELEVACIONES_GEMELOS],
};

const WORKOUT_CARDIO: Workout = {
  id: 'wk_004',
  title: 'Cardio Moderado',
  type: 'cardio',
  duration: 40,
  blocks: 1,
  calories: 380,
  exercises: [],
};

// Mock training phase: Phase 02 - Potencia Estructural
const MOCK_PHASE: TrainingPhase = {
  id: 'phase_02',
  name: 'Potencia Estructural',
  number: 2,
  description: 'Enfoque en desarrollo de fuerza y potencia con movimientos compuestos',
  progress: 45,
  days: [
    {
      dayNumber: 1,
      title: 'Lunes - Pecho y Espalda',
      type: 'fuerza',
      workout: WORKOUT_PECHO_ESPALDA,
    },
    {
      dayNumber: 2,
      title: 'Martes - Cardio',
      type: 'cardio',
      workout: WORKOUT_CARDIO,
    },
    {
      dayNumber: 3,
      title: 'Miércoles - Brazos',
      type: 'fuerza',
      workout: WORKOUT_BRAZOS,
    },
    {
      dayNumber: 4,
      title: 'Jueves - Descanso',
      type: 'descanso',
    },
    {
      dayNumber: 5,
      title: 'Viernes - Piernas',
      type: 'fuerza',
      workout: WORKOUT_PIERNAS,
    },
    {
      dayNumber: 6,
      title: 'Sábado - Cardio Ligero',
      type: 'cardio',
      workout: WORKOUT_CARDIO,
    },
    {
      dayNumber: 7,
      title: 'Domingo - Descanso',
      type: 'descanso',
    },
  ],
};

const ALL_WORKOUTS = [WORKOUT_PECHO_ESPALDA, WORKOUT_BRAZOS, WORKOUT_PIERNAS, WORKOUT_CARDIO];

export const useTrainingStore = create<TrainingState>((set, get) => ({
  currentPhase: MOCK_PHASE,
  workouts: ALL_WORKOUTS,
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

  startWorkout: async (workoutId: string) => {
    const workout = get().getWorkoutById(workoutId);
    if (!workout) return;

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
          completedExercises: [...state.activeSession.completedExercises, exerciseId],
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
        (new Date().getTime() - activeSession.startTime.getTime()) / 1000
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

  /**
   * Restore an in-progress session from Supabase.
   * Call this on app start or when the live screen mounts with no local session.
   */
  initActiveSession: async () => {
    if (get().activeSession) return; // already have one locally

    const record = await getActiveSession();
    if (!record) return;

    // Best-effort match by workout name against mock data
    const workout = ALL_WORKOUTS.find((w) => w.title === record.workout_name);
    if (!workout) return;

    const session: WorkoutSession = {
      id: `session_restored_${record.id}`,
      workoutId: workout.id,
      // Reconstruct startTime so that (now - startTime) ≈ elapsed_seconds
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
    const { sessionLogId } = get();
    if (sessionLogId) {
      await cancelActiveSession(sessionLogId);
    }
    set({
      activeSession: null,
      sessionLogId: null,
      restoredElapsedSeconds: 0,
      workoutStartedAt: null,
      elapsedSeconds: 0,
      isWorkoutTimerPaused: false,
    });
  },

  /** Clear local session state without touching Supabase (used after finishing). */
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
