import { supabase } from '../lib/supabase';
import { todayISO, toLocalISODate } from '../utils/dateUtils';
import { syncMealsGoal } from './goalProgressService';
import { macrosForGrams, type FoodRow } from './foodService';

export type MealType = 'DES' | 'ALM' | 'MER' | 'CEN';

const MEAL_TYPE_LABEL_ES: Record<MealType, string> = {
  DES: 'Desayuno',
  ALM: 'Almuerzo',
  MER: 'Merienda',
  CEN: 'Cena',
};

/** Spanish label for DB meal_type codes (DES, ALM, …). */
export function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABEL_ES[type] ?? type;
}

export type MealMacroSource =
  | 'openfoodfacts'
  | 'manual'
  | 'user_food'
  | 'catalog'
  | 'voice'
  | 'barcode';

export interface MealLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  title: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at?: string;
  food_id?: string | null;
  /** Barcode; Open Food Facts product.code (ODbL — attribute in UI). */
  openfoodfacts_code?: string | null;
  product_display_name?: string | null;
  macro_source?: MealMacroSource | null;
  user_food_id?: string | null;
  portion_grams?: number | null;
  /** Totals for this log line (portion), not per 100g. */
  energy_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
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
  food_id?: string | null;
  product_display_name?: string | null;
  openfoodfacts_code?: string | null;
  macro_source?: MealMacroSource | null;
  portion_grams?: number | null;
  energy_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  let photoUrl: string | null = null;
  if (payload.photo_uri && isLocalUri(payload.photo_uri)) {
    photoUrl = await uploadPhoto(payload.photo_uri, userId);
  } else if (payload.photo_uri) {
    photoUrl = payload.photo_uri; // already a remote URL
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    date: payload.date ?? todayISO(),
    meal_type: payload.meal_type,
    title: payload.title ?? null,
    photo_url: photoUrl,
  };
  if (payload.food_id !== undefined) row.food_id = payload.food_id;
  if (payload.product_display_name !== undefined) row.product_display_name = payload.product_display_name;
  if (payload.openfoodfacts_code !== undefined) row.openfoodfacts_code = payload.openfoodfacts_code;
  if (payload.macro_source !== undefined) row.macro_source = payload.macro_source;
  if (payload.portion_grams !== undefined) row.portion_grams = payload.portion_grams;
  if (payload.energy_kcal !== undefined) row.energy_kcal = payload.energy_kcal;
  if (payload.protein_g !== undefined) row.protein_g = payload.protein_g;
  if (payload.carbs_g !== undefined) row.carbs_g = payload.carbs_g;
  if (payload.fat_g !== undefined) row.fat_g = payload.fat_g;

  const { error } = await supabase.from('meal_logs').insert(row);

  if (error) { console.error('meal save:', error.message); return false; }

  syncMealsGoal(payload.date ?? todayISO()).catch(() => {});

  return true;
}

/** Porción por defecto del alimento (catálogo) o 100 g; guarda el log sin pantalla intermedia. */
export async function quickAddMealFromFood(
  food: FoodRow,
  mealType: MealType,
  dateISO: string,
): Promise<boolean> {
  const grams =
    food.default_serving_grams != null && Number(food.default_serving_grams) > 0
      ? Number(food.default_serving_grams)
      : 100;
  const m = macrosForGrams(
    food.kcal_100g,
    food.protein_g_100g,
    food.carbs_g_100g,
    food.fat_g_100g,
    grams,
  );
  const macro_source: MealMacroSource =
    food.source === 'openfoodfacts' ? 'openfoodfacts' : 'catalog';
  const brandPrefix = food.brand ? `${food.brand} · ` : '';
  return saveMealLog({
    date: dateISO,
    meal_type: mealType,
    title: food.name,
    food_id: food.id,
    product_display_name: `${brandPrefix}${food.name}`.trim(),
    openfoodfacts_code: food.openfoodfacts_code ?? food.barcode ?? undefined,
    macro_source,
    portion_grams: grams,
    energy_kcal: m.energy_kcal,
    protein_g: m.protein_g,
    carbs_g: m.carbs_g,
    fat_g: m.fat_g,
  });
}

/** Registro desde catálogo con gramos explícitos (hoja de detalle). */
export async function addMealFromFoodWithPortion(
  food: FoodRow,
  mealType: MealType,
  dateISO: string,
  grams: number,
  opts?: { productDisplayName?: string; photoUri?: string | null },
): Promise<boolean> {
  const g = Math.max(1, Math.round(grams));
  const m = macrosForGrams(
    food.kcal_100g,
    food.protein_g_100g,
    food.carbs_g_100g,
    food.fat_g_100g,
    g,
  );
  const macro_source: MealMacroSource =
    food.source === 'openfoodfacts' ? 'openfoodfacts' : 'catalog';
  const brandPrefix = food.brand ? `${food.brand} · ` : '';
  const defaultDisplayName = `${brandPrefix}${food.name}`.trim();
  return saveMealLog({
    date: dateISO,
    meal_type: mealType,
    title: food.name,
    food_id: food.id,
    product_display_name: opts?.productDisplayName ?? defaultDisplayName,
    openfoodfacts_code: food.openfoodfacts_code ?? food.barcode ?? undefined,
    macro_source,
    portion_grams: g,
    energy_kcal: m.energy_kcal,
    protein_g: m.protein_g,
    carbs_g: m.carbs_g,
    fat_g: m.fat_g,
    photo_uri: opts?.photoUri ?? undefined,
  });
}

/** Foto sin macros (diario visual). */
export async function quickAddPhotoMealJournal(
  mealType: MealType,
  dateISO: string,
  photoUri: string,
): Promise<boolean> {
  return saveMealLog({
    date: dateISO,
    meal_type: mealType,
    title: 'Comida con foto',
    photo_uri: photoUri,
    macro_source: 'manual',
    portion_grams: null,
    energy_kcal: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
  });
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

/** `date` del día afectado: sincroniza meta de “comidas” si se pasa. */
export async function deleteMealLog(id: string, dateForGoalSync?: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;
  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) { console.error('delete meal log:', error.message); return false; }
  if (dateForGoalSync) syncMealsGoal(dateForGoalSync).catch(() => {});
  return true;
}

/**
 * Reinserta una fila equivalente a un log borrado (nuevo id). Para flujo Deshacer.
 */
export async function restoreMealLog(snapshot: MealLog): Promise<MealLog | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const row: Record<string, unknown> = {
    user_id: userId,
    date: snapshot.date,
    meal_type: snapshot.meal_type,
    title: snapshot.title ?? null,
    photo_url: snapshot.photo_url ?? null,
    food_id: snapshot.food_id ?? null,
    openfoodfacts_code: snapshot.openfoodfacts_code ?? null,
    product_display_name: snapshot.product_display_name ?? null,
    macro_source: snapshot.macro_source ?? null,
    user_food_id: snapshot.user_food_id ?? null,
    portion_grams: snapshot.portion_grams ?? null,
    energy_kcal: snapshot.energy_kcal ?? null,
    protein_g: snapshot.protein_g ?? null,
    carbs_g: snapshot.carbs_g ?? null,
    fat_g: snapshot.fat_g ?? null,
  };

  const { data, error } = await supabase.from('meal_logs').insert(row).select('*').single();

  if (error) {
    console.error('restore meal log:', error.message);
    return null;
  }

  syncMealsGoal(snapshot.date).catch(() => {});

  return data as MealLog;
}
