-- Cardio-specific fields on workout_logs (Registro cardio UI)
-- Nullable for fuerza / sesiones sin datos de cardio.

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS cardio_activity text,
  ADD COLUMN IF NOT EXISTS distance numeric(12, 4),
  ADD COLUMN IF NOT EXISTS distance_unit text,
  ADD COLUMN IF NOT EXISTS duration_seconds int;

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_cardio_activity_check;

ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_cardio_activity_check
  CHECK (
    cardio_activity IS NULL
    OR cardio_activity IN ('running', 'walking', 'cycling', 'rowing', 'elliptical')
  );

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_distance_unit_check;

ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_distance_unit_check
  CHECK (distance_unit IS NULL OR distance_unit IN ('km', 'mi'));

ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_duration_seconds_check;

ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_duration_seconds_check
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

COMMENT ON COLUMN public.workout_logs.cardio_activity IS 'Tipo de actividad cardio (UI registro); NULL si no aplica.';
COMMENT ON COLUMN public.workout_logs.distance IS 'Distancia recorrida en la unidad indicada por distance_unit.';
COMMENT ON COLUMN public.workout_logs.distance_unit IS 'km | mi';
COMMENT ON COLUMN public.workout_logs.duration_seconds IS 'Duración total exacta en segundos; complementa duration_min.';
