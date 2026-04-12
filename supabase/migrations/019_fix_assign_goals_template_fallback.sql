-- ============================================================
-- Fix: assign_goals_for_date now falls back to goal_templates
-- when no admin goal_assignments exist for the user on that date.
--
-- Behavior:
--   1. Insert from active goal_assignments (admin-assigned) if any.
--   2. If ZERO rows inserted, fall back to active goal_templates.
-- This ensures new users always get default daily goals without
-- requiring an admin to manually create assignments first.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_goals_for_date(
  p_user_id uuid,
  p_date    date
)
RETURNS void AS $$
DECLARE
  v_inserted int;
BEGIN
  -- ── 1. Try admin-assigned goals ──────────────────────────────────
  INSERT INTO public.daily_goals (
    user_id, date, text, goal_type, target_value, target_unit,
    auto_track, sort_order, template_id
  )
  SELECT
    p_user_id,
    p_date,
    a.title,
    a.goal_type,
    a.target_value,
    a.target_unit,
    (a.goal_type != 'custom'),
    ROW_NUMBER() OVER (ORDER BY a.created_at),
    a.template_id
  FROM public.goal_assignments a
  WHERE a.user_id   = p_user_id
    AND a.is_active = true
    AND a.start_date <= p_date
    AND a.end_date   >= p_date
  ON CONFLICT (user_id, date, text) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- ── 2. Fallback to global templates if no assignments ────────────
  IF v_inserted = 0 THEN
    INSERT INTO public.daily_goals (
      user_id, date, text, goal_type, target_value, target_unit,
      auto_track, sort_order, template_id
    )
    SELECT
      p_user_id,
      p_date,
      t.title,
      t.goal_type,
      t.target_value,
      t.target_unit,
      (t.goal_type != 'custom'),
      t.sort_order,
      t.id
    FROM public.goal_templates t
    WHERE t.is_active = true
    ON CONFLICT (user_id, date, text) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
