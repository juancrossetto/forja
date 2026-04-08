-- ============================================
-- Goals V2: auto-trackable goals + push tokens
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- ─── 1. Goal Templates (admin-managed from dashboard) ───

CREATE TABLE IF NOT EXISTS public.goal_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,                                       -- e.g. '2.5L de Agua'
  goal_type text NOT NULL CHECK (goal_type IN (
    'hydration', 'steps', 'training', 'meals', 'custom'
  )),
  target_value numeric NOT NULL DEFAULT 1,                   -- e.g. 2500 (ml), 10000 (steps)
  target_unit text NOT NULL DEFAULT 'boolean'                -- 'ml','steps','minutes','meals','boolean'
    CHECK (target_unit IN ('ml','steps','minutes','meals','boolean')),
  icon text DEFAULT 'target',                                -- MaterialCommunityIcons name
  color text DEFAULT '#D1FF26',                              -- hex color
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users, writable only via service_role (admin dashboard)
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.goal_templates;
CREATE POLICY "Authenticated users can read templates"
  ON public.goal_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── 2. Alter daily_goals to support auto-tracking ───

-- Add new columns (safe if they already exist, we use IF NOT EXISTS pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'goal_type'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN goal_type text DEFAULT 'custom'
      CHECK (goal_type IN ('hydration','steps','training','meals','custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'target_value'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN target_value numeric DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'current_value'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN current_value numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'target_unit'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN target_unit text DEFAULT 'boolean'
      CHECK (target_unit IN ('ml','steps','minutes','meals','boolean'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'auto_track'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN auto_track boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_goals' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.daily_goals ADD COLUMN template_id uuid REFERENCES public.goal_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for quick lookup by type (useful for progress syncing)
CREATE INDEX IF NOT EXISTS idx_daily_goals_type ON public.daily_goals(user_id, date, goal_type);

-- ─── 3. Push tokens table ───

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expo_token text NOT NULL,
  device_id text,          -- to differentiate multiple devices
  platform text,           -- 'ios' | 'android'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(user_id, expo_token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
  ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens"
  ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tokens"
  ON public.push_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tokens"
  ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER on_goal_templates_updated
  BEFORE UPDATE ON public.goal_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_push_tokens_updated
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 4. DB function: update goal progress and auto-complete ───

CREATE OR REPLACE FUNCTION public.update_goal_progress(
  p_user_id uuid,
  p_date date,
  p_goal_type text,
  p_current_value numeric
)
RETURNS TABLE(goal_id uuid, was_completed boolean, is_now_completed boolean) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.daily_goals
  SET
    current_value = p_current_value,
    completed = CASE WHEN p_current_value >= target_value THEN true ELSE completed END,
    updated_at = now()
  WHERE user_id = p_user_id
    AND date = p_date
    AND goal_type = p_goal_type
    AND auto_track = true
  RETURNING
    id AS goal_id,
    (completed AND current_value < target_value) AS was_completed,  -- was already completed before
    (p_current_value >= target_value) AS is_now_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. DB function: assign template goals to a user for a date ───

CREATE OR REPLACE FUNCTION public.assign_template_goals(
  p_user_id uuid,
  p_date date
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_goals (user_id, date, text, goal_type, target_value, target_unit, auto_track, sort_order, template_id)
  SELECT
    p_user_id,
    p_date,
    t.title,
    t.goal_type,
    t.target_value,
    t.target_unit,
    t.goal_type != 'custom',  -- auto_track for all except custom
    t.sort_order,
    t.id
  FROM public.goal_templates t
  WHERE t.is_active = true
  ON CONFLICT (user_id, date, text) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. Seed default templates (admin can modify later from dashboard) ───

INSERT INTO public.goal_templates (title, goal_type, target_value, target_unit, icon, color, sort_order)
VALUES
  ('2.5L de Agua',          'hydration', 2500, 'ml',      'cup-water',  '#00e3fd', 0),
  ('Caminar 10,000 pasos',  'steps',     10000,'steps',   'walk',       '#D1FF26', 1),
  ('Entrenar',               'training',  1,    'boolean', 'dumbbell',   '#ff734a', 2),
  ('Registrar 3 comidas',    'meals',     3,    'meals',   'food-apple', '#a78bfa', 3)
ON CONFLICT DO NOTHING;
