import { supabase } from '../lib/supabase';

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  gender: 'male' | 'female' | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
  legs_cm: number | null;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/** Load measurements for a given date. Returns null if none. */
export async function getMeasurementsForDate(date: string = todayISO()): Promise<BodyMeasurement | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) { console.error('measurements fetch:', error.message); return null; }
  return data;
}

/** Upsert measurements for today. */
export async function saveMeasurements(payload: {
  gender: 'male' | 'female';
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
  legs_cm: number | null;
  date?: string;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const date = payload.date ?? todayISO();

  const { error } = await supabase
    .from('body_measurements')
    .upsert({ user_id: userId, date, ...payload }, { onConflict: 'user_id,date' });

  if (error) { console.error('measurements save:', error.message); return false; }
  return true;
}

/** Last N measurement records for progress charts */
export async function getMeasurementHistory(limit = 10): Promise<BodyMeasurement[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) { console.error('measurements history:', error.message); return []; }
  return data ?? [];
}
