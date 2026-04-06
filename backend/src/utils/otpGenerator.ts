import { randomInt } from 'crypto';
import { env } from '../config/env';

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses Node.js crypto.randomInt which is CSPRNG.
 */
export const generateSecureOtp = (): string => {
    if (env.USE_DEFAULT_OTP) {
        return env.DEV_STATIC_OTP;
    }

    return randomInt(100000, 1000000).toString();
};
