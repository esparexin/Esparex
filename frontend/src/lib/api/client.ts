
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
} from "@/lib/api/routes";
import { TraceContext } from "@shared/observability/trace";
import logger from "@/lib/logger";
import { resolveBrowserApiBaseUrl } from "./browserApiBase";

/* ======================================================
   BASE_URL
====================================================== */

let BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

if (typeof window !== 'undefined') {
    const resolvedBaseUrl = resolveBrowserApiBaseUrl(BASE_URL);
    if (resolvedBaseUrl !== BASE_URL) {
        logger.warn(`[API Client] Aligning API host to browser hostname: ${resolvedBaseUrl}`);
        BASE_URL = resolvedBaseUrl;
    }
}

// 📐 STANDARDIZE TRAILING SLASH FOR RELATIVE PATH RESOLUTION
BASE_URL = BASE_URL.replace(/\/$/, '') + '/';

export interface EsparexRequestConfig extends AxiosRequestConfig {
    skipHealthCheck?: boolean;
    silent?: boolean;
    _csrfRetry?: boolean;
    _retryCount?: number;
    maxRetries?: number;
}

function normalizeRequestPath(url?: string): string {
    if (!url) return '';

    try {
        const pathname = new URL(url, 'http://localhost').pathname;
        return pathname
            .replace(/^\/+/, '')
            .replace(/^api\/v1\/?/i, '')
            .replace(/\/+$/, '');
    } catch {
        return url
            .replace(/^\/+/, '')
            .replace(/^api\/v1\/?/i, '')
            .replace(/[?#].*$/, '')
            .replace(/\/+$/, '');
    }
}

export function isListingDetailRequest(url?: string, method?: string): boolean {
    if ((method ?? 'get').toLowerCase() !== 'get') return false;

    const match = normalizeRequestPath(url).match(/^listings\/([^/]+)$/i);
    if (!match) return false;

    const identifier = match[1]?.trim().toLowerCase();
    return Boolean(identifier && identifier !== 'mine');
}

export function shouldSuppressPopupForApiError(
    status: number | undefined,
    requestConfig?: Pick<EsparexRequestConfig, 'url' | 'method'>
): boolean {
    return status === 404 && isListingDetailRequest(requestConfig?.url?.toString(), requestConfig?.method);
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

    private createHealthGateError(config?: Pick<EsparexRequestConfig, 'url'>): APIError {
        return new APIError({
            status: 503,
            code: 'BACKEND_UNAVAILABLE',
            message: 'Backend service unavailable.',
            details: { technicalMessage: 'Health check failed' },
            source: 'health-gate',
            context: {
                backendErrorCode: 'BACKEND_UNAVAILABLE',
                backendErrorMessage: 'Backend service unavailable.',
                endpoint: config?.url?.toString(),
            }
        });
    }

    private triggerBackendHealthProbe(): void {
        if (this.healthCheckPromise) {
            return;
        }

        void this.checkHealth();
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

            if (this.healthCheckPromise) {
                const ok = await this.healthCheckPromise;
                if (!ok) {
                    const error = this.createHealthGateError(config);
                    if (!(config as EsparexRequestConfig).silent) {
                        emitErrorPopup(error);
                    }
                    return Promise.reject(error);
                }
            }

            if (!this.isBackendHealthy) {
                if (Date.now() - this.healthCheckTimestamp > this.HEALTH_CACHE_MS) {
                    const ok = await this.checkHealth();
                    if (ok) return config;
                }

                const error = this.createHealthGateError(config);
                if (!(config as EsparexRequestConfig).silent) {
                    emitErrorPopup(error);
                }
                return Promise.reject(error);
            }

            const method = config.method?.toLowerCase();
            const headers = new AxiosHeaders(config.headers);
            
            // 🆔 TRACE CORRELATION
            headers.set('x-correlation-id', TraceContext.getCorrelationId());
            config.headers = headers;

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
                const requestUrl = requestConfig?.url?.toString();
                const status = normalized.response?.status;
                const isCsrfError = status === 403 && /csrf/i.test(responseMessage || '');
                const isCsrfEndpoint = requestUrl?.endsWith(API_ROUTES.USER.CSRF_TOKEN);
                const isHealthEndpoint = requestUrl?.endsWith(API_ROUTES.USER.HEALTH);

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

                const message =
                    source === 'backend'
                        ? (responseMessage || normalized.message)
                        : 'Unable to connect to server.';
                const details =
                    source === 'backend'
                        ? normalized.response?.data
                        : { technicalMessage: normalized.message };

                // 🔄 AUTOMATIC RETRY FOR TRANSIENT FAILURES
                const maxRetries = requestConfig?.maxRetries ?? 1;
                const currentRetryCount = requestConfig?._retryCount ?? 0;
                const isTransientError =
                    latestStatus === 0 || // Network error
                    latestStatus === 408 || // Timeout
                    latestStatus === 429 || // Too many requests
                    latestStatus >= 500; // Server error

                if (isTransientError && requestConfig && currentRetryCount < maxRetries) {
                    const delay = Math.pow(2, currentRetryCount) * 1000;
                    logger.warn(`[API Client] Transient failure (${latestStatus}). Retrying in ${delay}ms... (Attempt ${currentRetryCount + 1}/${maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    const retryConfig: EsparexRequestConfig = {
                        ...requestConfig,
                        _retryCount: currentRetryCount + 1
                    };
                    return this.client.request(retryConfig);
                }

                const normalizedMessage = normalized.message.toLowerCase();
                const isAbortLikeNetworkError =
                    normalizedMessage.includes('abort') ||
                    normalizedMessage.includes('cancel');

                if (source === 'network' && !isHealthEndpoint && !isAbortLikeNetworkError) {
                    this.triggerBackendHealthProbe();
                }

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

                if (!requestConfig?.silent && !shouldSuppressPopupForApiError(apiError.status, requestConfig)) {
                    // For retryable errors that exhausted automatic retries or are not candidate for auto-retry, offer manual retry action.
                    const isManualRetryable = isTransientError;
                    const onRetry =
                        isManualRetryable && requestConfig
                            ? () => { void this.client.request({ ...requestConfig, _retryCount: 0 } as EsparexRequestConfig); }
                            : undefined;
                    emitErrorPopup(apiError, onRetry);
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
