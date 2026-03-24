import crypto from 'crypto';
import { env } from '../config/env';

const getOtpHashSecret = (): string => {
    const secret = env.OTP_HASH_SECRET || env.JWT_SECRET;

    if (env.NODE_ENV === 'production' && !env.OTP_HASH_SECRET) {
        throw new Error('OTP_HASH_SECRET must be configured in production');
    }

    return secret;
};

export const hashOtp = (otp: string): string => {
    return crypto
        .createHmac('sha256', getOtpHashSecret())
        .update(otp)
        .digest('hex');
};

export const verifyOtpHash = (otp: string, expectedHash: string): boolean => {
    const computedHash = hashOtp(otp);

    const a = Buffer.from(computedHash, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};
