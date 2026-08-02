import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { PushToken } from '../domain/PushToken';
import {
  IPushNotificationService,
  PermissionStatus,
  PushRegistrationResult,
} from '../application/IPushNotificationService';

// ---------------------------------------------------------------------------
// Android notification channel
// ---------------------------------------------------------------------------

// Set up the default notification channel for Android 8+ (Oreo).
// Must be configured before any notification can be displayed on Android.
// This is a one-time setup; calling it multiple times is idempotent.
const ANDROID_CHANNEL_ID = 'esparex-default';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name:        'Esparex Notifications',
    description: 'Alerts for messages and listing activity.',
    importance:  Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0ea5e9', // sky-500
    showBadge: true,
  });
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * ExpoPushNotificationService — infrastructure adapter for push token management.
 *
 * Implements IPushNotificationService using the Expo notifications SDK.
 *
 * Responsibilities:
 *   - Guard against simulator/emulator environments
 *   - Request OS-level notification permissions
 *   - Set up the Android default notification channel
 *   - Acquire the Expo push token via the SDK
 *   - Map all Expo SDK types to internal domain models before returning
 *
 * Does NOT:
 *   - Expose any Expo SDK types outside this file
 *   - Send the token to the backend (PR 2)
 *   - Set up notification listeners or handle received payloads (PR 3)
 *   - Know about React, state, or navigation
 */
export class ExpoPushNotificationService implements IPushNotificationService {

  // -------------------------------------------------------------------------
  // requestPermission
  // -------------------------------------------------------------------------

  async requestPermission(): Promise<PermissionStatus> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    // Already determined — return immediately without re-prompting
    if (existingStatus === 'granted') return 'granted';
    if (existingStatus === 'denied')  return 'denied';

    // Undetermined — show the OS dialog
    const { status: finalStatus } =
      await Notifications.requestPermissionsAsync();

    return finalStatus === 'granted' ? 'granted' : 'denied';
  }

  // -------------------------------------------------------------------------
  // getExpoPushToken
  // -------------------------------------------------------------------------

  async getExpoPushToken(): Promise<PushToken> {
    // Guard: push tokens are not available in simulators or emulators
    if (!Device.isDevice) {
      throw new Error('not-device: Push notifications require a physical device.');
    }

    // Guard: the Expo project ID must be present in app.json / Constants
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { expoConfig?: { extra?: { projectId?: string } } })
        .expoConfig?.extra?.projectId;

    if (!projectId) {
      throw new Error(
        'token-unavailable: Expo project ID is missing from app.json (extra.eas.projectId).',
      );
    }

    // Ensure Android has a default notification channel
    await ensureAndroidChannel();

    // Acquire the Expo push token — throws if the SDK call fails
    let tokenData: Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown SDK error';
      throw new Error(`token-unavailable: ${message}`);
    }

    // Map to domain model — no Expo types leak beyond this boundary
    return {
      value:    tokenData.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    };
  }

  // -------------------------------------------------------------------------
  // registerForPushNotifications
  // -------------------------------------------------------------------------

  async registerForPushNotifications(): Promise<PushRegistrationResult> {
    const status = await this.requestPermission();

    if (status !== 'granted') {
      return { success: false, reason: 'permission-denied' };
    }

    const token = await this.getExpoPushToken();
    return { success: true, token };
  }
}
