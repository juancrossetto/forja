-- ── 025_food_image_key.sql ──────────────────────────────────────────────────
-- Agrega image_key para referenciar imágenes del catálogo compartido.
--
-- Estructura del bucket food-images:
--   shared/pollo-plancha.webp     ← imagen compartida por muchos alimentos
--   shared/arroz-blanco.webp
--   {userId}/{foodId}.webp        ← imagen personalizada (ya existente desde 024)
--
-- image_key almacena el path dentro del bucket, ej: "shared/pollo-plancha.webp"
-- resolveImageUrl() en la app prioriza: image_url > image_key > null

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS image_key text;

COMMENT ON COLUMN public.foods.image_key
  IS 'Path dentro del bucket food-images que referencia una imagen del catálogo compartido (ej: shared/pollo-plancha.webp). Permite que muchos alimentos compartan la misma imagen sin duplicar storage.';

CREATE INDEX IF NOT EXISTS idx_foods_image_key
  ON public.foods (image_key)
  WHERE image_key IS NOT NULL;
