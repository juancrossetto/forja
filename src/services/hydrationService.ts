import { supabase } from '../lib/supabase';

export interface HydrationLog {
  id: string;
  user_id: string;
  date: string;
  total_ml: number;
  goal_ml: number;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
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

/** Save (upsert) total_ml for today. */
export async function saveHydration(total_ml: number, date: string = todayISO()): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('hydration_logs')
    .upsert({ user_id: userId, date, total_ml, goal_ml: 3000 }, { onConflict: 'user_id,date' });

  if (error) { console.error('hydration save:', error.message); return false; }
  return true;
}

/** Fetch last 7 days for the chart */
export async function getWeeklyHydration(): Promise<{ date: string; total_ml: number }[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('date, total_ml')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7);

  if (error) { console.error('hydration weekly:', error.message); return []; }
  return data ?? [];
}
