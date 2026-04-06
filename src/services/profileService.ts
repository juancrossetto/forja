import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: string;
  plan_name: string | null;
  plan_duration_weeks: number | null;
  plan_current_week: number;
  created_at: string;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

async function getUserEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.email ?? null;
}

/** Fetch current user's profile. Creates one if it doesn't exist yet. */
export async function getProfile(): Promise<UserProfile | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) { console.error('profile fetch:', error.message); return null; }

  // If no profile yet, create one with email as fallback name
  if (!data) {
    const email = await getUserEmail();
    const fallbackName = email ? email.split('@')[0].toUpperCase() : 'USUARIO';
    const { data: created, error: createError } = await supabase
      .from('user_profiles')
      .insert({ user_id: userId, full_name: fallbackName })
      .select()
      .single();
    if (createError) { console.error('profile create:', createError.message); return null; }
    return created;
  }

  return data;
}

/** Update profile fields */
export async function updateProfile(payload: Partial<Pick<UserProfile,
  'full_name' | 'avatar_url' | 'level' | 'plan_name' | 'plan_duration_weeks' | 'plan_current_week'
>>): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });

  if (error) { console.error('profile update:', error.message); return false; }
  return true;
}

/**
 * Upload a local image URI as the user's avatar.
 * Stores in Supabase Storage bucket `avatars/{userId}/avatar.jpg`
 * and updates user_profiles.avatar_url.
 * Returns the public URL or null on failure.
 */
export async function uploadAvatar(localUri: string): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const path = `${userId}/avatar.jpg`;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decode(base64);

    // Remove existing avatar first (overwrite)
    await supabase.storage.from('avatars').remove([path]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg' });

    if (uploadError) { console.error('avatar upload:', uploadError.message); return null; }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

    await updateProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  } catch (e: any) {
    console.error('uploadAvatar:', e.message);
    return null;
  }
}

/** Get member since year from auth.users */
export async function getMemberSinceYear(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const createdAt = data?.session?.user?.created_at;
  if (!createdAt) return '';
  return new Date(createdAt).getFullYear().toString();
}
