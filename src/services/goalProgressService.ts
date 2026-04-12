/**
 * Goal Progress Service
 *
 * Central orchestrator that syncs data from hydration, meals, training,
 * and steps into the goals system. Import and call these after each save.
 */

import { supabase } from '../lib/supabase';
import { syncGoalProgress } from './goalsService';
import { sendGoalCompletedNotification } from './pushNotificationService';
import { todayISO } from '../utils/dateUtils';

/* ── Helpers ── */

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/**
 * After notifying that a goal was completed, call the Edge Function
 * to also send a remote push (for when app is closed).
 */
async function triggerRemotePush(goalTitle: string, goalType: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  try {
    await supabase.functions.invoke('push-goal-completed', {
      body: { user_id: userId, goal_title: goalTitle, goal_type: goalType },
    });
  } catch (e) {
    // Non-blocking; local notification already sent
    console.error('Remote push trigger failed:', e);
  }
}

/* ── Sync Functions ── */

/**
 * Call after saving hydration. Syncs total_ml to the hydration goal.
 */
export async function syncHydrationGoal(totalMl: number, date?: string): Promise<void> {
  const dateStr = date ?? todayISO();
  const result = await syncGoalProgress('hydration', totalMl, dateStr);

  if (result.newlyCompleted) {
    const liters = (totalMl / 1000).toFixed(1);
    await sendGoalCompletedNotification(`Hidratación: ${liters}L`);
    triggerRemotePush(`Hidratación: ${liters}L`, 'hydration');
  }
}

/**
 * Call after saving a meal. Counts total meals for the date and syncs.
 */
export async function syncMealsGoal(date?: string): Promise<void> {
  const dateStr = date ?? todayISO();
  const userId = await getUserId();
  if (!userId) return;

  // Count meals registered for this date
  const { count, error } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', dateStr);

  if (error) {
    console.error('syncMealsGoal count error:', error.message);
    return;
  }

  const mealCount = count ?? 0;
  const result = await syncGoalProgress('meals', mealCount, dateStr);

  if (result.newlyCompleted) {
    await sendGoalCompletedNotification(`Registrar ${mealCount} comidas`);
    triggerRemotePush(`Registrar ${mealCount} comidas`, 'meals');
  }
}

/**
 * Call after saving or deleting workout logs. Syncs session count for the day.
 */
export async function syncTrainingGoal(date?: string): Promise<void> {
  const dateStr = date ?? todayISO();
  const userId = await getUserId();
  if (!userId) return;

  const { count, error } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', dateStr)
    .eq('completed', true);

  if (error) {
    console.error('syncTrainingGoal count:', error.message);
    return;
  }

  const n = count ?? 0;
  const result = await syncGoalProgress('training', n, dateStr);

  if (result.newlyCompleted) {
    await sendGoalCompletedNotification('Entrenamiento completado');
    triggerRemotePush('Entrenamiento completado', 'training');
  }
}

/**
 * Call after step count updates. Syncs current steps to the steps goal.
 */
export async function syncStepsGoal(steps: number, date?: string): Promise<void> {
  const dateStr = date ?? todayISO();
  const result = await syncGoalProgress('steps', steps, dateStr);

  if (result.newlyCompleted) {
    await sendGoalCompletedNotification(`Caminar ${steps.toLocaleString()} pasos`);
    triggerRemotePush(`Caminar ${steps.toLocaleString()} pasos`, 'steps');
  }
}

/**
 * Full sync: re-calculate progress for ALL goal types for a given date.
 * Useful on app startup or when coming back to foreground.
 */
export async function syncAllGoalsForDate(date?: string): Promise<void> {
  const dateStr = date ?? todayISO();
  const userId = await getUserId();
  if (!userId) return;

  // 1. Hydration (always sync so zeros clear stale current_value)
  const { data: hydration } = await supabase
    .from('hydration_logs')
    .select('total_ml')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  const totalMl = hydration?.total_ml ?? 0;
  await syncGoalProgress('hydration', totalMl, dateStr);

  // 2. Meals
  const { count: mealCount } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', dateStr);

  await syncGoalProgress('meals', mealCount ?? 0, dateStr);

  // 3. Training — completed sessions only (matches syncTrainingGoal)
  const { count: workoutCount } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', dateStr)
    .eq('completed', true);

  await syncGoalProgress('training', workoutCount ?? 0, dateStr);

  // 4. Steps (done separately via stepCounterService on app open)
}
