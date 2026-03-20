import { Request } from 'express';
import crypto from 'crypto';

/**
 * Extracts distinct device fingerprint signals from request headers
 * In a real-world scenario, the frontend would also pass an explicit device ID via headers
 * e.g., 'x-device-fingerprint' generated via ClientJs/FingerprintJS.
 */
export const extractDeviceFingerprint = (req: Request): string => {
    // Check if client passed an explicit fingerprint
    const explicitFingerprint = req.headers['x-device-fingerprint'] as string;
    if (explicitFingerprint) {
        return explicitFingerprint;
    }

    // Fallback: Generate a server-side pseudo-fingerprint
    const headers = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['sec-ch-ua'] || '',
        req.headers['sec-ch-ua-platform'] || '',
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    ].join('|');

    return crypto.createHash('sha256').update(headers).digest('hex');
};
