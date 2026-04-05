import { supabase } from '../lib/supabase';

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
