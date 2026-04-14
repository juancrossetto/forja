import { supabase } from '../lib/supabase';
import { fetchOpenFoodFactsByBarcode } from './openFoodFactsService';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

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
  /** Catálogo personal: favorito (columna en DB tras migración 023) */
  is_favorite?: boolean | null;
  /** URL pública de imagen personalizada (upload propio, migración 024) */
  image_url?: string | null;
  /**
   * Path dentro del bucket food-images que referencia el catálogo compartido.
   * Ej: "shared/pollo-plancha.webp"  (migración 025)
   * resolveImageUrl() prioriza image_url > image_key > null
   */
  image_key?: string | null;
  created_at: string;
  updated_at: string;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

export type SearchFoodsOptions = {
  favoritesOnly?: boolean;
};

export async function searchFoods(
  query: string,
  limit = 40,
  opts?: SearchFoodsOptions,
): Promise<FoodRow[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const q = query.trim();
  const fav = opts?.favoritesOnly === true;

  let req = supabase.from('foods').select('*').eq('user_id', userId);
  if (fav) {
    req = req.eq('is_favorite', true);
  }
  if (!q) {
    const { data, error } = await req
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('foods search:', error.message);
      return [];
    }
    return (data ?? []) as FoodRow[];
  }

  const { data, error } = await req
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('foods search:', error.message);
    return [];
  }
  return (data ?? []) as FoodRow[];
}

/** Persiste favorito; devuelve la fila actualizada o null si falla. */
export async function setFoodFavorite(id: string, isFavorite: boolean): Promise<FoodRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('foods')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) {
    console.error('setFoodFavorite:', error.message);
    return null;
  }
  return data as FoodRow;
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
  return resolveOrCreateFoodFromBarcodeWithImage(barcode, null);
}

/** Igual que resolveOrCreateFoodFromBarcode pero permite fijar image_key al crear un nuevo alimento. */
export async function resolveOrCreateFoodFromBarcodeWithImage(
  barcode: string,
  imageKey: string | null,
): Promise<FoodRow | null> {
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
    image_key: imageKey,
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
  image_key?: string | null;
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
      image_key: payload.image_key ?? null,
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

// ── Catálogo compartido de imágenes ─────────────────────────────────────────

/** Extensiones de imagen reconocidas como parte del catálogo */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTS.has(ext);
}

/** Construye la URL pública de una imagen del catálogo dado su key (nombre de archivo en la raíz del bucket). */
export function sharedImageUrl(imageKey: string): string {
  const { data } = supabase.storage.from('food-images').getPublicUrl(imageKey);
  return data.publicUrl;
}

/**
 * Resuelve la URL de imagen de un alimento con prioridad:
 *   1. image_url  → foto personalizada subida por el usuario
 *   2. image_key  → imagen del catálogo compartido
 *   3. null       → sin imagen (mostrar placeholder)
 */
export function resolveImageUrl(food: Pick<FoodRow, 'image_url' | 'image_key'>): string | null {
  if (food.image_url) return food.image_url;
  if (food.image_key) return sharedImageUrl(food.image_key);
  return null;
}

export interface SharedFoodImage {
  /** Path completo dentro del bucket, ej: "shared/pollo-plancha.webp" */
  key: string;
  /** Nombre legible sin extensión, ej: "pollo plancha" */
  label: string;
  /** URL pública lista para usar en <Image> */
  url: string;
}

/** Lista todas las imágenes del catálogo (raíz del bucket food-images). Se cachea en memoria. */
let _sharedCache: SharedFoodImage[] | null = null;
export async function listSharedFoodImages(): Promise<SharedFoodImage[]> {
  if (_sharedCache) return _sharedCache;

  const { data, error } = await supabase.storage
    .from('food-images')
    .list('', { limit: 500, sortBy: { column: 'name', order: 'asc' } });

  if (error || !data) {
    console.error('listSharedFoodImages:', error?.message);
    return [];
  }

  const images: SharedFoodImage[] = data
    // Excluir carpetas de usuarios (UUID) y archivos ocultos; incluir solo imágenes
    .filter((f) => f.name && !f.name.startsWith('.') && isImageFile(f.name))
    .map((f) => {
      const key = f.name;                                           // ej: "banana.png"
      const label = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      return { key, label, url: sharedImageUrl(key) };
    });

  _sharedCache = images;
  return images;
}

/** Invalida el cache de imágenes compartidas (útil tras subir nuevas desde otro cliente). */
export function invalidateSharedImagesCache(): void {
  _sharedCache = null;
}

/** Asigna un image_key del catálogo a un alimento (limpia image_url para evitar conflicto visual). */
export async function setFoodImageKey(
  foodId: string,
  imageKey: string | null,
): Promise<FoodRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('foods')
    .update({ image_key: imageKey, image_url: null, updated_at: new Date().toISOString() })
    .eq('id', foodId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) { console.error('setFoodImageKey:', error.message); return null; }
  return data as FoodRow;
}

/**
 * Sube una imagen local al bucket food-images y actualiza image_url en la tabla.
 * Path: {userId}/{foodId}.{ext}  — sobreescribe si ya existía.
 * Devuelve la fila actualizada o null si falla.
 */
export async function uploadFoodImage(
  foodId: string,
  localUri: string,
): Promise<FoodRow | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const userId = session.user.id;

  // Detectar extensión y MIME desde la URI
  const rawExt = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const ext  = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${userId}/${foodId}.${ext}`;

  // Eliminar archivo previo (mismo path = reemplaza)
  await supabase.storage.from('food-images').remove([path]);

  // Leer como base64 → ArrayBuffer (patrón del resto de la app)
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(path, arrayBuffer, { contentType: mime, upsert: true });

  if (uploadError) {
    console.error('uploadFoodImage storage:', uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(path);
  // Cache-bust para que React Native no muestre la imagen anterior cacheada
  const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from('foods')
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', foodId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('uploadFoodImage db update:', error.message);
    return null;
  }
  return data as FoodRow;
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
