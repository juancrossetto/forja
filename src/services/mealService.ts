import { supabase } from '../lib/supabase';
import { todayISO, toLocalISODate } from '../utils/dateUtils';
import { syncMealsGoal } from './goalProgressService';

export type MealType = 'DES' | 'ALM' | 'MER' | 'CEN';

export interface MealLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  title: string | null;
  photo_url: string | null;
  created_at: string;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/** Upload photo to Supabase Storage and return the public URL. */
async function uploadPhoto(uri: string, userId: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${userId}/meals/${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('progress-photos')
      .upload(path, blob, { contentType: `image/${ext}`, upsert: false });

    if (error) { console.error('meal photo upload:', error.message); return null; }

    const { data } = supabase.storage.from('progress-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('meal photo upload exception:', e);
    return null;
  }
}

/** Returns true if a URI is a local file (needs upload), false if it's already a remote URL. */
function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/');
}

/** Save a new meal log entry. Uploads photo if local URI is provided. */
export async function saveMealLog(payload: {
  date?: string;
  meal_type: MealType;
  title?: string | null;
  photo_uri?: string | null;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  let photoUrl: string | null = null;
  if (payload.photo_uri && isLocalUri(payload.photo_uri)) {
    photoUrl = await uploadPhoto(payload.photo_uri, userId);
  } else if (payload.photo_uri) {
    photoUrl = payload.photo_uri; // already a remote URL
  }

  const { error } = await supabase.from('meal_logs').insert({
    user_id: userId,
    date: payload.date ?? todayISO(),
    meal_type: payload.meal_type,
    title: payload.title ?? null,
    photo_url: photoUrl,
  });

  if (error) { console.error('meal save:', error.message); return false; }

  // Sync goal progress (non-blocking)
  syncMealsGoal(payload.date ?? todayISO()).catch(() => {});

  return true;
}

/** Update an existing meal log entry by ID. */
export async function updateMealLog(id: string, payload: {
  title?: string | null;
  photo_uri?: string | null;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  let photoUrl: string | undefined;
  if (payload.photo_uri !== undefined) {
    if (payload.photo_uri && isLocalUri(payload.photo_uri)) {
      const uploaded = await uploadPhoto(payload.photo_uri, userId);
      photoUrl = uploaded ?? undefined;
    } else {
      photoUrl = payload.photo_uri ?? undefined;
    }
  }

  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (photoUrl !== undefined) updates.photo_url = photoUrl;

  const { error } = await supabase
    .from('meal_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) { console.error('meal update:', error.message); return false; }
  return true;
}

/** Fetch meal logs for a specific date. */
export async function getMealsForDate(date: string = todayISO()): Promise<MealLog[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) { console.error('meals fetch:', error.message); return []; }
  return data ?? [];
}

/** Fetch all meal logs for the last N days. */
export async function getRecentMeals(days = 7): Promise<MealLog[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromISO = toLocalISODate(from);

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromISO)
    .order('date', { ascending: false });

  if (error) { console.error('recent meals fetch:', error.message); return []; }
  return data ?? [];
}
