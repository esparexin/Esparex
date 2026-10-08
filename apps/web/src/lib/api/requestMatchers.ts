import type { AxiosRequestConfig } from 'axios';

// ─── Request matchers (P3 extract-before-split from lib/api/client.ts) ─────
// Pure URL/method predicates for routing client behavior (health gate, popup
// suppression, OTP special-casing). Single owner; no axios instance coupling.

export function normalizeRequestPath(url?: string): string {
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
    requestConfig?: Pick<AxiosRequestConfig, 'url' | 'method'>
): boolean {
    return status === 404 && isListingDetailRequest(requestConfig?.url?.toString(), requestConfig?.method);
}

export function isSendOtpRequest(url?: string): boolean {
    if (!url) return false;
    const normalized = normalizeRequestPath(url);
    return (
        normalized === 'auth/send-otp' ||
        normalized.endsWith('/auth/send-otp') ||
        url.replace(/^\//, '').includes('auth/send-otp')
    );
}

export function isAuthMutationRequest(url?: string): boolean {
    if (!url) return false;
    if (isSendOtpRequest(url)) return true;
    const normalized = normalizeRequestPath(url);
    return (
        normalized === 'auth/verify-otp' ||
        normalized.endsWith('/auth/verify-otp') ||
        normalized === 'auth/cancel-otp' ||
        normalized.endsWith('/auth/cancel-otp') ||
        url.replace(/^\//, '').includes('auth/verify-otp') ||
        url.replace(/^\//, '').includes('auth/cancel-otp')
    );
}
