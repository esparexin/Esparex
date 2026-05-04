"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDeviceFingerprint = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Extracts distinct device fingerprint signals from request headers
 * In a real-world scenario, the frontend would also pass an explicit device ID via headers
 * e.g., 'x-device-fingerprint' generated via ClientJs/FingerprintJS.
 */
const extractDeviceFingerprint = (req) => {
    // Check if client passed an explicit fingerprint
    const explicitFingerprint = req.headers['x-device-fingerprint'];
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
    return crypto_1.default.createHash('sha256').update(headers).digest('hex');
};
exports.extractDeviceFingerprint = extractDeviceFingerprint;
//# sourceMappingURL=deviceFingerprint.js.map