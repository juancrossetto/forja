-- ============================================
-- Goal Assignments — admin asigna metas a usuarios con rango de fechas
-- Run in Supabase SQL Editor
-- ============================================

-- ─── 1. goal_assignments ───
-- El admin crea una asignación: meta → usuario → período

CREATE TABLE IF NOT EXISTS public.goal_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- admin que la asignó

  -- Qué meta es (puede venir de template o ser completamente custom)
  template_id uuid REFERENCES public.goal_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  goal_type text NOT NULL DEFAULT 'custom'
    CHECK (goal_type IN ('hydration','steps','training','meals','custom')),
  target_value numeric NOT NULL DEFAULT 1,
  target_unit text NOT NULL DEFAULT 'boolean'
    CHECK (target_unit IN ('ml','steps','minutes','meals','boolean')),
  icon text DEFAULT 'star',
  color text DEFAULT '#D1FF26',

  -- Período de la asignación
  start_date date NOT NULL,
  end_date date NOT NULL,

  -- Estado
  is_active boolean DEFAULT true,
  notes text,  -- nota privada del admin

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_goal_assignments_user ON public.goal_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_dates ON public.goal_assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_active ON public.goal_assignments(user_id, is_active, start_date, end_date);

ALTER TABLE public.goal_assignments ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propias asignaciones
CREATE POLICY "Users can view own assignments"
  ON public.goal_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins pueden ver y gestionar todas
CREATE POLICY "Admins can manage all assignments"
  ON public.goal_assignments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger updated_at
CREATE TRIGGER on_goal_assignments_updated
  BEFORE UPDATE ON public.goal_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 2. Función actualizada: generar daily_goals desde assignments activos ───
-- Reemplaza assign_template_goals — ahora mira las asignaciones del admin

CREATE OR REPLACE FUNCTION public.assign_goals_for_date(
  p_user_id uuid,
  p_date date
)
RETURNS void AS $$
BEGIN
  -- Insertar en daily_goals los assignments activos para ese día
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
    a.goal_type != 'custom',  -- auto_track para tipos no-custom
    ROW_NUMBER() OVER (ORDER BY a.created_at),
    a.template_id
  FROM public.goal_assignments a
  WHERE a.user_id = p_user_id
    AND a.is_active = true
    AND a.start_date <= p_date
    AND a.end_date >= p_date
  ON CONFLICT (user_id, date, text) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mantener la función vieja como alias por retrocompatibilidad
CREATE OR REPLACE FUNCTION public.assign_template_goals(
  p_user_id uuid,
  p_date date
)
RETURNS void AS $$
BEGIN
  PERFORM public.assign_goals_for_date(p_user_id, p_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. Vista útil para el admin: assignments con nombre del usuario ───

CREATE OR REPLACE VIEW public.v_goal_assignments_admin AS
SELECT
  a.id,
  a.user_id,
  p.full_name AS user_name,
  u.email AS user_email,
  a.title,
  a.goal_type,
  a.target_value,
  a.target_unit,
  a.color,
  a.icon,
  a.start_date,
  a.end_date,
  a.is_active,
  a.notes,
  a.assigned_by,
  a.template_id,
  a.created_at,
  -- Estado calculado
  CASE
    WHEN NOT a.is_active THEN 'inactiva'
    WHEN a.end_date < CURRENT_DATE THEN 'vencida'
    WHEN a.start_date > CURRENT_DATE THEN 'futura'
    ELSE 'activa'
  END AS status
FROM public.goal_assignments a
LEFT JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;
