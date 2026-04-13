import { supabase } from '../lib/supabase';
import { fetchOpenFoodFactsByBarcode } from './openFoodFactsService';

export type FoodSource = 'manual' | 'voice' | 'barcode' | 'openfoodfacts' | 'import';

export interface FoodRow {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
  default_serving_grams: number | null;
  source: FoodSource;
  openfoodfacts_code: string | null;
  voice_transcript: string | null;
  created_at: string;
  updated_at: string;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

export async function searchFoods(query: string, limit = 40): Promise<FoodRow[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const q = query.trim();
  if (!q) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('foods search:', error.message); return []; }
    return (data ?? []) as FoodRow[];
  }

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) { console.error('foods search:', error.message); return []; }
  return (data ?? []) as FoodRow[];
}

export async function getFoodById(id: string): Promise<FoodRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { console.error('food by id:', error.message); return null; }
  return data as FoodRow | null;
}

/** Catálogo local o creación desde Open Food Facts; para flujo de escaneo rápido. */
export async function resolveOrCreateFoodFromBarcode(barcode: string): Promise<FoodRow | null> {
  const existing = await findFoodByBarcode(barcode);
  if (existing) return existing;
  const off = await fetchOpenFoodFactsByBarcode(barcode);
  if (!off) return null;
  return createFood({
    name: off.name,
    brand: off.brand,
    barcode: barcode.trim(),
    kcal_100g: off.kcal_100g,
    protein_g_100g: off.protein_g_100g,
    carbs_g_100g: off.carbs_g_100g,
    fat_g_100g: off.fat_g_100g,
    source: 'openfoodfacts',
    openfoodfacts_code: off.code,
  });
}

export async function findFoodByBarcode(barcode: string): Promise<FoodRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const code = barcode.trim();
  if (!code) return null;
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('user_id', userId)
    .eq('barcode', code)
    .maybeSingle();
  if (error) { console.error('food by barcode:', error.message); return null; }
  return data as FoodRow | null;
}

export async function createFood(payload: {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  kcal_100g?: number | null;
  protein_g_100g?: number | null;
  carbs_g_100g?: number | null;
  fat_g_100g?: number | null;
  default_serving_grams?: number | null;
  source: FoodSource;
  openfoodfacts_code?: string | null;
  voice_transcript?: string | null;
}): Promise<FoodRow | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('foods')
    .insert({
      user_id: userId,
      name: payload.name.trim(),
      brand: payload.brand ?? null,
      barcode: payload.barcode?.trim() || null,
      kcal_100g: payload.kcal_100g ?? null,
      protein_g_100g: payload.protein_g_100g ?? null,
      carbs_g_100g: payload.carbs_g_100g ?? null,
      fat_g_100g: payload.fat_g_100g ?? null,
      default_serving_grams: payload.default_serving_grams ?? null,
      source: payload.source,
      openfoodfacts_code: payload.openfoodfacts_code ?? null,
      voice_transcript: payload.voice_transcript ?? null,
    })
    .select('*')
    .single();

  if (error) { console.error('create food:', error.message); return null; }
  return data as FoodRow;
}

export async function deleteFood(id: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;
  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    console.error('delete food:', error.message);
    return false;
  }
  return true;
}

/** Portion totals from per-100g values. */
export function macrosForGrams(
  kcal100: number | null | undefined,
  p100: number | null | undefined,
  c100: number | null | undefined,
  f100: number | null | undefined,
  grams: number,
): { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  const r = Math.max(0, grams) / 100;
  return {
    energy_kcal: Math.round(((kcal100 ?? 0) * r) * 10) / 10,
    protein_g: Math.round(((p100 ?? 0) * r) * 1000) / 1000,
    carbs_g: Math.round(((c100 ?? 0) * r) * 1000) / 1000,
    fat_g: Math.round(((f100 ?? 0) * r) * 1000) / 1000,
  };
}
