import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export type PhotoPosition = 'frente' | 'perfil' | 'espalda';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  position: PhotoPosition;
  photo_url: string;
  week_number: number;
  recorded_at: string;
  created_at: string;
}

/** Returns ISO week number for a given date (1-53) */
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Builds the storage path: {userId}/{YYYY-MM-DD}/{position}.jpg
 *  Same day → overwrites. Different day → new folder, new file. */
function buildStoragePath(userId: string, position: PhotoPosition, date: string): string {
  return `${userId}/${date}/${position}.jpg`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Uploads a photo to Supabase Storage and upserts the DB record.
 * Returns the public URL on success, throws on error.
 */
export async function uploadProgressPhoto(
  position: PhotoPosition,
  localUri: string
): Promise<string> {
  // Get session from Supabase client — ensures auth token is included in all requests
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa. Iniciá sesión nuevamente.');
  const userId = session.user.id;

  const today = todayISO();
  const path = buildStoragePath(userId, position, today);

  // Read local file as base64 then decode to ArrayBuffer (most reliable in Expo)
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);

  // Remove existing file for today first (same day = overwrite)
  await supabase.storage.from('progress-photos').remove([path]);

  const { error: uploadError } = await supabase.storage
    .from('progress-photos')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg' });

  if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

  const { data: urlData } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(path);

  const photoUrl = urlData.publicUrl;
  const weekNumber = getISOWeek(new Date());

  // Check if a record already exists for today + position (same day = update)
  const { data: existing } = await supabase
    .from('progress_photos')
    .select('id')
    .eq('user_id', userId)
    .eq('position', position)
    .eq('recorded_at', today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('progress_photos')
      .update({ photo_url: photoUrl })
      .eq('id', existing.id);
    if (error) throw new Error(`Update error: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('progress_photos')
      .insert({ user_id: userId, position, photo_url: photoUrl, week_number: weekNumber, recorded_at: today });
    if (error) throw new Error(`Insert error: ${error.message}`);
  }

  return photoUrl;
}

/** Fetch all progress photos for the current user, newest first */
export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching photos:', error.message);
    return [];
  }

  return data ?? [];
}
