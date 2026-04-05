import { supabase } from '../lib/supabase';

export interface DailyGoal {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
  sort_order: number;
}

// Default goals for a new day
const DEFAULT_GOALS = [
  { text: '2.5L de Agua', sort_order: 0 },
  { text: 'Meditación 10 min', sort_order: 1 },
  { text: 'Caminar 10,000 pasos', sort_order: 2 },
  { text: 'Sin azúcar procesada', sort_order: 3 },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch goals for a specific date. If none exist, create defaults.
 */
export async function getGoalsForDate(date: Date): Promise<DailyGoal[]> {
  const dateStr = formatDate(date);

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return [];

  // Fetch existing goals
  const { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching goals:', error.message);
    return [];
  }

  // If no goals for this date, create defaults
  if (!data || data.length === 0) {
    const newGoals = DEFAULT_GOALS.map((g) => ({
      user_id: userId,
      date: dateStr,
      text: g.text,
      completed: false,
      sort_order: g.sort_order,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('daily_goals')
      .insert(newGoals)
      .select();

    if (insertError) {
      console.error('Error creating default goals:', insertError.message);
      // Return local defaults as fallback
      return DEFAULT_GOALS.map((g, i) => ({
        id: `local-${i}`,
        user_id: userId,
        date: dateStr,
        text: g.text,
        completed: false,
        sort_order: g.sort_order,
      }));
    }

    return inserted ?? [];
  }

  return data;
}

/**
 * Toggle a goal's completed status
 */
export async function toggleGoal(goalId: string, completed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('daily_goals')
    .update({ completed })
    .eq('id', goalId);

  if (error) {
    console.error('Error toggling goal:', error.message);
    return false;
  }
  return true;
}

/**
 * Add a custom goal for a date
 */
export async function addGoal(date: Date, text: string): Promise<DailyGoal | null> {
  const dateStr = formatDate(date);

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('daily_goals')
    .insert({
      user_id: userId,
      date: dateStr,
      text,
      completed: false,
      sort_order: 99,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding goal:', error.message);
    return null;
  }

  return data;
}

/**
 * Delete a goal
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
