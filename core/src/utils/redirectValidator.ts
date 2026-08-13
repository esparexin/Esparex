import { getFrontendAppUrl, getAdminAppUrl } from './appUrl';
import logger from './logger';

/**
 * 🛡️ Redirect URL Validator (Open Redirect Protection SSOT)
 * Validates target URLs before issuing res.redirect() to prevent Open Redirect attacks.
 */

const DEFAULT_ALLOWED_DOMAINS = [
    'esparex.in',
    'admin.esparex.in',
    'api.esparex.in',
    'localhost',
    '127.0.0.1'
];

/**
 * Validates a redirect URL. Returns a safe redirect target path or URL string.
 * If the target URL is relative (starts with / but not //), it is accepted.
 * If it is an absolute URL, its hostname must match an allowed domain origin.
 */
export function validateRedirectUrl(targetUrl: unknown, fallbackUrl: string = '/'): string {
    if (!targetUrl || typeof targetUrl !== 'string') {
        return fallbackUrl;
    }

    const trimmed = targetUrl.trim();

    // Prevent protocol-relative URL bypasses like "//evil.com"
    if (trimmed.startsWith('//')) {
        logger.warn('[RedirectValidator] Blocked protocol-relative redirect', { targetUrl: trimmed });
        return fallbackUrl;
    }

    // Relative URLs starting with single / are safe
    if (trimmed.startsWith('/') && !trimmed.startsWith('/\\')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            logger.warn('[RedirectValidator] Blocked non-http redirect protocol', { targetUrl: trimmed, protocol: parsed.protocol });
            return fallbackUrl;
        }

        const hostname = parsed.hostname.toLowerCase();
        const configuredFrontend = new URL(getFrontendAppUrl()).hostname.toLowerCase();
        const configuredAdmin = new URL(getAdminAppUrl()).hostname.toLowerCase();

        const isAllowed = DEFAULT_ALLOWED_DOMAINS.includes(hostname) ||
            hostname === configuredFrontend ||
            hostname === configuredAdmin ||
            hostname.endsWith('.esparex.in') ||
            hostname.endsWith('.vercel.app');

        if (isAllowed) {
            return trimmed;
        }

        logger.warn('[RedirectValidator] Blocked unallowed external redirect domain', { targetUrl: trimmed, hostname });
        return fallbackUrl;
    } catch {
        logger.warn('[RedirectValidator] Failed to parse redirect URL', { targetUrl: trimmed });
        return fallbackUrl;
    }
}
