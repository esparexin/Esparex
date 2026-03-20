
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosHeaders,
    AxiosHeaderValue
} from 'axios';

import { validateApiEnv } from './validateApiEnv';
import { encryptData, decryptData } from '../encryption';
import { normalizeError } from './normalizeError';
import { APIError } from './APIError';
import { emitErrorPopup } from '@/lib/popup/popupEvents';
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from '@/api/routes';
import logger from "@/lib/logger";

/* ======================================================
   BASE_URL
====================================================== */

let BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // 🔒 DYNAMIC HOST ALIGNMENT
    // Ensure API requests match the browser's hostname (127.0.0.1 vs localhost)
    // to prevent SameSite cookie rejection.
    const hostname = window.location.hostname;
    if ((hostname === '127.0.0.1' || hostname === 'localhost') && BASE_URL.includes('localhost')) {
        // If browser is 127, force API to 127. If browser is localhost, force localhost.
        // But BASE_URL default is usually localhost.
        if (hostname === '127.0.0.1') {
            logger.warn('[API Client] 🔄 Aligning API host to 127.0.0.1 for cookie compatibility');
            BASE_URL = BASE_URL.replace('localhost', '127.0.0.1');
        }
    } else if ((hostname === '127.0.0.1' || hostname === 'localhost') && BASE_URL.includes('127.0.0.1')) {
        if (hostname === 'localhost') {
            logger.warn('[API Client] 🔄 Aligning API host to localhost for cookie compatibility');
            BASE_URL = BASE_URL.replace('127.0.0.1', 'localhost');
        }
    }
}

// 📐 STANDARDIZE TRAILING SLASH FOR RELATIVE PATH RESOLUTION
BASE_URL = BASE_URL.replace(/\/$/, '') + '/';

export interface EsparexRequestConfig extends AxiosRequestConfig {
    skipHealthCheck?: boolean;
    silent?: boolean;
    _csrfRetry?: boolean;
}

/* ======================================================
   API CLIENT
====================================================== */

class APIClient {
    private client: AxiosInstance;
    private isBackendHealthy = true;
    private healthCheckPromise: Promise<boolean> | null = null;
    private healthCheckTimestamp = 0;
    private csrfToken: string | null = null;
    private csrfTokenPromise: Promise<string | null> | null = null;
    private readonly HEALTH_CACHE_MS = 30_000;

    constructor() {
        validateApiEnv();
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 20_000,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors();
    }

    private isStateChangingMethod(method?: string): boolean {
        if (!method) return false;
        const normalized = method.toLowerCase();
        return ['post', 'put', 'patch', 'delete'].includes(normalized);
    }

    private async getCsrfToken(forceRefresh = false): Promise<string | null> {
        if (!forceRefresh && this.csrfToken) {
            return this.csrfToken;
        }

        if (this.csrfTokenPromise) {
            return this.csrfTokenPromise;
        }

        this.csrfTokenPromise = axios
            .get<{ csrfToken?: unknown }>(`${BASE_URL}${API_ROUTES.USER.CSRF_TOKEN}`, {
                withCredentials: true,
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            })
            .then((response) => {
                const token = response.data?.csrfToken;
                if (typeof token === 'string' && token.length > 0) {
                    this.csrfToken = token;
                    return token;
                }
                this.csrfToken = null;
                return null;
            })
            .catch((error: unknown) => {
                this.csrfToken = null;
                if (process.env.NODE_ENV === 'development') {
                    const normalized = normalizeError(error);
                    logger.warn('[API Client] CSRF bootstrap failed:', normalized.message);
                }
                return null;
            })
            .finally(() => {
                this.csrfTokenPromise = null;
            });

        return this.csrfTokenPromise;
    }

    /* ======================================================
       INTERCEPTORS
    ====================================================== */

    private setupInterceptors() {

        this.client.interceptors.request.use(async (config) => {
            // ✅ SKIP HEALTH GUARD FOR THE HEALTH CHECK ITSELF OR IF EXPLICITLY SKIPPED
            if (config.url?.endsWith(API_ROUTES.USER.HEALTH) || (config as EsparexRequestConfig).skipHealthCheck) {
                return config;
            }

            if (!this.isBackendHealthy) {
                if (Date.now() - this.healthCheckTimestamp > this.HEALTH_CACHE_MS) {
                    const ok = await this.checkHealth();
                    if (ok) return config;
                }

                const error = new APIError({
                        status: 503,
                        code: 'BACKEND_UNAVAILABLE',
                        message: 'Backend service unavailable.',
                        details: { technicalMessage: 'Health check failed' },
                        source: 'health-gate',
                        context: {
                            backendErrorCode: 'BACKEND_UNAVAILABLE',
                            backendErrorMessage: 'Backend service unavailable.',
                            endpoint: config.url?.toString(),
                        }
                    });
                if (!(config as EsparexRequestConfig).silent) {
                    emitErrorPopup(error);
                }
                return Promise.reject(error);
            }

            const method = config.method?.toLowerCase();
            const isCsrfBootstrapRequest = config.url?.endsWith(API_ROUTES.USER.CSRF_TOKEN);
            if (!isCsrfBootstrapRequest && this.isStateChangingMethod(method)) {
                const csrfToken = await this.getCsrfToken();
                if (csrfToken) {
                    const headers = new AxiosHeaders(config.headers);
                    headers.set('x-csrf-token', csrfToken);
                    config.headers = headers;
                }
            }

            // 🛠️ MULTIPART FORM DATA FIX
            // If data is FormData, remove Content-Type to let browser/Axios set boundary correctly
            if (config.data instanceof FormData) {
                const headers = new AxiosHeaders(config.headers);
                headers.delete('Content-Type');
                config.headers = headers;
            }

            // Encryption
            if (
                process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === 'true' &&
                config.data &&
                !(config.data instanceof FormData) &&
                ['post', 'put', 'patch'].includes(config.method || '')
            ) {
                const encrypted = encryptData(config.data);
                if (encrypted) {
                    config.data = { payload: encrypted };
                    const headers = new AxiosHeaders(config.headers);
                    headers.set('X-Encrypted', 'true');
                    config.headers = headers;
                }
            }

            return config;
        });

        /* ---------------- RESPONSE ---------------- */

        this.client.interceptors.response.use(
            (response) => {
                const ct = response.headers['content-type'] || '';
                const responseType = response.config?.responseType;
                const acceptsDocument =
                    responseType === 'blob' || responseType === 'arraybuffer' || responseType === 'document';

                if (ct.includes('text/html') && !acceptsDocument) {
                    const error = new APIError({
                            status: response.status || 500,
                            code: 'INVALID_RESPONSE_FORMAT',
                            message: 'Server error',
                            details: {
                                technicalMessage: 'HTML response received',
                                contentType: ct
                            },
                            source: 'backend',
                            responseData: response.data,
                            context: {
                                backendErrorCode: 'INVALID_RESPONSE_FORMAT',
                                backendErrorMessage: 'Server error',
                                endpoint: response.config?.url?.toString()
                            }
                        });
                    emitErrorPopup(error);
                    return Promise.reject(error);
                }

                const encrypted =
                    response.headers['x-encrypted'] === 'true' ||
                    response.data?.encrypted === true;

                if (encrypted && response.data?.payload) {
                    response.data = decryptData(response.data.payload);
                }

                return response;
            },
            async (rawError: unknown) => {
                let normalized = normalizeError(rawError);

                const getResponseMessage = (current: typeof normalized) => {
                    const data = current.response?.data;
                    if (!data || typeof data !== 'object') return undefined;
                    const record = data as Record<string, unknown>;
                    const error = record.error;
                    const message = record.message;
                    if (typeof error === 'string') return error;
                    if (typeof message === 'string') return message;
                    return undefined;
                };
                const getResponseCode = (current: typeof normalized) => {
                    const data = current.response?.data;
                    if (!data || typeof data !== 'object') return undefined;
                    const record = data as Record<string, unknown>;
                    const code = record.code;
                    return typeof code === 'string' && code.trim().length > 0 ? code : undefined;
                };

                let responseMessage = getResponseMessage(normalized);
                let responseCode = getResponseCode(normalized);
                const requestConfig = (rawError as { config?: AxiosRequestConfig })?.config as EsparexRequestConfig | undefined;
                const status = normalized.response?.status;
                const isCsrfError = status === 403 && /csrf/i.test(responseMessage || '');
                const isCsrfEndpoint = requestConfig?.url?.toString().endsWith(API_ROUTES.USER.CSRF_TOKEN);

                if (isCsrfError && requestConfig && !requestConfig._csrfRetry && !isCsrfEndpoint) {
                    const csrfToken = await this.getCsrfToken(true);
                    if (csrfToken) {
                        const retryHeaders = new AxiosHeaders();
                        if (requestConfig.headers instanceof AxiosHeaders) {
                            requestConfig.headers.forEach((value: AxiosHeaderValue, key: string) => {
                                retryHeaders.set(key, value);
                            });
                        } else if (requestConfig.headers && typeof requestConfig.headers === 'object') {
                            Object.entries(requestConfig.headers as Record<string, unknown>).forEach(([key, value]) => {
                                if (value !== undefined) {
                                    retryHeaders.set(key, String(value));
                                }
                            });
                        }
                        retryHeaders.set('x-csrf-token', csrfToken);

                        const retryConfig: EsparexRequestConfig = {
                            ...requestConfig,
                            headers: retryHeaders,
                            _csrfRetry: true
                        };

                        try {
                            return await this.client.request(retryConfig);
                        } catch (retryError: unknown) {
                            normalized = normalizeError(retryError);
                            responseMessage = getResponseMessage(normalized);
                            responseCode = getResponseCode(normalized);
                        }
                    }
                }

                const statusCode = normalized.response?.status;
                const latestStatus = normalized.response?.status ?? 0;
                const isExpectedBusiness4xx =
                    latestStatus >= 400 &&
                    latestStatus < 500 &&
                    latestStatus !== 429;
                if (
                    process.env.NODE_ENV === 'development' &&
                    !requestConfig?.silent &&
                    !isExpectedBusiness4xx
                ) {
                    console.groupCollapsed('[API Client] Unexpected API error');
                    logger.warn('status', latestStatus || 'unknown');
                    logger.warn('message', responseMessage || normalized.message);
                    logger.warn('code', responseCode || 'none');
                    console.groupEnd();
                }
                const source = normalized.response ? 'backend' : 'network';

                // Mark backend unhealthy on network failures so the health guard
                // blocks subsequent requests until a health check passes.
                if (source === 'network') {
                    this.isBackendHealthy = false;
                    this.healthCheckTimestamp = Date.now();
                }

                const message =
                    source === 'backend'
                        ? (responseMessage || normalized.message)
                        : 'Unable to connect to server.';
                const details =
                    source === 'backend'
                        ? normalized.response?.data
                        : { technicalMessage: normalized.message };

                const apiError = new APIError({
                        status: statusCode ?? 0,
                        code: source === 'backend' ? responseCode : 'NETWORK_FAILURE',
                        message,
                        details,
                        retryAfter: normalized.retryAfter,
                        source,
                        responseData: normalized.response?.data,
                        context: {
                            backendErrorMessage: responseMessage,
                            backendErrorCode: responseCode,
                            endpoint: requestConfig?.url?.toString(),
                        }
                    });

                if (!requestConfig?.silent) {
                    emitErrorPopup(apiError);
                }

                return Promise.reject(apiError);
            }
        );
    }

    /* ======================================================
       HEALTH CHECK
    ====================================================== */

    public async checkHealth(): Promise<boolean> {
        if (this.healthCheckPromise) return this.healthCheckPromise;

        const promise = this.client
            .get(API_ROUTES.USER.HEALTH, {
                timeout: 5000,
                // ✅ No custom headers = no CORS preflight
                silent: true // 🤫 Silence expected network errors
            } as EsparexRequestConfig)
            .then((res) => {
                const ok =
                    res.status === 200 &&
                    res.data?.success === true &&
                    res.data?.status === 'ok';

                if (!ok) logger.warn('[API Client] Health check returned non-ok:', res.data);
                this.isBackendHealthy = ok;
                this.healthCheckTimestamp = Date.now();
                return ok;
            })
            .catch((err) => {
                logger.warn('[Health Check Failed]', err.message || err);
                this.isBackendHealthy = false;
                this.healthCheckTimestamp = Date.now();
                return false;
            });

        // Store promise for deduplication
        this.healthCheckPromise = promise;

        try {
            const result = await promise;
            return result;
        } finally {
            // Clear reference when settled
            this.healthCheckPromise = null;
        }
    }

    /* ======================================================
       HTTP METHODS
    ====================================================== */

    async get<T>(url: string, config?: EsparexRequestConfig): Promise<T> {
        const res = await this.client.get<T>(url, config);
        return res.data;
    }

    async post<T>(url: string, data?: unknown, config?: EsparexRequestConfig): Promise<T> {
        const res = await this.client.post<T>(url, data, config);
        return res.data;
    }

    async put<T>(url: string, data?: unknown, config?: EsparexRequestConfig): Promise<T> {
        const res = await this.client.put<T>(url, data, config);
        return res.data;
    }

    async patch<T>(url: string, data?: unknown, config?: EsparexRequestConfig): Promise<T> {
        const res = await this.client.patch<T>(url, data, config);
        return res.data;
    }

    async delete<T>(url: string, config?: EsparexRequestConfig): Promise<T> {
        const res = await this.client.delete<T>(url, config);
        return res.data;
    }
}

let internalClient: APIClient | null = null;

const getApiClient = () => {
    if (!internalClient) {
        internalClient = new APIClient();
    }
    return internalClient;
};

// Use a proxy to maintain the 'apiClient' signature while deferring instantiation
export const apiClient = new Proxy({} as APIClient, {
    get: (_target, prop, receiver) => {
        const client = getApiClient();
        const value = Reflect.get(client, prop, receiver);
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

export default apiClient;
