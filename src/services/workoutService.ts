import { supabase } from '../lib/supabase';
import { syncTrainingGoal } from './goalProgressService';

export type CardioActivityId =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'rowing'
  | 'elliptical';

export interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  workout_name: string;
  workout_type: string | null;
  duration_min: number | null;
  rpe: number | null;
  comments: string | null;
  completed: boolean;
  cardio_activity?: CardioActivityId | null;
  distance?: number | null;
  distance_unit?: 'km' | 'mi' | null;
  duration_seconds?: number | null;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/** Save a completed workout session. */
export async function saveWorkoutLog(payload: {
  workout_name: string;
  workout_type?: string;
  duration_min?: number | null;
  rpe?: number | null;
  comments?: string | null;
  date?: string;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const date = payload.date ?? todayISO();

  const { error } = await supabase.from('workout_logs').insert({
    user_id: userId,
    date,
    workout_name: payload.workout_name,
    workout_type: payload.workout_type ?? null,
    duration_min: payload.duration_min ?? null,
    rpe: payload.rpe ?? null,
    comments: payload.comments ?? null,
    completed: true,
  });

  if (error) { console.error('workout save:', error.message); return false; }

  // Sync goal progress (non-blocking)
  syncTrainingGoal(date).catch(() => {});

  return true;
}

const CARDIO_ACTIVITY_TITLE: Record<CardioActivityId, string> = {
  running: 'Running',
  walking: 'Walking',
  cycling: 'Cycling',
  rowing: 'Rowing',
  elliptical: 'Eliptical',
};

/**
 * Guarda una sesión de cardio completada (distancia, duración, RPE).
 * Persiste en workout_logs con workout_type = cardio y columnas dedicadas.
 */
export async function saveCardioLog(payload: {
  activity: CardioActivityId;
  unit: 'km' | 'mi';
  /** Distancia en la unidad elegida; null si el usuario no ingresó valor */
  distance: number | null;
  durationSeconds: number;
  rpe: number;
  date?: string;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const date = payload.date ?? todayISO();
  const title = CARDIO_ACTIVITY_TITLE[payload.activity];
  const workout_name = `Cardio · ${title}`;
  const duration_min =
    payload.durationSeconds > 0 ? Math.max(0, Math.round(payload.durationSeconds / 60)) : 0;

  const { error } = await supabase.from('workout_logs').insert({
    user_id: userId,
    date,
    workout_name,
    workout_type: 'cardio',
    duration_min,
    duration_seconds: payload.durationSeconds,
    rpe: payload.rpe,
    cardio_activity: payload.activity,
    distance: payload.distance,
    distance_unit: payload.distance != null ? payload.unit : null,
    completed: true,
  });

  if (error) {
    console.error('cardio save:', error.message);
    return false;
  }

  syncTrainingGoal(date).catch(() => {});
  return true;
}

/** Fetch the last N workout logs for history/progress. */
export async function getWorkoutHistory(limit = 10): Promise<WorkoutLog[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) { console.error('workout history:', error.message); return []; }
  return data ?? [];
}

/** Fetch workouts for a specific date. */
export async function getWorkoutsForDate(date: string = todayISO()): Promise<WorkoutLog[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) { console.error('workouts for date:', error.message); return []; }
  return data ?? [];
}

// ── ACTIVE SESSION ────────────────────────────────────────────────────────────

export interface ActiveSessionRecord {
  id: string;
  workout_name: string;
  workout_type: string | null;
  elapsed_seconds: number;
  completed_exercises: string[];
  created_at: string;
}

/**
 * Insert a new in-progress session (completed = false).
 * Returns the Supabase row id, or null on failure.
 */
export async function startActiveSession(params: {
  workout_name: string;
  workout_type?: string;
}): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      date: todayISO(),
      workout_name: params.workout_name,
      workout_type: params.workout_type ?? null,
      completed: false,
      elapsed_seconds: 0,
      completed_exercises: [],
    })
    .select('id')
    .single();

  if (error) { console.error('startActiveSession:', error.message); return null; }
  return data?.id ?? null;
}

/**
 * Periodically checkpoint elapsed time and completed exercise ids.
 * Called every 30 s by the live screen and on each exercise completion.
 */
export async function updateActiveSession(
  id: string,
  elapsed_seconds: number,
  completed_exercises: string[]
): Promise<void> {
  const { error } = await supabase
    .from('workout_logs')
    .update({ elapsed_seconds, completed_exercises })
    .eq('id', id);

  if (error) console.error('updateActiveSession:', error.message);
}

/**
 * Fetch the latest incomplete session for the current user.
 * Returns null if none exists or on error.
 */
export async function getActiveSession(): Promise<ActiveSessionRecord | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, workout_name, workout_type, elapsed_seconds, completed_exercises, created_at')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...data,
    completed_exercises: (data.completed_exercises as string[]) ?? [],
  };
}

/**
 * Mark an active session as completed with final stats (single DB write for that row).
 */
export async function finishActiveSession(
  id: string,
  params: {
    duration_min: number;
    rpe?: number | null;
    comments?: string | null;
    elapsed_seconds?: number;
    completed_exercises?: string[];
  },
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    completed: true,
    duration_min: params.duration_min,
    rpe: params.rpe ?? null,
    comments: params.comments ?? null,
  };
  if (params.elapsed_seconds != null) {
    payload.elapsed_seconds = params.elapsed_seconds;
  }
  if (params.completed_exercises != null) {
    payload.completed_exercises = params.completed_exercises;
  }

  const { error } = await supabase.from('workout_logs').update(payload).eq('id', id);

  if (error) {
    console.error('finishActiveSession:', error.message);
    return false;
  }

  syncTrainingGoal(todayISO()).catch(() => {});
  return true;
}

/**
 * Delete an abandoned session so it does not resurface on restart.
 */
export async function cancelActiveSession(id: string): Promise<void> {
  const { error } = await supabase.from('workout_logs').delete().eq('id', id);
  if (error) console.error('cancelActiveSession:', error.message);
}

// ── HISTORY ───────────────────────────────────────────────────────────────────

/** Count workouts completed in current week (Mon–Sun). */
export async function getWeeklyWorkoutCount(): Promise<number> {
  const userId = await getUserId();
  if (!userId) return 0;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  const mondayISO = monday.toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', mondayISO);

  if (error) { console.error('weekly workout count:', error.message); return 0; }
  return count ?? 0;
}
