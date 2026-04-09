import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

/* ── Config ── */

// Set default notification behavior (show when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goals', {
      name: 'Metas completadas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D1FF26',
      sound: 'default',
    });
  }

  // Get the Expo push token
  try {
    const projectId = getExpoProjectId();
    if (!projectId) {
      console.warn(
        'Push notifications disabled: missing EAS projectId. Configure expo.extra.eas.projectId in app config.',
      );
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Save to Supabase
    await saveTokenToDatabase(token);

    return token;
  } catch (e) {
    console.error('Error getting push token:', e);
    return null;
  }
}

/**
 * Send a local notification when a goal is completed.
 * This works immediately even when the app is in foreground.
 * The remote push (Edge Function) handles the case when app is closed.
 */
export async function sendGoalCompletedNotification(
  goalTitle: string,
  currentValue?: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Meta cumplida!',
      body: `Completaste: ${goalTitle}`,
      data: { type: 'goal_completed', goalTitle },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'goals' } : {}),
    },
    trigger: null, // Immediately
  });
}

/**
 * Add a notification response listener (when user taps a notification).
 * Returns a cleanup function.
 */
export function addNotificationResponseListener(
  callback: (goalTitle: string) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'goal_completed') {
        callback(data.goalTitle as string);
      }
    },
  );
  return () => subscription.remove();
}

/**
 * Remove push token from DB (e.g., on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  try {
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
  } catch (e) {
    console.error('Error unregistering push token:', e);
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

  if (error) {
    console.error('Error saving push token:', error.message);
  }
}

function getExpoProjectId(): string | undefined {
  const projectIdFromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const projectIdFromEasConfig = Constants.easConfig?.projectId;

  return projectIdFromExpoConfig ?? projectIdFromEasConfig;
}
