import { apiClient } from '../apiClient';
import { TokenProvider } from '../TokenProvider';
import { SecureStoreAdapter } from '../../auth/SecureStoreAdapter';
import * as Crypto from 'expo-crypto';
import axios, { AxiosError, AxiosHeaders } from 'axios';

jest.mock('../TokenProvider', () => ({
  TokenProvider: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    clearCache: jest.fn(),
  }
}));

jest.mock('../../auth/SecureStoreAdapter', () => ({
  SecureStoreAdapter: {
    clearTokens: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

describe('apiClient', () => {
  beforeAll(() => {
    // Inject a mock adapter to prevent actual network calls and easily inspect configs
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/401' || config.url === '401') {
        const error = new AxiosError('Unauthorized', '401', config, {}, { 
          status: 401, 
          data: {}, 
          statusText: 'Unauthorized', 
          headers: new AxiosHeaders(), 
          config 
        });
        return Promise.reject(error);
      }
      return {
        data: 'success',
        status: 200,
        statusText: 'OK',
        headers: config.headers ? new AxiosHeaders(config.headers) : new AxiosHeaders(),
        config,
        request: {}
      };
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should attach X-Correlation-ID to requests', async () => {
      (TokenProvider.getAccessToken as jest.Mock).mockResolvedValue(null);
      
      const response = await apiClient.get('/test');
      
      expect(Crypto.randomUUID).toHaveBeenCalled();
      expect(response.config.headers.get('X-Correlation-ID')).toBe('test-uuid-1234');
    });

    it('should attach Authorization header when token exists', async () => {
      (TokenProvider.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      
      const response = await apiClient.get('/test');
      
      expect(response.config.headers.get('Authorization')).toBe('Bearer valid-token');
    });

    it('should omit Authorization header when no token exists', async () => {
      (TokenProvider.getAccessToken as jest.Mock).mockResolvedValue(null);
      
      const response = await apiClient.get('/test');
      
      expect(response.config.headers.get('Authorization')).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should clear token cache and secure store on 401 Unauthorized', async () => {
      await expect(apiClient.get('/401')).rejects.toThrow();

      expect(TokenProvider.clearCache).toHaveBeenCalled();
      expect(SecureStoreAdapter.clearTokens).toHaveBeenCalled();
    });
  });
});
