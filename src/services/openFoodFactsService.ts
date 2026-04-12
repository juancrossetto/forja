/**
 * Open Food Facts API (read-only). Database is ODbL — attribute in UI.
 * https://wiki.openfoodfacts.org/API
 * Use a descriptive User-Agent (required by OFF).
 */

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'MetodoR3SET/1.0 (https://github.com/forja; nutrition)';

export type OpenFoodFactsProduct = {
  code: string;
  name: string;
  brand: string | null;
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
};

type OffNutriments = Record<string, number | string | undefined>;

function num(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Fetches product by barcode. Returns null if not found or network error. */
export async function fetchOpenFoodFactsByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const code = barcode.trim().replace(/\s/g, '');
  if (!code) return null;

  const url = `${OFF_BASE}/${encodeURIComponent(code)}?fields=product_name,brands,nutriments,nutrition_data_per`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        brands?: string;
        nutriments?: OffNutriments;
      };
    };
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const n = p.nutriments ?? {};

    return {
      code,
      name: (p.product_name ?? 'Producto').trim() || 'Producto',
      brand: p.brands?.trim() ? p.brands.trim() : null,
      kcal_100g: num(n['energy-kcal_100g'] ?? n['energy-kcal']),
      protein_g_100g: num(n.proteins_100g ?? n.proteins),
      carbs_g_100g: num(n.carbohydrates_100g ?? n.carbohydrates),
      fat_g_100g: num(n.fat_100g ?? n.fat),
    };
  } catch (e) {
    console.warn('Open Food Facts fetch:', e);
    return null;
  }
}
