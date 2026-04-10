/**
 * Resolves exercise image URLs from Supabase rows (`image_url` + optional `metadata` paths).
 * Optional env (first non-empty): EXPO_PUBLIC_EXERCISE_MEDIA_BASE_URL or EXPO_PUBLIC_EXERCISEDB_MEDIA_BASE_URL.
 */
function mediaBaseFromEnv(): string {
  const a = process.env.EXPO_PUBLIC_EXERCISE_MEDIA_BASE_URL?.trim();
  const b = process.env.EXPO_PUBLIC_EXERCISEDB_MEDIA_BASE_URL?.trim();
  const raw = (a && a.length > 0 ? a : b) ?? '';
  return raw.length > 0 ? raw.replace(/\/$/, '') : 'https://cdn.exercisedb.dev';
}

export const DEFAULT_EXERCISE_MEDIA_BASE = mediaBaseFromEnv();

/** If `path` is already absolute, return as-is. Otherwise join with public media base. */
export function resolveExerciseMediaUrl(
  path: string | undefined | null,
  baseUrl: string = mediaBaseFromEnv(),
): string | null {
  if (path == null || path === '') return null;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = baseUrl.replace(/\/$/, '');
  const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}

type ExerciseMetadataForMedia = {
  gifUrl?: string;
  imageUrl?: string;
} | null;

function mediaFromMetadata(metadata: unknown): string | null {
  const m = metadata as ExerciseMetadataForMedia;
  if (!m || typeof m !== 'object') return null;
  const raw = m.gifUrl ?? m.imageUrl;
  if (typeof raw === 'string' && raw.length > 0) {
    return resolveExerciseMediaUrl(raw);
  }
  return null;
}

/**
 * Image URL for UI when reading from Supabase.
 * Prefer paths in `metadata` (gifUrl / imageUrl); then `image_url`.
 */
export function exerciseImageUrlForApp(row: {
  image_url: string | null | undefined;
  metadata: unknown;
}): string | null {
  const fromMeta = mediaFromMetadata(row.metadata);
  if (fromMeta) return fromMeta;
  if (row.image_url && row.image_url.length > 0) return row.image_url;
  return null;
}
