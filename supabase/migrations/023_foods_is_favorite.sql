-- Favoritos por alimento en la lista personal del usuario

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.foods.is_favorite IS 'Marcado por el usuario en el catálogo personal; filtrable en Buscar.';

CREATE INDEX IF NOT EXISTS idx_foods_user_favorite
  ON public.foods (user_id, is_favorite)
  WHERE is_favorite = true;
