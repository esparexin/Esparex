import crypto from 'crypto';

const getOtpHashSecret = (): string => {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

    if (process.env.NODE_ENV === 'production' && !process.env.OTP_HASH_SECRET) {
        throw new Error('OTP_HASH_SECRET must be configured in production');
    }

    if (!secret) {
        throw new Error('OTP hash secret is not configured');
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
