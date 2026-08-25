import * as SecureStore from 'expo-secure-store';
import { 
  SecureStoreAdapter, 
  ESPAREX_AUTH_ACCESS_TOKEN, 
  ESPAREX_AUTH_REFRESH_TOKEN 
} from '../SecureStoreAdapter';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
}));

describe('SecureStoreAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setAccessToken should save access token to SecureStore', async () => {
    await SecureStoreAdapter.setAccessToken('access-123');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_ACCESS_TOKEN, 'access-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('getAccessToken should retrieve access token from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('access-123');

    const token = await SecureStoreAdapter.getAccessToken();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_ACCESS_TOKEN);
    expect(token).toBe('access-123');
  });

  it('setTokens should save both tokens to SecureStore', async () => {
    await SecureStoreAdapter.setTokens('access-123', 'refresh-456');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_ACCESS_TOKEN, 'access-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_REFRESH_TOKEN, 'refresh-456');
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });

  it('getTokens should retrieve both tokens from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
      if (key === ESPAREX_AUTH_ACCESS_TOKEN) return Promise.resolve('access-123');
      if (key === ESPAREX_AUTH_REFRESH_TOKEN) return Promise.resolve('refresh-456');
      return Promise.resolve(null);
    });

    const tokens = await SecureStoreAdapter.getTokens();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_ACCESS_TOKEN);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_REFRESH_TOKEN);
    expect(tokens).toEqual({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });
  });

  it('clearTokens should delete both tokens from SecureStore', async () => {
    await SecureStoreAdapter.clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_ACCESS_TOKEN);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ESPAREX_AUTH_REFRESH_TOKEN);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });

  it('hasTokens should return true if both tokens exist', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-value');
    const result = await SecureStoreAdapter.hasTokens();
    expect(result).toBe(true);
  });

  it('hasTokens should return false if one or more tokens are missing', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const result = await SecureStoreAdapter.hasTokens();
    expect(result).toBe(false);
  });

  it('isAvailable should call isAvailableAsync', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    const result = await SecureStoreAdapter.isAvailable();
    expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
