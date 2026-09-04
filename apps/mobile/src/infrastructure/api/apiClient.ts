import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError } from 'axios-retry';
import * as Crypto from 'expo-crypto';
import { API_V1_BASE_PATH } from '@esparex/shared';
import { TokenProvider } from './TokenProvider';
import { SecureStoreAdapter } from '../auth/SecureStoreAdapter';
import { Platform } from 'react-native';

// Determine Base URL (fall back to local development URL)
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    return envUrl.endsWith('/') ? envUrl : `${envUrl}/`;
  }

  // Auto-detect host for Android Emulator vs iOS Simulator
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5001/api/v1/`;
};

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
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

let cachedCsrfToken: string | null = null;
let csrfFetchPromise: Promise<string | null> | null = null;

export const fetchCsrfToken = async (): Promise<string | null> => {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const csrfUrl = `${BASE_URL.replace(/\/+$/, '')}/csrf-token`;
      const response = await axios.get<{ csrfToken?: string; data?: { csrfToken?: string } }>(
        csrfUrl,
        { withCredentials: true }
      );
      const token = response.data?.csrfToken || response.data?.data?.csrfToken || null;
      if (token) {
        cachedCsrfToken = token;
      }
      return cachedCsrfToken;
    } catch {
      return null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
};

// Request Interceptor: Attach Tokens, CSRF, and Correlation ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Fix 404: Ensure URL is relative to baseURL's path by removing leading slash
    if (config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    // 2. Generate and attach Correlation ID per request
    let correlationId: string;
    try {
      correlationId = Crypto.randomUUID();
    } catch (e) {
      correlationId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    config.headers.set('X-Correlation-ID', correlationId);

    const fullUrl = `${config.baseURL}${config.url}`;

    // 2. Attach Authorization Token if available
    const token = await TokenProvider.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // 3. Attach CSRF token on mutation HTTP methods
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      let csrfToken = cachedCsrfToken;
      if (!csrfToken && !config.url?.includes('csrf-token')) {
        csrfToken = await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers.set('X-CSRF-Token', csrfToken);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const notifyUnauthorized = (): void => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
};

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      TokenProvider.clearCache();
      await SecureStoreAdapter.clearTokens().catch(() => {});
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

