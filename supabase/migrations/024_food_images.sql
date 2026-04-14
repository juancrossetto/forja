-- ── 024_food_images.sql ─────────────────────────────────────────────────────
-- Agrega image_url a la tabla foods y crea el bucket food-images en storage.
-- Las imágenes se suben desde la app (expo-image-picker) y se guardan en
-- storage/{userId}/{foodId}.{ext}. La URL pública se almacena en foods.image_url.

-- 1. Columna en la tabla
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.foods.image_url
  IS 'URL pública de la imagen del alimento en storage bucket food-images. Nulo si no tiene imagen asignada.';

-- 2. Bucket (público — las URLs se sirven directamente desde CDN de Supabase)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'food-images',
  'food-images',
  true,
  5242880,   -- 5 MB por imagen
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS — lectura pública (URLs en <img> sin auth)
CREATE POLICY "food_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'food-images');

-- 4. RLS — escritura solo del propietario (carpeta = user_id)
CREATE POLICY "food_images_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'food-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "food_images_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'food-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "food_images_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'food-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
