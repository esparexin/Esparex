import { apiClient } from '../apiClient';
import { TokenProvider } from '../TokenProvider';
import { setRefreshExecutor } from '../refreshQueue';
import * as Crypto from 'expo-crypto';
import axios, { AxiosError, AxiosHeaders } from 'axios';

jest.mock('../TokenProvider', () => ({
  TokenProvider: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  }
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

describe('apiClient', () => {
  beforeAll(() => {
    // Inject a mock adapter to prevent actual network calls and easily inspect configs
    apiClient.defaults.adapter = async (config) => {
      // Simulate 401 for specific URL for testing refresh logic
      if (config.url === '/401' || config.url === '401') {
        if (config.headers?.Authorization === 'Bearer new-access-token') {
           // Return success on retry with new token
           return {
             data: 'retry-success',
             status: 200,
             statusText: 'OK',
             headers: config.headers ? new AxiosHeaders(config.headers) : new AxiosHeaders(),
             config,
             request: {}
           };
        }

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

  describe('Response Interceptor & RefreshQueue', () => {
    it('should queue concurrent 401s and resume after refresh', async () => {
      const executor = jest.fn().mockResolvedValue('new-access-token');
      setRefreshExecutor(executor);

      // Fire two requests that will hit 401
      const p1 = apiClient.get('/401');
      const p2 = apiClient.get('/401');

      const results = await Promise.all([p1, p2]);

      expect(executor).toHaveBeenCalledTimes(1); // deduplication
      
      expect(results[0].data).toBe('retry-success');
      expect(results[1].data).toBe('retry-success');
    });

    it('should reject queued requests when refresh fails', async () => {
      const executor = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      setRefreshExecutor(executor);

      await expect(apiClient.get('/401')).rejects.toThrow('Refresh failed');
    });
  });
});
