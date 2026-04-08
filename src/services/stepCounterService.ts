import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { syncGoalProgress } from './goalsService';
import { sendGoalCompletedNotification } from './pushNotificationService';

/* ── Types ── */

export interface StepData {
  steps: number;
  available: boolean;
}

/* ── State ── */

let _subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
let _stepsAtMidnight = 0;  // pedometer count at start of day (baseline)
let _currentSteps = 0;

/* ── Public API ── */

/**
 * Check if the pedometer is available on this device.
 */
export async function isStepCounterAvailable(): Promise<boolean> {
  try {
    const result = await Pedometer.isAvailableAsync();
    return result;
  } catch {
    return false;
  }
}

/**
 * Get steps for today using historical query (more reliable).
 * Falls back to 0 if unavailable.
 */
export async function getStepsToday(): Promise<number> {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return 0;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const result = await Pedometer.getStepCountAsync(start, end);
    _currentSteps = result.steps;
    return result.steps;
  } catch (e) {
    console.error('stepCounter getStepsToday:', e);
    return 0;
  }
}

/**
 * Start watching step count in real time.
 * Calls onUpdate with the current step total every time it changes.
 * Also syncs goal progress automatically.
 */
export async function startStepTracking(
  onUpdate?: (steps: number) => void,
): Promise<boolean> {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return false;

    // Get today's total as baseline
    _currentSteps = await getStepsToday();
    onUpdate?.(_currentSteps);

    // Watch for new steps (returns incremental steps since subscription started)
    let stepsAtSubscriptionStart = _currentSteps;

    _subscription = Pedometer.watchStepCount((result) => {
      _currentSteps = stepsAtSubscriptionStart + result.steps;
      onUpdate?.(_currentSteps);

      // Sync with goals system (throttled internally)
      _debouncedGoalSync(_currentSteps);
    });

    return true;
  } catch (e) {
    console.error('stepCounter startTracking:', e);
    return false;
  }
}

/**
 * Stop watching step count.
 */
export function stopStepTracking(): void {
  if (_subscription) {
    _subscription.remove();
    _subscription = null;
  }
}

/**
 * Manually sync current steps to goal progress.
 * Useful when app comes to foreground.
 */
export async function syncStepsToGoal(): Promise<void> {
  const steps = await getStepsToday();
  if (steps > 0) {
    const result = await syncGoalProgress('steps', steps);
    if (result.newlyCompleted) {
      sendGoalCompletedNotification('Caminar 10,000 pasos', steps);
    }
  }
}

/* ── Internal: debounced goal sync ── */

let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function _debouncedGoalSync(steps: number): void {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    const result = await syncGoalProgress('steps', steps);
    if (result.newlyCompleted) {
      sendGoalCompletedNotification('Caminar 10,000 pasos', steps);
    }
  }, 5000); // Sync every 5 seconds max
}
