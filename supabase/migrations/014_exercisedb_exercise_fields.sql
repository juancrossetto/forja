-- ExerciseDB v2–friendly columns (see https://github.com/exercisedb/exercisedb-api).
-- Raw payload remains in `metadata`; these speed up filters and reporting.

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS body_parts text[],
  ADD COLUMN IF NOT EXISTS target_muscles text[],
  ADD COLUMN IF NOT EXISTS secondary_muscles text[],
  ADD COLUMN IF NOT EXISTS exercise_type text,
  ADD COLUMN IF NOT EXISTS gender text;

CREATE INDEX IF NOT EXISTS idx_exercises_body_parts ON public.exercises USING GIN (body_parts);

COMMENT ON COLUMN public.exercises.external_id IS 'Provider id, e.g. ExerciseDB v2 exerciseId (exr_…).';
COMMENT ON COLUMN public.exercises.body_parts IS 'ExerciseDB bodyParts[] (e.g. CHEST, BACK).';
COMMENT ON COLUMN public.exercises.exercise_type IS 'ExerciseDB exerciseType (e.g. STRENGTH).';
COMMENT ON COLUMN public.exercises.metadata IS 'Full provider JSON; ExerciseDB v2 sample in repo README.';
