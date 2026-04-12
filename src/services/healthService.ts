/**
 * healthService.ts
 *
 * HealthKit integration via react-native-health (iOS) + expo-sensors Pedometer.
 *
 * ## Data sources
 *   - Steps:      expo-sensors Pedometer  (real-time, works in managed workflow)
 *   - Heart rate: react-native-health     (last sample from HealthKit, requires EAS Build)
 *   - Calories:   react-native-health     (active energy burned today, requires EAS Build)
 *
 * ## Important
 *   react-native-health only works in native builds (EAS Build / expo prebuild).
 *   It will not run in Expo Go. The service handles this gracefully by catching
 *   the native module error and returning null for HR/calories.
 */

import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AppleHealthKit from 'react-native-health';
import type { HealthKitPermissions, HealthPermission } from 'react-native-health';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type HealthPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unavailable';

export interface HealthPermissions {
  steps: HealthPermissionStatus;
  heartRate: HealthPermissionStatus;
  calories: HealthPermissionStatus;
}

export interface HealthSummary {
  steps: number | null;
  heartRate: number | null;      // bpm, last sample today
  calories: number | null;       // kcal active energy burned today
  lastSyncedAt: Date | null;
}

export interface HealthStatus {
  available: boolean;
  permissions: HealthPermissions;
}

/* ── Internal state ─────────────────────────────────────────────────────── */

let _hkInitialized = false;
let _stepSubscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
let _stepsAtSubscriptionStart = 0;

/* ── HealthKit permissions requested ─────────────────────────────────────── */

// Los valores coinciden con HealthPermission del .d.ts; el paquete no re-exporta
// ese enum en runtime (solo default export), así que usamos literales.
const HK_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: ['Steps', 'HeartRate', 'ActiveEnergyBurned'] as HealthPermission[],
    write: [],
  },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Wrap AppleHealthKit.initHealthKit in a Promise. */
function initHK(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HK_PERMISSIONS, (err) => {
      if (err) reject(new Error(err));
      else resolve();
    });
  });
}

/** Wrap AppleHealthKit.isAvailable in a Promise. */
function hkAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    AppleHealthKit.isAvailable((_, available) => resolve(!!available));
  });
}

/** Read the most recent heart rate sample from today. Returns null if none. */
function fetchHeartRateToday(): Promise<number | null> {
  return new Promise((resolve) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    AppleHealthKit.getHeartRateSamples(
      { startDate: start.toISOString(), limit: 1, ascending: false },
      (err, results) => {
        if (err || !results || results.length === 0) {
          resolve(null);
        } else {
          resolve(Math.round(results[0].value));
        }
      },
    );
  });
}

/** Sum active energy burned from midnight to now. Returns null on error. */
function fetchCaloriesToday(): Promise<number | null> {
  return new Promise((resolve) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    AppleHealthKit.getActiveEnergyBurned(
      { startDate: start.toISOString(), endDate: new Date().toISOString() },
      (err, results) => {
        if (err || !results || results.length === 0) {
          resolve(null);
        } else {
          const total = results.reduce((sum, s) => sum + s.value, 0);
          resolve(Math.round(total));
        }
      },
    );
  });
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Check current permission state without prompting the user.
 * Uses Pedometer for the step permission status (available without prompting).
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  if (Platform.OS !== 'ios') {
    return _unavailableStatus();
  }

  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return _unavailableStatus();

    const { status } = await Pedometer.getPermissionsAsync();
    const stepStatus = _toPermStatus(status);

    // If steps are granted, HealthKit was likely initialized before
    const hkStatus: HealthPermissionStatus = _hkInitialized
      ? 'granted'
      : stepStatus === 'granted' ? 'granted' : stepStatus;

    return {
      available: true,
      permissions: {
        steps:     stepStatus,
        heartRate: hkStatus,
        calories:  hkStatus,
      },
    };
  } catch {
    return _unavailableStatus();
  }
}

/**
 * Request health permissions from the user.
 * - Triggers the Motion & Fitness dialog (Pedometer / steps).
 * - Triggers the HealthKit dialog (HR + calories) via react-native-health.
 * Both dialogs may appear sequentially on first run.
 */
export async function requestHealthPermissions(): Promise<HealthStatus> {
  if (Platform.OS !== 'ios') return _unavailableStatus();

  try {
    // 1. Pedometer permission (Motion & Fitness — also covers HealthKit steps)
    const available = await Pedometer.isAvailableAsync();
    if (!available) return _unavailableStatus();

    const { status } = await Pedometer.requestPermissionsAsync();
    const stepStatus = _toPermStatus(status);

    if (stepStatus !== 'granted') {
      return {
        available: true,
        permissions: { steps: stepStatus, heartRate: 'denied', calories: 'denied' },
      };
    }

    // 2. HealthKit init (HR + calories — may show its own dialog)
    let hkStatus: HealthPermissionStatus = 'undetermined';
    try {
      const hkOk = await hkAvailable();
      if (hkOk) {
        await initHK();
        _hkInitialized = true;
        hkStatus = 'granted';
      } else {
        hkStatus = 'unavailable';
      }
    } catch {
      // HealthKit init failed (e.g. Expo Go — native module not present)
      hkStatus = 'unavailable';
    }

    return {
      available: true,
      permissions: {
        steps:     stepStatus,
        heartRate: hkStatus,
        calories:  hkStatus,
      },
    };
  } catch {
    return _unavailableStatus();
  }
}

/**
 * Read today's health summary.
 * Steps from Pedometer, HR and calories from HealthKit (if initialized).
 */
export async function getHealthSummaryToday(): Promise<HealthSummary> {
  try {
    const { status } = await Pedometer.getPermissionsAsync();
    if (status !== 'granted') {
      return _emptySummary();
    }

    // Steps — Pedometer (reliable, real-time)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const stepsResult = await Pedometer.getStepCountAsync(start, new Date());
    const steps = stepsResult.steps;

    // HR + Calories — HealthKit (only when initialized)
    let heartRate: number | null = null;
    let calories: number | null = null;

    if (_hkInitialized) {
      [heartRate, calories] = await Promise.all([
        fetchHeartRateToday(),
        fetchCaloriesToday(),
      ]);
    } else {
      // Try lazy init (user may have granted before this session)
      try {
        const hkOk = await hkAvailable();
        if (hkOk) {
          await initHK();
          _hkInitialized = true;
          [heartRate, calories] = await Promise.all([
            fetchHeartRateToday(),
            fetchCaloriesToday(),
          ]);
        }
      } catch {
        // Native module not available (Expo Go) — silently skip
      }
    }

    return { steps, heartRate, calories, lastSyncedAt: new Date() };
  } catch {
    return _emptySummary();
  }
}

/* ── Real-time step tracking ────────────────────────────────────────────── */

/**
 * Start listening for step count updates in real time.
 * Calls onUpdate whenever steps or health data changes.
 */
export async function startHealthSync(
  onUpdate: (summary: Partial<HealthSummary>) => void,
): Promise<boolean> {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return false;

    const { status } = await Pedometer.getPermissionsAsync();
    if (status !== 'granted') return false;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const baseline = await Pedometer.getStepCountAsync(start, new Date());
    _stepsAtSubscriptionStart = baseline.steps;

    onUpdate({ steps: _stepsAtSubscriptionStart, lastSyncedAt: new Date() });

    _stepSubscription = Pedometer.watchStepCount((result) => {
      const totalToday = _stepsAtSubscriptionStart + result.steps;
      onUpdate({ steps: totalToday, lastSyncedAt: new Date() });
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Stop real-time health sync.
 */
export function stopHealthSync(): void {
  if (_stepSubscription) {
    _stepSubscription.remove();
    _stepSubscription = null;
  }
}

/* ── UI helpers ─────────────────────────────────────────────────────────── */

export function healthStatusLabel(status: HealthPermissionStatus): string {
  switch (status) {
    case 'granted':       return 'SINCRONIZADO';
    case 'denied':        return 'ACCESO DENEGADO';
    case 'undetermined':  return 'CONECTAR';
    case 'unavailable':   return 'NO DISPONIBLE';
  }
}

/* ── Private utils ──────────────────────────────────────────────────────── */

function _toPermStatus(status: string): HealthPermissionStatus {
  if (status === 'granted')  return 'granted';
  if (status === 'denied')   return 'denied';
  return 'undetermined';
}

function _unavailableStatus(): HealthStatus {
  return {
    available: false,
    permissions: { steps: 'unavailable', heartRate: 'unavailable', calories: 'unavailable' },
  };
}

function _emptySummary(): HealthSummary {
  return { steps: null, heartRate: null, calories: null, lastSyncedAt: null };
}
