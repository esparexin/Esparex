import { randomInt } from 'crypto';

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses Node.js crypto.randomInt which is CSPRNG.
 */
export const generateSecureOtp = (): string => {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && process.env.USE_DEFAULT_OTP === 'true') {
        return process.env.DEV_STATIC_OTP || '123456';
    }

    return randomInt(100000, 1000000).toString();
};
