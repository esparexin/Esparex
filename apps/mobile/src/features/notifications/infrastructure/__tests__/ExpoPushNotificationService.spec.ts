import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { ExpoPushNotificationService } from '../ExpoPushNotificationService';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Shared mutable flag — lets individual tests simulate non-physical devices
let mockIsDevice = true;

jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync:           jest.fn(),
  requestPermissionsAsync:       jest.fn(),
  getExpoPushTokenAsync:         jest.fn(),
  setNotificationChannelAsync:   jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: { projectId: 'test-project-id' },
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetPermissions     = Notifications.getPermissionsAsync         as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync     as jest.Mock;
const mockGetToken           = Notifications.getExpoPushTokenAsync        as jest.Mock;
const mockSetChannel         = Notifications.setNotificationChannelAsync  as jest.Mock;

const MOCK_TOKEN = 'ExponentPushToken[test-abc-123]';

const granted = { status: 'granted' };
const denied  = { status: 'denied' };
const undetermined = { status: 'undetermined' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExpoPushNotificationService', () => {
  let service: ExpoPushNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExpoPushNotificationService();
  });

  // ─── requestPermission ───────────────────────────────────────────────────

  describe('requestPermission()', () => {
    it('returns "granted" without re-prompting when already granted', async () => {
      mockGetPermissions.mockResolvedValue(granted);

      const result = await service.requestPermission();

      expect(result).toBe('granted');
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('returns "denied" without re-prompting when already denied', async () => {
      mockGetPermissions.mockResolvedValue(denied);

      const result = await service.requestPermission();

      expect(result).toBe('denied');
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('shows the OS dialog when status is undetermined and grants', async () => {
      mockGetPermissions.mockResolvedValue(undetermined);
      mockRequestPermissions.mockResolvedValue(granted);

      const result = await service.requestPermission();

      expect(result).toBe('granted');
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    it('returns "denied" when the user dismisses the OS dialog', async () => {
      mockGetPermissions.mockResolvedValue(undetermined);
      mockRequestPermissions.mockResolvedValue(denied);

      const result = await service.requestPermission();

      expect(result).toBe('denied');
    });
  });

  // ─── getExpoPushToken ────────────────────────────────────────────────────

  describe('getExpoPushToken()', () => {
    beforeEach(() => {
      mockGetPermissions.mockResolvedValue(granted);
      mockGetToken.mockResolvedValue({ data: MOCK_TOKEN });
    });

    it('throws when running on a simulator / emulator', async () => {
      mockIsDevice = false;

      await expect(service.getExpoPushToken()).rejects.toThrow('not-device');

      mockIsDevice = true; // restore
    });

    it('throws when the Expo project ID is missing', async () => {
      (Constants as { expoConfig: unknown }).expoConfig = { extra: {} };

      await expect(service.getExpoPushToken()).rejects.toThrow('token-unavailable');

      // Restore
      (Constants as { expoConfig: unknown }).expoConfig = {
        extra: { eas: { projectId: 'test-project-id' } },
      };
    });

    it('throws when getExpoPushTokenAsync rejects', async () => {
      mockGetToken.mockRejectedValue(new Error('SDK error'));

      await expect(service.getExpoPushToken()).rejects.toThrow('token-unavailable');
    });

    it('returns a PushToken with the correct value', async () => {
      const token = await service.getExpoPushToken();

      expect(token.value).toBe(MOCK_TOKEN);
    });

    it('returns platform "ios" when Platform.OS is ios', async () => {
      (Platform as { OS: string }).OS = 'ios';

      const token = await service.getExpoPushToken();

      expect(token.platform).toBe('ios');
    });

    it('returns platform "android" when Platform.OS is android', async () => {
      (Platform as { OS: string }).OS = 'android';

      const token = await service.getExpoPushToken();

      expect(token.platform).toBe('android');

      (Platform as { OS: string }).OS = 'ios'; // restore
    });

    it('skips Android channel creation on iOS', async () => {
      (Platform as { OS: string }).OS = 'ios';

      await service.getExpoPushToken();

      expect(mockSetChannel).not.toHaveBeenCalled();
    });

    it('creates the Android default channel on Android', async () => {
      (Platform as { OS: string }).OS = 'android';

      await service.getExpoPushToken();

      expect(mockSetChannel).toHaveBeenCalledTimes(1);
      expect(mockSetChannel).toHaveBeenCalledWith(
        'esparex-default',
        expect.objectContaining({ name: 'Esparex Notifications' }),
      );

      (Platform as { OS: string }).OS = 'ios'; // restore
    });
  });

  // ─── registerForPushNotifications ────────────────────────────────────────

  describe('registerForPushNotifications()', () => {
    it('returns success=false when permission is denied', async () => {
      mockGetPermissions.mockResolvedValue(undetermined);
      mockRequestPermissions.mockResolvedValue(denied);

      const result = await service.registerForPushNotifications();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('permission-denied');
      }
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('returns success=true with token when permission is granted', async () => {
      mockGetPermissions.mockResolvedValue(granted);
      mockGetToken.mockResolvedValue({ data: MOCK_TOKEN });

      const result = await service.registerForPushNotifications();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.token.value).toBe(MOCK_TOKEN);
        expect(result.token.platform).toBe('ios');
      }
    });

    it('does not re-request permission when already granted', async () => {
      mockGetPermissions.mockResolvedValue(granted);
      mockGetToken.mockResolvedValue({ data: MOCK_TOKEN });

      await service.registerForPushNotifications();

      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });
  });
});
