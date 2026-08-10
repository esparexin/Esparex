import net from 'net';
import logger from './logger';

/**
 * 🛡️ Outbound SSRF & Private IP Guard
 * Centralized Single Source of Truth (SSOT) for validating outbound HTTP requests
 * and preventing Server-Side Request Forgery (SSRF).
 */

const PRIVATE_IP_PATTERNS = [
    /^127\./,                           // Loopback
    /^10\./,                            // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,   // Private Class B
    /^192\.168\./,                      // Private Class C
    /^169\.254\./,                      // Link-local / AWS / GCP Metadata
    /^0\./,                             // Current network
    /^::1$/,                            // IPv6 Loopback
    /^fc00:/i,                          // IPv6 Unique Local
    /^fe80:/i,                          // IPv6 Link-local
];

/**
 * Checks if an IP string is a private, loopback, or cloud metadata IP address.
 */
export function isPrivateIpAddress(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return true;
    const cleanIp = ip.trim();
    if (net.isIP(cleanIp) === 0) return false;
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(cleanIp));
}

/**
 * Validates a target URL string before making outbound HTTP requests.
 * Rejects non-HTTP(S) protocols, private IPs, and cloud metadata endpoints.
 */
export function validateOutboundUrl(targetUrl: string): { valid: boolean; reason?: string; url?: URL } {
    if (!targetUrl || typeof targetUrl !== 'string') {
        return { valid: false, reason: 'URL string is required' };
    }

    try {
        const parsedUrl = new URL(targetUrl.trim());

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            logger.warn('[SSRF Guard] Blocked invalid protocol', { targetUrl, protocol: parsedUrl.protocol });
            return { valid: false, reason: 'Invalid protocol: Only HTTP and HTTPS are permitted' };
        }

        const hostname = parsedUrl.hostname.toLowerCase();

        if (hostname === 'localhost' || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
            logger.warn('[SSRF Guard] Blocked local hostname', { targetUrl, hostname });
            return { valid: false, reason: 'Outbound requests to local hosts are restricted' };
        }

        if (isPrivateIpAddress(hostname)) {
            logger.warn('[SSRF Guard] Blocked private IP target', { targetUrl, hostname });
            return { valid: false, reason: 'Outbound requests to private IP addresses are restricted' };
        }

        return { valid: true, url: parsedUrl };
    } catch (err: unknown) {
        logger.warn('[SSRF Guard] URL parsing failed', { targetUrl, error: err instanceof Error ? err.message : String(err) });
        return { valid: false, reason: 'Invalid URL format' };
    }
}
