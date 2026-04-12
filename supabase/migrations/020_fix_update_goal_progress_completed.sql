-- Fix update_goal_progress: completed must reflect current_value vs target_value on every sync.
-- Preserve previous "completed" in RETURNING for push notification transition detection.

CREATE OR REPLACE FUNCTION public.update_goal_progress(
  p_user_id uuid,
  p_date date,
  p_goal_type text,
  p_current_value numeric
)
RETURNS TABLE(goal_id uuid, was_completed boolean, is_now_completed boolean) AS $$
BEGIN
  RETURN QUERY
  WITH prev AS (
    SELECT id, completed AS prev_completed
    FROM public.daily_goals
    WHERE user_id = p_user_id
      AND date = p_date
      AND goal_type = p_goal_type
      AND auto_track = true
  ),
  upd AS (
    UPDATE public.daily_goals d
    SET
      current_value = p_current_value,
      completed = (p_current_value >= d.target_value),
      updated_at = now()
    FROM prev p
    WHERE d.id = p.id
    RETURNING
      d.id AS gid,
      p.prev_completed,
      d.completed AS now_completed
  )
  SELECT
    upd.gid AS goal_id,
    upd.prev_completed AS was_completed,
    upd.now_completed AS is_now_completed
  FROM upd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
