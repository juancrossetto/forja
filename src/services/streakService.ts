/**
 * Streak Service — calcula rachas basadas en daily_goals.
 *
 * "Días Registrados" (registered streak): días consecutivos hasta hoy donde
 * al menos UNA meta tiene completed = true.
 */

import { supabase } from '../lib/supabase';
import { toLocalISODate } from '../utils/dateUtils';

export interface StreakInfo {
  current: number;
  best: number;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/**
 * Devuelve la racha actual y la mejor racha de "días registrados"
 * (días donde al menos una meta fue completada).
 */
export async function getRegisteredStreak(): Promise<StreakInfo> {
  const userId = await getUserId();
  if (!userId) return { current: 0, best: 0 };

  // Traer los últimos 365 días con al menos una meta completada, agrupados por fecha
  const { data, error } = await supabase
    .from('daily_goals')
    .select('date')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(365);

  if (error || !data) return { current: 0, best: 0 };

  // Deduplicar fechas
  const completedDates = new Set<string>(data.map((r) => r.date as string));

  if (completedDates.size === 0) return { current: 0, best: 0 };

  // ── Racha actual: contar hacia atrás desde hoy ────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  const cursor = new Date(today);

  while (completedDates.has(toLocalISODate(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // ── Mejor racha: recorrer todas las fechas ordenadas ──────────────────────
  const sorted = Array.from(completedDates).sort(); // asc YYYY-MM-DD
  let best = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sorted) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (prevDate) {
      const diff = (d.getTime() - prevDate.getTime()) / 86_400_000;
      streak = diff === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    if (streak > best) best = streak;
    prevDate = d;
  }

  return { current, best };
}

/** URL pública del trofeo guardado en Supabase Storage bucket `icons`, archivo `trophy.png`. */
export function getTrophyUrl(): string {
  const { data } = supabase.storage.from('icons').getPublicUrl('trophy.png');
  return data.publicUrl;
}

/**
 * Resuelve la URL pública de un asset estático en storage.
 * @param bucket  nombre del bucket (ej. 'icons')
 * @param path    ruta del archivo (ej. 'trophy.png')
 */
export function getStaticAssetUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
