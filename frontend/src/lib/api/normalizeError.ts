
import { ErrorCategory } from "../../lib/errorHandler";

export interface NormalizedApiError {
    response?: {
        status: number;
        data?: unknown;
    };
    category: ErrorCategory;
    isExpected: boolean;
    message: string;
    retryAfter?: number; // Seconds until retry allowed (for 429 responses)
}

export function normalizeError(raw: unknown): NormalizedApiError {
    // Null / undefined / non-object
    if (!raw || typeof raw !== 'object') {
        return {
            category: ErrorCategory.UNKNOWN,
            isExpected: false,
            message: raw ? String(raw) : 'Unknown error occurred'
        };
    }

    const error = raw as {
        response?: { status?: number; data?: unknown };
        request?: unknown;
        message?: string;
    };

    /**
     * Axios error WITH response
     * (Server responded with non-2xx)
     */
    if (error.response) {
        const status = error.response.status || 500;

        // Extract retry time from 429 responses
        let retryAfter: number | undefined;
        if (status === 429 && error.response.data) {
            const data = error.response.data as {
                retryAfter?: number;
                retry_after?: number;
            };
            retryAfter = data.retryAfter || data.retry_after;
        }

        return {
            response: {
                status,
                data: error.response.data
            },
            category: status >= 500 ? ErrorCategory.SYSTEM : ErrorCategory.NETWORK,
            isExpected: status < 500 || status === 429,
            message: error.message || 'Request failed',
            retryAfter
        };
    }

    /**
     * Axios error WITHOUT response
     * (DNS / CORS / timeout / connection refused)
     */
    if (error.request) {
        return {
            category: ErrorCategory.NETWORK,
            isExpected: false,
            message: error.message || 'Network error'
        };
    }

    /**
     * Unknown runtime error
     */
    return {
        category: ErrorCategory.UNKNOWN,
        isExpected: false,
        message: error.message || 'Unexpected error'
    };
}
