import { supabase } from '../lib/supabase';
import { syncHydrationGoal } from './goalProgressService';
import { todayISO, toLocalISODate } from '../utils/dateUtils';

export interface HydrationLog {
  id: string;
  user_id: string;
  date: string;
  total_ml: number;
  goal_ml: number;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/**
 * Objetivo de hidratación (ml) desde daily_goals del mismo día — fuente única con Metas.
 */
export async function getHydrationTargetMlForDate(date: string = todayISO()): Promise<number> {
  const userId = await getUserId();
  if (!userId) return 2500;

  const { data, error } = await supabase
    .from('daily_goals')
    .select('target_value')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('goal_type', 'hydration')
    .maybeSingle();

  if (error) {
    console.error('getHydrationTargetMlForDate:', error.message);
    return 2500;
  }
  if (data?.target_value != null) return Math.round(Number(data.target_value));
  return 2500;
}

/** Load hydration for a specific date. Returns null if no record yet. */
export async function getHydrationForDate(date: string = todayISO()): Promise<HydrationLog | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) { console.error('hydration fetch:', error.message); return null; }
  return data;
}

/**
 * Alinea goal_ml en hydration_logs con la meta del día (tras editar en Metas).
 */
export async function syncHydrationLogGoalMl(date: string, goal_ml: number): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { data: existing } = await supabase
    .from('hydration_logs')
    .select('total_ml')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  const { error } = await supabase.from('hydration_logs').upsert(
    {
      user_id: userId,
      date,
      total_ml: existing?.total_ml ?? 0,
      goal_ml: Math.round(goal_ml),
    },
    { onConflict: 'user_id,date' },
  );

  if (error) {
    console.error('syncHydrationLogGoalMl:', error.message);
    return false;
  }
  return true;
}

/** Save (upsert) total_ml for today. */
export async function saveHydration(total_ml: number, date: string = todayISO()): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const goal_ml = await getHydrationTargetMlForDate(date);

  const { error } = await supabase
    .from('hydration_logs')
    .upsert({ user_id: userId, date, total_ml, goal_ml }, { onConflict: 'user_id,date' });

  if (error) { console.error('hydration save:', error.message); return false; }

  // Sync goal progress (non-blocking)
  syncHydrationGoal(total_ml, date).catch(() => {});

  return true;
}

/** Fetch hydration for the last 7 calendar days (today included) */
export async function getWeeklyHydration(): Promise<{ date: string; total_ml: number }[]> {
  const userId = await getUserId();
  if (!userId) return [];

  // fromDate = 6 days ago (so we get a full 7-day window including today)
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromISO = toLocalISODate(from);

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('date, total_ml')
    .eq('user_id', userId)
    .gte('date', fromISO)
    .order('date', { ascending: true });

  if (error) { console.error('hydration weekly:', error.message); return []; }
  return data ?? [];
}
