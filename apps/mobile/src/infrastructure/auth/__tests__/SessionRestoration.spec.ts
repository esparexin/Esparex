import { SessionRestoration } from '../SessionRestoration';
import { SecureStoreAdapter } from '../SecureStoreAdapter';

// Mock the adapter
jest.mock('../SecureStoreAdapter', () => ({
  SecureStoreAdapter: {
    getAccessToken: jest.fn(),
    getTokens: jest.fn(),
  }
}));

describe('SessionRestoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return authenticated state when valid accessToken exists', async () => {
    (SecureStoreAdapter.getAccessToken as jest.Mock).mockResolvedValue('access-123');

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'authenticated',
      accessToken: 'access-123',
    });
  });

  it('should return anonymous state when accessToken is null', async () => {
    (SecureStoreAdapter.getAccessToken as jest.Mock).mockResolvedValue(null);

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
  });

  it('should return anonymous state when SecureStore throws an error', async () => {
    (SecureStoreAdapter.getAccessToken as jest.Mock).mockRejectedValue(new Error('Keystore corrupted'));

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
  });
});
