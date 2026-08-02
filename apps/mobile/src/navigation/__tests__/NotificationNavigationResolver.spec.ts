import { Linking } from 'react-native';
import { NotificationNavigationResolver } from '../NotificationNavigationResolver';
import { NotificationResponse } from '../../features/notifications/domain/NotificationPayload';

jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn(),
  },
}));

const mockOpenURL = Linking.openURL as jest.Mock;

describe('NotificationNavigationResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates via explicit url parameter when present', async () => {
    mockOpenURL.mockResolvedValue(true);

    const response: NotificationResponse = {
      actionIdentifier: 'default',
      notification: {
        id: '1',
        data: { url: 'esparex://chat/thread/c123' },
      },
    };

    const result = await NotificationNavigationResolver.handleNotificationResponse(response);

    expect(result).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith('esparex://chat/thread/c123');
  });

  it('navigates to chat thread deep link when target is chat', async () => {
    mockOpenURL.mockResolvedValue(true);

    const response: NotificationResponse = {
      actionIdentifier: 'default',
      notification: {
        id: '2',
        data: { target: 'chat', conversationId: 'conv-456' },
      },
    };

    const result = await NotificationNavigationResolver.handleNotificationResponse(response);

    expect(result).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith('esparex://chat/thread/conv-456');
  });

  it('navigates to listing deep link when target is listing', async () => {
    mockOpenURL.mockResolvedValue(true);

    const response: NotificationResponse = {
      actionIdentifier: 'default',
      notification: {
        id: '3',
        data: { target: 'listing', listingId: 'ad-789' },
      },
    };

    const result = await NotificationNavigationResolver.handleNotificationResponse(response);

    expect(result).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith('esparex://listing/ad-789');
  });

  it('returns false safely when unknown target is provided', async () => {
    const response: NotificationResponse = {
      actionIdentifier: 'default',
      notification: {
        id: '4',
        data: { target: 'unknown' },
      },
    };

    const result = await NotificationNavigationResolver.handleNotificationResponse(response);

    expect(result).toBe(false);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
