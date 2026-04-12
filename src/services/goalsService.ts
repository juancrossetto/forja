import { supabase } from '../lib/supabase';

/* ── Types ── */

export type GoalType = 'hydration' | 'steps' | 'training' | 'meals' | 'custom';
export type TargetUnit = 'ml' | 'steps' | 'minutes' | 'meals' | 'boolean';

export interface DailyGoal {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD
  text: string;
  completed: boolean;
  sort_order: number;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  target_unit: TargetUnit;
  auto_track: boolean;
  template_id: string | null;
}

export interface GoalTemplate {
  id: string;
  title: string;
  goal_type: GoalType;
  target_value: number;
  target_unit: TargetUnit;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

/* ── Helpers ── */

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/* ── Core API ── */

/**
 * Fetch goals for a specific date.
 * If none exist, assigns from active templates via DB function.
 */
export async function getGoalsForDate(date: Date): Promise<DailyGoal[]> {
  const dateStr = date.toISOString().split('T')[0];
  const userId = await getUserId();
  if (!userId) return [];

  // Try fetching existing goals
  let { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching goals:', error.message);
    return [];
  }

  // No goals for this date → assign from templates
  if (!data || data.length === 0) {
    const { error: assignErr } = await supabase.rpc('assign_goals_for_date', {
      p_user_id: userId,
      p_date: dateStr,
    });

    // 23505 = filas ya existentes (carrera o migración antigua); seguimos y re-fetch
    const isDuplicate =
      assignErr?.code === '23505' ||
      assignErr?.message?.includes('duplicate key') === true;

    if (assignErr && !isDuplicate) {
      console.error('Error assigning template goals:', assignErr.message);
      return [];
    }

    // Re-fetch after assignment
    const result = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .order('sort_order', { ascending: true });

    data = result.data;
    if (result.error) {
      console.error('Error re-fetching goals:', result.error.message);
      return [];
    }
  }

  return (data ?? []).map(normalizeGoal);
}

/**
 * Toggle a goal's completed status.
 * For auto_track goals, also sets current_value = target_value when checked.
 */
export async function toggleGoal(goalId: string, completed: boolean): Promise<boolean> {
  // First get the goal to know if it's auto-tracked
  const { data: goal } = await supabase
    .from('daily_goals')
    .select('auto_track, target_value')
    .eq('id', goalId)
    .single();

  const updatePayload: Record<string, unknown> = { completed };

  // If manually completing an auto-track goal, set current_value = target_value
  if (goal?.auto_track && completed) {
    updatePayload.current_value = goal.target_value;
  }
  // If manually un-completing an auto-track goal, don't reset current_value
  // (the real data still exists)

  const { error } = await supabase
    .from('daily_goals')
    .update(updatePayload)
    .eq('id', goalId);

  if (error) {
    console.error('Error toggling goal:', error.message);
    return false;
  }
  return true;
}

/**
 * Add a custom goal for a date.
 */
export async function addGoal(date: Date, text: string): Promise<DailyGoal | null> {
  const dateStr = date.toISOString().split('T')[0];
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('daily_goals')
    .insert({
      user_id: userId,
      date: dateStr,
      text,
      completed: false,
      sort_order: 99,
      goal_type: 'custom',
      target_value: 1,
      current_value: 0,
      target_unit: 'boolean',
      auto_track: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding goal:', error.message);
    return null;
  }
  return data ? normalizeGoal(data) : null;
}

/**
 * Delete a goal.
 */
export async function deleteGoal(goalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('daily_goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    console.error('Error deleting goal:', error.message);
    return false;
  }
  return true;
}

/* ── Progress Sync ── */

/**
 * Update the current_value of an auto-track goal for a given type + date.
 * Returns true if any goal was newly completed (for push notification trigger).
 */
export async function syncGoalProgress(
  goalType: GoalType,
  currentValue: number,
  date?: string,
): Promise<{ newlyCompleted: boolean; goalId: string | null }> {
  const userId = await getUserId();
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  if (!userId) return { newlyCompleted: false, goalId: null };

  const { data, error } = await supabase.rpc('update_goal_progress', {
    p_user_id: userId,
    p_date: dateStr,
    p_goal_type: goalType,
    p_current_value: currentValue,
  });

  if (error) {
    console.error('Error syncing goal progress:', error.message);
    return { newlyCompleted: false, goalId: null };
  }

  // Check if any goal went from not-completed to completed
  const rows = data as { goal_id: string; was_completed: boolean; is_now_completed: boolean }[];
  const newlyDone = rows?.find((r) => r.is_now_completed && !r.was_completed);

  return {
    newlyCompleted: !!newlyDone,
    goalId: newlyDone?.goal_id ?? null,
  };
}

/**
 * Get all active goal templates (for display or admin reference).
 */
export async function getGoalTemplates(): Promise<GoalTemplate[]> {
  const { data, error } = await supabase
    .from('goal_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching templates:', error.message);
    return [];
  }
  return data ?? [];
}

/* ── Internal ── */

function normalizeGoal(raw: Record<string, unknown>): DailyGoal {
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    date: raw.date as string,
    text: raw.text as string,
    completed: raw.completed as boolean,
    sort_order: (raw.sort_order as number) ?? 0,
    goal_type: (raw.goal_type as GoalType) ?? 'custom',
    target_value: Number(raw.target_value ?? 1),
    current_value: Number(raw.current_value ?? 0),
    target_unit: (raw.target_unit as TargetUnit) ?? 'boolean',
    auto_track: (raw.auto_track as boolean) ?? false,
    template_id: (raw.template_id as string) ?? null,
  };
}
