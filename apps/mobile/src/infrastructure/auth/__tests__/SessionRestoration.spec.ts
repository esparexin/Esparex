import { SessionRestoration } from '../SessionRestoration';
import { SecureStoreAdapter } from '../SecureStoreAdapter';

// Mock the adapter
jest.mock('../SecureStoreAdapter', () => ({
  SecureStoreAdapter: {
    getTokens: jest.fn(),
  }
}));

describe('SessionRestoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return authenticated state when both tokens exist', async () => {
    (SecureStoreAdapter.getTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'authenticated',
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });
  });

  it('should return anonymous state when tokens are missing', async () => {
    (SecureStoreAdapter.getTokens as jest.Mock).mockResolvedValue({
      accessToken: null,
      refreshToken: null,
    });

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
  });

  it('should return anonymous state when only one token exists', async () => {
    (SecureStoreAdapter.getTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: null,
    });

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
  });

  it('should return anonymous state when SecureStore throws an error', async () => {
    (SecureStoreAdapter.getTokens as jest.Mock).mockRejectedValue(new Error('Keystore corrupted'));

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
  });
});
