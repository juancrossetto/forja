-- Evita error duplicate key en assign_goals_for_date:
-- 1) Varias goal_assignments con el mismo title para el mismo usuario/fecha generaban
--    varias filas idénticas (user_id, date, text) en un solo INSERT.
-- 2) Refuerza ON CONFLICT por si la función desplegada era una versión antigua sin él.

CREATE OR REPLACE FUNCTION public.assign_goals_for_date(
  p_user_id uuid,
  p_date date
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_goals (
    user_id, date, text, goal_type, target_value, target_unit,
    auto_track, sort_order, template_id
  )
  WITH picked AS (
    SELECT DISTINCT ON (a.title)
      a.title,
      a.goal_type,
      a.target_value,
      a.target_unit,
      a.template_id,
      a.created_at
    FROM public.goal_assignments a
    WHERE a.user_id = p_user_id
      AND a.is_active = true
      AND a.start_date <= p_date
      AND a.end_date >= p_date
    ORDER BY a.title, a.created_at ASC
  )
  SELECT
    p_user_id,
    p_date,
    p.title,
    p.goal_type,
    p.target_value,
    p.target_unit,
    p.goal_type != 'custom',
    ROW_NUMBER() OVER (ORDER BY p.created_at),
    p.template_id
  FROM picked p
  ON CONFLICT (user_id, date, text) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
