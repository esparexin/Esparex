import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError } from 'axios-retry';
import * as Crypto from 'expo-crypto';
import { TokenProvider } from './TokenProvider';
import { handleRefresh } from './refreshQueue';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Determine Base URL (fall back to local development URL)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Exponential Backoff Retry Policy
// Strict retries: only retry on network failures and 5xx (500, 502, 503, 504).
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors
    if (isNetworkOrIdempotentRequestError(error)) {
      return true;
    }
    // Retry on 5xx errors
    const status = error.response?.status;
    if (status && status >= 500 && status <= 599) {
      return true;
    }
    // Never retry 4xx errors (authentication, authorization, validation)
    return false;
  },
});

// Request Interceptor: Attach Tokens and Correlation ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Generate and attach UUID v4 Correlation ID per request
    const correlationId = Crypto.randomUUID();
    config.headers.set('X-Correlation-ID', correlationId);

    // 2. Attach Authorization Token if available
    const token = await TokenProvider.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized via RefreshQueue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If the error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Enqueue this failed request and wait for the refresh to complete
        const newToken = await handleRefresh(originalRequest);

        // Update the header with the new token
        if (newToken) {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        }

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired), reject the promise
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
