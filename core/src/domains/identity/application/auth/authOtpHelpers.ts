import Otp from '../../../../models/Otp';
import User from '../../../../models/User';
import logger from '../../../../utils/logger';
import { env } from '../../../../config/env';
import { 
    OtpProvider,
    Role
} from '@esparex/contracts';
import { 
    getMobileVariants, 
} from '../../../../utils/phoneUtils';
import { recordOtpAbuseSignal } from '../../../../utils/securityMonitoring';

export type AuthFailure = {
    success: false;
    status: number;
    error: string;
    code?: string;
    attemptsLeft?: number;
    lockUntil?: string;
};

export type SendOtpSuccess = {
    success: true;
    isNewUser: boolean;
    otpExpiresIn: number;
    name?: string;
};

export type VerifyOtpSuccess = {
    success: true;
    user: Record<string, unknown>;
    token: string;
};

export type SendOtpResult = SendOtpSuccess | AuthFailure;
export type VerifyOtpResult = VerifyOtpSuccess | AuthFailure;

export const OTP_EXPIRY_SECONDS = 300;
export const OTP_MAX_ATTEMPTS = 5;
export const LOCK_DURATION_MS =
    env.NODE_ENV === 'production'
        ? 30 * 60 * 1000
        : 2 * 60 * 1000;
export const isLocalOtpLockBypass =
    env.NODE_ENV === 'development' &&
    !env.CI &&
    env.AUTH_BYPASS_OTP_LOCK === 'true';
export const isStaticOtpBypassEnabled = (): boolean =>
    env.OTP_PROVIDER === OtpProvider.TEST || env.USE_DEFAULT_OTP === true;

export const isStaticOtpBypassMatch = (otp: string): boolean =>
    isStaticOtpBypassEnabled() && otp === env.DEV_STATIC_OTP;

export const createFailure = (
    status: number,
    error: string,
    extras: Omit<AuthFailure, 'success' | 'status' | 'error'> = {}
): AuthFailure => ({
    success: false,
    status,
    error,
    ...extras
});

export const findUserByMobile = async (digits10: string) => {
    const variants = getMobileVariants(digits10);
    return User.findOne({ mobile: { $in: variants } });
};

export const lockUserForOtpAbuse = async (
    user: Awaited<ReturnType<typeof findUserByMobile>>,
    now: Date
): Promise<Date> => {
    const lockUntil =
        user?.lockUntil && user.lockUntil > now
            ? user.lockUntil
            : new Date(now.getTime() + LOCK_DURATION_MS);

    if (user) {
        user.failedLoginAttempts = Math.max(user.failedLoginAttempts || 0, OTP_MAX_ATTEMPTS);
        user.lockUntil = lockUntil;
        await user.save();
    }

    return lockUntil;
};

export const getUserAuthFailure = (
    user: { status?: string; lockUntil?: Date | null; role?: string; mobile?: string } | null,
    now: Date
): AuthFailure | null => {
    if (!user) return null;

    if (typeof user.role === 'string' && [Role.ADMIN, Role.MODERATOR, Role.SUPER_ADMIN].includes(user.role as Role)) {
        return createFailure(401, 'Invalid credentials', { code: 'AUTH_FAILED' });
    }

    if (user.status === 'banned') {
        return createFailure(403, 'Your account has been permanently banned. Contact support if you think this is a mistake.', {
            code: 'USER_BANNED'
        });
    }
    if (user.status === 'suspended') {
        return createFailure(403, 'Your account is suspended. Please contact support.', {
            code: 'USER_SUSPENDED'
        });
    }

    if (!isLocalOtpLockBypass && user.lockUntil && user.lockUntil > now) {
        logger.warn('Account temporarily locked', {
            phone: typeof user.mobile === 'string' ? user.mobile.slice(-4) : 'unknown',
            lockUntil: user.lockUntil,
            now
        });
        const mobileSuffix = typeof user.mobile === 'string'
            ? user.mobile.replace(/\D/g, '').slice(-4).padStart(4, '*')
            : '****';
        recordOtpAbuseSignal({
            mobileSuffix,
            reason: 'locked',
        });
        return createFailure(423, 'Account temporarily locked. Try again later.', {
            code: 'OTP_LOCKED',
            lockUntil: user.lockUntil.toISOString()
        });
    }

    return null;
};

export const handleOtpAttemptFailure = async (
    mobileDigits: string,
    user: Awaited<ReturnType<typeof findUserByMobile>>,
    now: Date
): Promise<AuthFailure> => {
    const mobileVariants = getMobileVariants(mobileDigits);
    const mobileSuffix = mobileDigits.slice(-4).padStart(4, '*');
    
    if (user) {
        const lockUntil = await lockUserForOtpAbuse(user, now);
        recordOtpAbuseSignal({
            mobileSuffix,
            reason: 'locked',
            userId: user._id ? String(user._id) : undefined,
        });
        await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        return createFailure(423, 'Too many invalid OTP attempts. Account locked temporarily.', {
            code: 'OTP_LOCKED',
            lockUntil: lockUntil.toISOString()
        });
    }

    recordOtpAbuseSignal({
        mobileSuffix,
        reason: 'invalid_otp',
    });
    await Otp.deleteMany({ mobile: { $in: mobileVariants } });
    return createFailure(400, 'Invalid OTP', {
        code: 'OTP_INVALID',
        attemptsLeft: 0
    });
};
