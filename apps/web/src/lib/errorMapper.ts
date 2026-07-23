/**
 * Centralized Error Mapper
 * Maps API errors and exceptions to user-friendly messages
 * NEVER exposes raw error.message to prevent information disclosure
 */

import logger from "@/lib/logger";

export interface ApiError {
    code?: string;
    message?: string;
    userMessage?: string;
    status?: number;
}

/**
 * Standard error messages mapped by error code
 */
const ERROR_MESSAGES: Record<string, string> = {
    // Authentication & Authorization
    'AUTH_INVALID_CREDENTIALS': 'Invalid email or password',
    'AUTH_INVALID_OTP': 'Invalid OTP entered. Please check and try again',
    'AUTH_OTP_EXPIRED': 'OTP has expired. Please request a new code',
    'AUTH_OTP_MAX_ATTEMPTS': 'Too many invalid OTP attempts. Please try again later',
    'AUTH_TOKEN_EXPIRED': 'Your session has expired. Please log in again',
    'AUTH_UNAUTHORIZED': 'You do not have permission to perform this action',
    'AUTH_FORBIDDEN': 'Access denied',
    'USER_SUSPENDED': 'Your account has been suspended. Please contact support',
    'USER_NOT_FOUND': 'User account not found',

    // Validation
    'VALIDATION_ERROR': 'Please check your input and try again',
    'VALIDATION_REQUIRED_FIELD': 'Please fill in all required fields',
    'VALIDATION_INVALID_FORMAT': 'Invalid format. Please check your input',

    // Network
    'NETWORK_ERROR': 'Network error. Please check your connection',
    'NETWORK_TIMEOUT': 'Request timed out. Please try again',

    // Server
    'SERVER_ERROR': 'Something went wrong. Please try again later',
    'SERVER_MAINTENANCE': 'System is under maintenance. Please try again later',

    // Business Logic & Listings
    'BUSINESS_DUPLICATE': 'This item already exists',
    'BUSINESS_NOT_FOUND': 'Item not found',
    'BUSINESS_QUOTA_EXHAUSTED': 'You have reached your limit',
    'BUSINESS_SUSPENDED': 'Your account is suspended. Please contact support',
    'DUPLICATE_AD': 'You already posted a similar active listing.',
    'LISTING_NOT_FOUND': 'Listing not found or no longer active.',
    'LISTING_LIMIT_EXCEEDED': 'Free listing quota reached. Upgrade your plan to post more ads.',
    'QUOTA_EXHAUSTED': 'Ad posting quota exhausted. Buy an ad pack to continue.',
    'INVALID_CATEGORY_ATTRIBUTES': 'Selected attributes do not match the required category criteria.',
    'IMAGE_CATEGORY_MISMATCH': 'Uploaded photo does not match the selected category.',
    'IMAGE_MODERATION_FAILED': 'Image flagged by moderation policy. Please upload a clear product photo.',

    // Security & Fraud
    'FRAUD_DETECTED': 'Action flagged by security policy. Contact support if you believe this is an error.',
    'SPAM_DETECTED': 'Content flagged by anti-spam filters.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later',
    'IDEMPOTENCY_CONFLICT': 'Your request is already processing or was recently completed.',
    'IDEMPOTENCY_KEY_REUSED': 'Your submission is already being processed.',
    'IDEMPOTENCY_IN_PROGRESS': 'Your previous submit is still processing. Please wait a few seconds and retry.',
    'AD_VERSION_CONFLICT': 'This listing was updated elsewhere. Refresh and retry your changes.',

    // Payment
    'PAYMENT_FAILED': 'Payment failed. Please try again',
    'PAYMENT_ALREADY_COMPLETED': 'Payment is already processed.',
    'PAYMENT_INSUFFICIENT_FUNDS': 'Insufficient credits. Please top up your wallet',

    // File Upload
    'UPLOAD_FILE_TOO_LARGE': 'File is too large. Maximum size is 5MB',
    'UPLOAD_INVALID_TYPE': 'Invalid file type',
};

/**
 * Maps error to user-friendly message
 * @param error - Error object from API or exception
 * @param fallback - Optional fallback message
 * @returns User-friendly error message
 */
export function mapErrorToMessage(error: unknown, fallback?: string): string {
    // Handle null/undefined
    if (!error) {
        return fallback || 'An unexpected error occurred';
    }

    // If the error already carries a user-friendly message (e.g. EsparexError), return it directly.
    if (typeof error === 'object' && error !== undefined && typeof (error as { userMessage?: unknown }).userMessage === 'string') {
        const msg = ((error as { userMessage: string }).userMessage).trim();
        if (msg.length > 0) return msg;
    }

    // Handle ApiError with code
    if (typeof error === 'object' && error !== undefined) {
        const apiError = error as ApiError;
        const nestedResponseStatus = (
            apiError as { response?: { status?: number } }
        ).response?.status;
        const nestedContextStatus = (
            apiError as { context?: { statusCode?: number } }
        ).context?.statusCode;
        const nestedStatus =
            nestedResponseStatus ||
            nestedContextStatus;
        const status = apiError.status || nestedStatus;
        const normalizedUserMessage =
            typeof apiError.userMessage === 'string' && apiError.userMessage.trim().length > 0
                ? apiError.userMessage.trim()
                : undefined;
        const nestedCode = (() => {
            const direct = (apiError as { code?: unknown }).code;
            if (typeof direct === 'string' && direct.trim().length > 0) return direct;
            const contextCode = (apiError as { context?: { backendErrorCode?: unknown } }).context?.backendErrorCode;
            if (typeof contextCode === 'string' && contextCode.trim().length > 0) return contextCode;
            const responseCode = (
                apiError as { response?: { data?: { code?: unknown } } }
            ).response?.data?.code;
            if (typeof responseCode === 'string' && responseCode.trim().length > 0) return responseCode;
            return undefined;
        })();

        if (nestedCode) {
            logger.warn("[ErrorMapper] Backend error code", {
                code: nestedCode,
                status: status || null,
            });
        }

        if (nestedCode && ERROR_MESSAGES[nestedCode]) {
            return ERROR_MESSAGES[nestedCode]!;
        }

        // Prefer curated API user messages for expected client/business errors.
        if (normalizedUserMessage && typeof status === 'number' && status >= 400 && status < 500) {
            return normalizedUserMessage;
        }

        // Check for error code mapping
        if (apiError.code && ERROR_MESSAGES[apiError.code]) {
            return ERROR_MESSAGES[apiError.code]!;
        }

        // Check for HTTP status code
        if (status) {
            switch (status) {
                case 400:
                    return 'Invalid request. Please check your input';
                case 401:
                    return 'Please log in to continue';
                case 403:
                    return 'You do not have permission to perform this action';
                case 404:
                    return 'The requested item was not found';
                case 409:
                    return 'This item already exists';
                case 413:
                    return 'Uploaded images are too large. Please use smaller images or fewer photos.';
                case 429:
                    return 'Too many requests. Please try again later';
                case 500:
                case 502:
                case 503:
                    return 'Server error. Please try again later';
                case 504:
                    return 'Request timed out. Please try again';
                default:
                    break;
            }
        }
    }

    // Handle network errors
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return 'Network error. Please check your connection';
        }

        if (errorMessage.includes('timeout')) {
            return 'Request timed out. Please try again';
        }

        if (errorMessage.includes('abort')) {
            return 'Request was cancelled';
        }
    }

    // Fallback to generic message (NEVER expose raw error.message)
    return fallback || 'An unexpected error occurred. Please try again';
}

/**
 * Checks if error is a network error
 */
import { isNetworkError } from "@esparex/shared";

export { isNetworkError };

/**
 * Checks if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (typeof error === 'object' && error !== undefined) {
        const apiError = error as ApiError;
        return apiError.status === 401 || apiError.code?.startsWith('AUTH_') || false;
    }
    return false;
}
