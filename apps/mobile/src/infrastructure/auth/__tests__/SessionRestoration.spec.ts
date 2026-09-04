import { SessionRestoration } from '../SessionRestoration';
import { SecureStoreAdapter } from '../SecureStoreAdapter';

// Mock the adapter
jest.mock('../SecureStoreAdapter', () => ({
  SecureStoreAdapter: {
    getAccessToken: jest.fn(),
    getTokens: jest.fn(),
    clearTokens: jest.fn().mockResolvedValue(undefined),
  }
}));

function createMockJwt(expInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-123', exp: expInSeconds })).toString('base64');
  return `${header}.${payload}.mock-signature`;
}

describe('SessionRestoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return authenticated state when valid non-expired JWT accessToken exists', async () => {
    const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
    (SecureStoreAdapter.getAccessToken as jest.Mock).mockResolvedValue(validToken);

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'authenticated',
      accessToken: validToken,
    });
    expect(SecureStoreAdapter.clearTokens).not.toHaveBeenCalled();
  });

  it('should clear tokens and return anonymous state when JWT accessToken is expired', async () => {
    const expiredToken = createMockJwt(Math.floor(Date.now() / 1000) - 300);
    (SecureStoreAdapter.getAccessToken as jest.Mock).mockResolvedValue(expiredToken);

    const result = await SessionRestoration.restoreSession();

    expect(result).toEqual({
      status: 'anonymous',
    });
    expect(SecureStoreAdapter.clearTokens).toHaveBeenCalled();
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
