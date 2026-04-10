-- ============================================
-- Training catalog: exercises, workouts, phases, days
-- Supports external APIs (e.g. ExerciseDB) via external_source + external_id
-- App reads templates; writes via service role or admin.
-- ============================================

-- ── 1. exercises — global library (cache metadata from API or manual) ──
CREATE TABLE IF NOT EXISTS public.exercises (
  id                text PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  external_source   text,                    -- e.g. 'exercisedb', 'manual'
  external_id       text,                    -- provider exercise id (string)
  slug              text UNIQUE,
  name              text NOT NULL,
  body_part         text,                    -- optional: chest, legs, etc.
  equipment         text[],                  -- optional tags
  image_url         text,
  video_url         text,
  instructions      text[],                  -- step lines
  metadata          jsonb NOT NULL DEFAULT '{}',  -- raw API payload, muscles, tips, etc.
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- If `exercises` already existed (older schema), CREATE TABLE above is a no-op — add missing columns.
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS body_part text,
  ADD COLUMN IF NOT EXISTS equipment text[],
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS instructions text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Catalog uses `text` ids: UUID strings, slugs, or provider keys (e.g. ExerciseDB) — not only uuid type.
DO $$
DECLARE
  id_type regtype;
  ex_type regtype;
  r RECORD;
BEGIN
  SELECT a.atttypid::regtype
  INTO id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'exercises'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND a.attname = 'id';

  IF id_type IS NULL THEN
    RETURN;
  END IF;

  -- Changing PK type requires dropping FKs that reference exercises.id first.
  FOR r IN
    SELECT c.conname, rel.relname AS tbl
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.confrelid = 'public.exercises'::regclass
      AND c.contype = 'f'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;

  IF id_type = 'uuid'::regtype THEN
    ALTER TABLE public.exercises
      ALTER COLUMN id TYPE text USING id::text;
  ELSIF id_type::text NOT IN ('text', 'character varying') THEN
    RAISE EXCEPTION
      'public.exercises.id has type % — expected text, character varying, or uuid',
      id_type;
  END IF;

  IF to_regclass('public.workout_exercises') IS NOT NULL THEN
    SELECT a.atttypid::regtype
    INTO ex_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'workout_exercises'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.attname = 'exercise_id';

    IF ex_type = 'uuid'::regtype THEN
      ALTER TABLE public.workout_exercises
        ALTER COLUMN exercise_id TYPE text USING exercise_id::text;
    END IF;
  END IF;
END $$;

-- One row per external provider id (ExerciseDB, etc.); manual rows may omit external_* 
CREATE UNIQUE INDEX IF NOT EXISTS exercises_external_unique
  ON public.exercises (external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises (name);
CREATE INDEX IF NOT EXISTS idx_exercises_external ON public.exercises (external_source, external_id);

COMMENT ON TABLE public.exercises IS 'Exercise catalog; sync from ExerciseDB or seed. workout_exercises references this.';

-- ── 2. training_phases — program blocks (e.g. Potencia Estructural) ──
CREATE TABLE IF NOT EXISTS public.training_phases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key   text DEFAULT 'default',      -- future white-label / multi-program
  phase_number  int NOT NULL DEFAULT 1,
  name          text NOT NULL,
  description   text,
  sort_order    int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_phases_program ON public.training_phases (program_key, sort_order);

-- ── 3. workouts — session templates (one row per “Pecho y Espalda”, etc.) ──
CREATE TABLE IF NOT EXISTS public.workouts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  workout_type   text NOT NULL DEFAULT 'fuerza'
    CHECK (workout_type IN ('fuerza', 'cardio', 'descanso', 'movilidad', 'tecnica')),
  duration_min   int CHECK (duration_min IS NULL OR duration_min >= 0),
  blocks         int NOT NULL DEFAULT 1 CHECK (blocks >= 1),
  calories_est   int CHECK (calories_est IS NULL OR calories_est >= 0),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workouts_type ON public.workouts (workout_type);

-- ── 4. workout_exercises — prescription per workout (sets/reps/order) ──
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id     uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id    text NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order     int NOT NULL DEFAULT 0,
  sets           int NOT NULL DEFAULT 3 CHECK (sets >= 1),
  reps           text NOT NULL DEFAULT '10',   -- "8-10" or "12"
  weight_kg      numeric(6,2),
  tempo          text,
  rest_seconds   int CHECK (rest_seconds IS NULL OR rest_seconds >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON public.workout_exercises (exercise_id);

-- Reattach FK if `workout_exercises` pre-existed and CREATE TABLE was skipped.
DO $$
BEGIN
  IF to_regclass('public.workout_exercises') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint c
       JOIN pg_class rel ON rel.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public'
         AND rel.relname = 'workout_exercises'
         AND c.contype = 'f'
         AND c.confrelid = 'public.exercises'::regclass
     ) THEN
    ALTER TABLE public.workout_exercises
      ADD CONSTRAINT workout_exercises_exercise_id_fkey
      FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. training_days — day N of phase → optional workout (null = rest) ──
CREATE TABLE IF NOT EXISTS public.training_days (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id      uuid NOT NULL REFERENCES public.training_phases(id) ON DELETE CASCADE,
  day_number    int NOT NULL CHECK (day_number >= 1 AND day_number <= 14),
  title         text NOT NULL,
  day_type      text NOT NULL DEFAULT 'fuerza'
    CHECK (day_type IN ('fuerza', 'cardio', 'descanso', 'tecnica', 'movilidad')),
  workout_id    uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phase_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_training_days_phase ON public.training_days (phase_id);

-- ── Triggers updated_at ──
CREATE TRIGGER on_exercises_updated
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_training_phases_updated
  BEFORE UPDATE ON public.training_phases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_workouts_updated
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_workout_exercises_updated
  BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_training_days_updated
  BEFORE UPDATE ON public.training_days
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS: authenticated read; admin write (catalog managed by backend/admin) ──
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises: select authenticated"
  ON public.exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_phases: select authenticated"
  ON public.training_phases FOR SELECT TO authenticated USING (true);

CREATE POLICY "workouts: select authenticated"
  ON public.workouts FOR SELECT TO authenticated USING (true);

CREATE POLICY "workout_exercises: select authenticated"
  ON public.workout_exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_days: select authenticated"
  ON public.training_days FOR SELECT TO authenticated USING (true);

-- Admin policies (requires profiles.role = 'admin' from migration 009)
CREATE POLICY "exercises: admin all"
  ON public.exercises FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "training_phases: admin all"
  ON public.training_phases FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "workouts: admin all"
  ON public.workouts FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "workout_exercises: admin all"
  ON public.workout_exercises FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "training_days: admin all"
  ON public.training_days FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
