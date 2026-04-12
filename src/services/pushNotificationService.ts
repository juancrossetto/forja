import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

/* ── Config ── */

/** En Expo Go el módulo remoto de push está limitado; evitamos importarlo para no spamear WARN en consola. */
const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsLoad: Promise<NotificationsModule | null> | null = null;

function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGo) {
    return Promise.resolve(null);
  }
  if (!notificationsLoad) {
    notificationsLoad = import('expo-notifications').catch(() => null);
  }
  return notificationsLoad;
}

let handlerInitialized = false;

async function ensureNotificationHandler(): Promise<NotificationsModule | null> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications || handlerInitialized) {
    return Notifications;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerInitialized = true;
  return Notifications;
}

/* ── Types ── */

export interface PushTokenRecord {
  expo_token: string;
  platform: string;
  device_id: string | null;
}

/* ── Public API ── */

/**
 * Register for push notifications and save token to Supabase.
 * Call this on app startup after user is authenticated.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await ensureNotificationHandler();
  if (!Notifications) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goals', {
      name: 'Metas completadas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D1FF26',
      sound: 'default',
    });
  }

  try {
    const projectId = getExpoProjectId();
    if (!projectId) {
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    await saveTokenToDatabase(token);

    return token;
  } catch {
    return null;
  }
}

/**
 * Send a local notification when a goal is completed.
 */
export async function sendGoalCompletedNotification(
  goalTitle: string,
  currentValue?: number,
): Promise<void> {
  if (isExpoGo) {
    return;
  }

  const Notifications = await ensureNotificationHandler();
  if (!Notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Meta cumplida!',
      body: `Completaste: ${goalTitle}`,
      data: { type: 'goal_completed', goalTitle },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'goals' } : {}),
    },
    trigger: null,
  });
}

/**
 * Add a notification response listener (when user taps a notification).
 */
export function addNotificationResponseListener(
  callback: (goalTitle: string) => void,
): () => void {
  if (isExpoGo) {
    return () => {};
  }

  let removed = false;
  let subscription: { remove: () => void } | undefined;

  void loadNotificationsModule().then((Notifications) => {
    if (!Notifications || removed) return;
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'goal_completed') {
        callback(data.goalTitle as string);
      }
    });
  });

  return () => {
    removed = true;
    subscription?.remove();
  };
}

/**
 * Remove push token from DB (e.g., on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  if (isExpoGo) {
    return;
  }

  try {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) return;

    const projectId = getExpoProjectId();
    if (!projectId) {
      return;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('expo_token', token);
  } catch {
    // ignore
  }
}

/* ── Internal ── */

async function saveTokenToDatabase(token: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_token: token,
        platform: Platform.OS,
        device_id: Device.modelId ?? null,
        is_active: true,
      },
      { onConflict: 'user_id,expo_token' },
    );

  if (error && __DEV__) {
    console.warn('[push]', error.message);
  }
}

function getExpoProjectId(): string | undefined {
  const projectIdFromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const projectIdFromEasConfig = Constants.easConfig?.projectId;
  const id = projectIdFromExpoConfig ?? projectIdFromEasConfig;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}
