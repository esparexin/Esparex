import Otp from '../models/Otp';
import User from '../models/User';
import Business from '../models/Business';
import { generateToken } from '../utils/auth';
import { serializeDoc } from '../utils/serialize';
import logger from '../utils/logger';
import { generateSecureOtp } from '../utils/otpGenerator';
import { normalizeBusinessStatus } from '../utils/businessStatus';
import { hashOtp, verifyOtpHash } from '../utils/otpSecurity';
import { env } from '../config/env';
import { 
    canonicalizeToIndian, 
    getMobileVariants, 
    normalizeTo10Digits 
} from '../utils/phoneUtils';
import { getAuthCookieOptions, getLegacyHostOnlyAuthCookieOptions } from '../utils/cookieHelper';

type AuthFailure = {
    success: false;
    status: number;
    error: string;
    code?: string;
    attemptsLeft?: number;
    lockUntil?: string;
};

type SendOtpSuccess = {
    success: true;
    isNewUser: boolean;
    otpExpiresIn: number;
    name?: string;
};

type VerifyOtpSuccess = {
    success: true;
    user: Record<string, unknown>;
    token: string;
};

export type SendOtpResult = SendOtpSuccess | AuthFailure;
export type VerifyOtpResult = VerifyOtpSuccess | AuthFailure;

const OTP_EXPIRY_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 5;
// 2 minutes in dev, 30 minutes in production
const LOCK_DURATION_MS =
    env.NODE_ENV === 'production'
        ? 30 * 60 * 1000
        : 2 * 60 * 1000;
const isLocalOtpLockBypass =
    env.NODE_ENV === 'development' &&
    !env.CI &&
    env.AUTH_BYPASS_OTP_LOCK === 'true';

const createFailure = (
    status: number,
    error: string,
    extras: Omit<AuthFailure, 'success' | 'status' | 'error'> = {}
): AuthFailure => ({
    success: false,
    status,
    error,
    ...extras
});

// toCanonicalMobile and toMobileVariants removed in favor of phoneUtils

const findUserByMobile = async (digits10: string) => {
    const variants = getMobileVariants(digits10);
    return User.findOne({ mobile: { $in: variants } });
};



const lockUserForOtpAbuse = async (
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

const getUserAuthFailure = (
    user: { status?: string; lockUntil?: Date | null; role?: string; mobile?: string } | null,
    now: Date
): AuthFailure | null => {
    if (!user) return null;

    // Admin roles cannot use the user OTP login endpoint
    if (typeof user.role === 'string' && ['admin', 'moderator', 'super_admin'].includes(user.role)) {
        return createFailure(401, 'Invalid credentials', { code: 'AUTH_FAILED' });
    }

    // Banned / suspended / deleted accounts → 403 (not an auth failure, an account restriction)
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
    // Deleted accounts are treated as new users — handled in verifyLoginOtp
    // so they can re-register with the same number with a clean slate.

    if (!isLocalOtpLockBypass && user.lockUntil && user.lockUntil > now) {
        logger.warn('Account temporarily locked', {
            phone: typeof user.mobile === 'string' ? user.mobile.slice(-4) : 'unknown',
            lockUntil: user.lockUntil,
            now
        });
        return createFailure(423, 'Account temporarily locked. Try again later.', {
            code: 'OTP_LOCKED',
            lockUntil: user.lockUntil.toISOString()
        });
    }

    return null;
};

const handleOtpAttemptFailure = async (
    mobileDigits: string,
    user: Awaited<ReturnType<typeof findUserByMobile>>,
    now: Date
): Promise<AuthFailure> => {
    const mobileVariants = getMobileVariants(mobileDigits);
    
    if (user) {
        const lockUntil = await lockUserForOtpAbuse(user, now);
        await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        return createFailure(423, 'Too many invalid OTP attempts. Account locked temporarily.', {
            code: 'OTP_LOCKED',
            lockUntil: lockUntil.toISOString()
        });
    }

    await Otp.deleteMany({ mobile: { $in: mobileVariants } });
    return createFailure(400, 'Invalid OTP', {
        code: 'OTP_INVALID',
        attemptsLeft: 0
    });
};

const dispatchOtpSms = async (mobile: string, otp: string): Promise<void> => {
    if (env.NODE_ENV === 'test') return;

    // Static OTP bypass: skip SMS dispatch when USE_DEFAULT_OTP is enabled
    const IS_DLT_PENDING_BYPASS = true; // TODO: Remove after DLT registration
    if (env.USE_DEFAULT_OTP || IS_DLT_PENDING_BYPASS) {
        if (env.NODE_ENV === 'production') {
            // Pre-launch testing mode: static OTP (DEV_STATIC_OTP) is active and SMS is not sent.
            // Real users cannot log in without knowing the static OTP.
            // ACTION REQUIRED: remove USE_DEFAULT_OTP from Render and configure MSG91 before going live.
            logger.warn('[OTP] STATIC OTP BYPASS ACTIVE (DLT PENDING) — static OTP 123456 active, SMS dispatch skipped.');
        } else {
            logger.info('Static OTP fallback active — skipping SMS dispatch', { phone: mobile.slice(-4) });
        }
        return; // ← skip SMS dispatch regardless of environment
    }

    if (!env.MSG91_AUTH_KEY || !env.MSG91_SENDER_ID) {
        logger.warn('OTP SMS provider not configured; OTP dispatch skipped', { phone: mobile.slice(-4) });
        return;
    }

    try {
        const { default: axios } = await import('axios');
        const response = await axios.post(
            'https://api.msg91.com/api/v5/otp',
            {
                template_id: env.MSG91_TEMPLATE_ID,
                mobile: mobile.startsWith('+91') ? mobile.slice(1) : `91${mobile.replace(/\D/g, '').slice(-10)}`,
                authkey: env.MSG91_AUTH_KEY,
                otp
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            }
        );

        if (response.data?.type === 'success') {
            logger.info('OTP SMS dispatched successfully', { phone: mobile.slice(-4) });
        } else {
            logger.warn('OTP SMS dispatch returned non-success', {
                phone: mobile.slice(-4),
                type: response.data?.type
            });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('OTP SMS dispatch failed', { phone: mobile.slice(-4), error: message });
        // Do NOT throw — login flow continues; OTP is stored and verifiable
    }
};

/**
 * Centralized Authentication Service
 * Handles User Login, OTP Management, and Token Generation.
 */
export class AuthService {
    static clearUserSession(res: import('express').Response): void {
        res.clearCookie('esparex_auth', getLegacyHostOnlyAuthCookieOptions(0));
        res.clearCookie('esparex_auth', getAuthCookieOptions(0));
    }

    static async cancelOtpSession(mobile: string): Promise<{ success: true }> {
        const mobileDigits = normalizeTo10Digits(mobile);
        const mobileVariants = getMobileVariants(mobileDigits);

        await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        logger.info('OTP session invalidated', { phone: mobileDigits.slice(-4) });

        return { success: true };
    }

    static async sendLoginOtp(mobile: string): Promise<SendOtpResult> {
        const canonicalMobile = canonicalizeToIndian(mobile);
        const mobileDigits = normalizeTo10Digits(mobile);
        const mobileVariants = getMobileVariants(mobileDigits);
        const now = new Date();

        const [user] = await Promise.all([
            findUserByMobile(mobileDigits),
            Otp.findOne({ mobile: { $in: mobileVariants } }).sort({ createdAt: -1 })
        ]);

        // Treat deleted accounts as new users — they may re-register with the same number
        const effectiveUser = user?.status === 'deleted' ? null : user;
        const userFailure = getUserAuthFailure(effectiveUser, now);
        if (userFailure) {
            return userFailure;
        }

        const otpValue = generateSecureOtp();
        const otpHash = hashOtp(otpValue);
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);

        // Reset lock state on user if lock has expired (so next verify cycle starts clean)
        if (effectiveUser && (effectiveUser.failedLoginAttempts || effectiveUser.lockUntil)) {
            effectiveUser.failedLoginAttempts = 0;
            effectiveUser.lockUntil = undefined;
            await effectiveUser.save();
        }

        await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        await Otp.create({
            mobile: canonicalMobile,
            otpHash,
            attempts: 0,
            expiresAt,
            createdAt: now
        });

        await dispatchOtpSms(canonicalMobile, otpValue);
        logger.info('OTP generated for login', { phone: canonicalMobile.slice(-4) });

        return {
            success: true,
            isNewUser: !effectiveUser,
            otpExpiresIn: OTP_EXPIRY_SECONDS,
            name: effectiveUser?.name || undefined
        };
    }

    static async verifyLoginOtp(mobile: string, otp: string, name?: string): Promise<VerifyOtpResult> {
        const mobileDigits = normalizeTo10Digits(mobile);
        const mobileVariants = getMobileVariants(mobileDigits);
        const now = new Date();
        const normalizedName = name?.trim();

        const [userFromMobile, otpRecord] = await Promise.all([
            findUserByMobile(mobileDigits),
            Otp.findOne({ mobile: { $in: mobileVariants } }).sort({ createdAt: -1 })
        ]);

        const userFailure = getUserAuthFailure(userFromMobile, now);
        if (userFailure) {
            return userFailure;
        }



        if (!otpRecord) {
            // Static OTP bypass: allow login without a record if USE_DEFAULT_OTP is enabled
            const IS_DLT_PENDING_BYPASS = true; // TODO: Remove after DLT registration
            if ((env.USE_DEFAULT_OTP || IS_DLT_PENDING_BYPASS) && otp === env.DEV_STATIC_OTP) {
                logger.info('Static OTP bypass: accepting valid test code without database record');
                // Proceed directly to user resolution/creation since we don't have a record to track attempts
            } else {
                return createFailure(400, 'Invalid OTP', { code: 'OTP_INVALID' });
            }
        } else {
            // otpRecord is guaranteed non-null here (the if(!otpRecord) above handles null).
            // Non-null assertions silence TS18047 which cannot narrow across the
            // USE_DEFAULT_OTP early-return branch inside the if-block.
            if (otpRecord.expiresAt < now) {
                // DEV GRACE: If using default OTP, allow expired records to persist for manual testing
                const IS_DLT_PENDING_BYPASS = true; // TODO: Remove after DLT registration
                const isDefaultOtp = (env.USE_DEFAULT_OTP || IS_DLT_PENDING_BYPASS) && otp === env.DEV_STATIC_OTP;

                if (!isDefaultOtp) {
                    await Otp.deleteOne({ _id: otpRecord._id });
                    return createFailure(400, 'OTP expired', {
                        code: 'OTP_EXPIRED'
                    });
                }
                logger.info('OTP grace: allowing verification of expired record for default OTP');
            }

            if (!isLocalOtpLockBypass && otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
                return await handleOtpAttemptFailure(mobileDigits, userFromMobile, now);
            }

            const isOtpValid = verifyOtpHash(otp, otpRecord.otpHash);

            if (!isOtpValid) {
                otpRecord.attempts += 1;
                let userLockedUntil: Date | null = null;

                if (userFromMobile) {
                    userFromMobile.failedLoginAttempts = (userFromMobile.failedLoginAttempts || 0) + 1;

                    if (!isLocalOtpLockBypass && userFromMobile.failedLoginAttempts >= OTP_MAX_ATTEMPTS) {
                        userLockedUntil = await lockUserForOtpAbuse(userFromMobile, now);
                    }

                    if (!userLockedUntil) {
                        await userFromMobile.save();
                    }
                }

                if (userLockedUntil) {
                    await Otp.deleteMany({ mobile: { $in: mobileVariants } });
                    return createFailure(423, 'Too many invalid OTP attempts. Account locked temporarily.', {
                        code: 'OTP_LOCKED',
                        lockUntil: userLockedUntil.toISOString()
                    });
                }

                if (!isLocalOtpLockBypass && otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
                    return await handleOtpAttemptFailure(mobileDigits, userFromMobile, now);
                }

                await otpRecord.save();

                return createFailure(400, 'Invalid OTP', {
                    code: 'OTP_INVALID',
                    attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - otpRecord.attempts)
                });
            }

            await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        }


        // A previously deleted account re-registering with the same number
        // gets a clean slate — treat them as a brand new user.
        let user = (userFromMobile?.status === 'deleted') ? null : userFromMobile;

        if (!user) {
            if (!normalizedName) {
                return createFailure(400, 'Name is required for new user registration.', {
                    code: 'NAME_REQUIRED'
                });
            }

            user = await User.create({
                mobile: canonicalizeToIndian(mobile),
                name: normalizedName,
                role: 'user',
                status: 'active',
                isPhoneVerified: true,
                isVerified: true,
                lastLoginAt: now
            });


            // Assign Default Plan
            try {
                const [{ default: Plan }, { default: UserPlan }] = await Promise.all([
                    import('../models/Plan'),
                    import('../models/UserPlan')
                ]);

                const freePlan = await Plan.findOne({ isDefault: true });

                if (freePlan) {
                    await UserPlan.findOneAndUpdate(
                        { userId: user._id, planId: freePlan._id },
                        { $set: { startDate: now, endDate: null, status: 'active' } },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                }
            } catch (err) {
                logger.error('Default plan assignment failed', {
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        } else {
            if (!user.isPhoneVerified) user.isPhoneVerified = true;
            if (!user.isVerified) user.isVerified = true;
            user.lastLoginAt = now;
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();
        }

        const verifiedUserFailure = getUserAuthFailure(user, now);
        if (verifiedUserFailure) {
            return verifiedUserFailure;
        }

        const business = await Business.findOne({ userId: user._id });
        let businessStatus: 'none' | 'pending' | 'live' | 'rejected' | 'suspended' = 'none';
        let businessId: string | undefined;

        if (business) {
            businessId = business._id.toString();
            const normalizedStatus = normalizeBusinessStatus(business.status);
            businessStatus =
                normalizedStatus === 'live' ? 'live'
                    : normalizedStatus === 'pending' ? 'pending'
                        : normalizedStatus === 'rejected' ? 'rejected'
                            : normalizedStatus === 'suspended' ? 'suspended'
                                : 'none';
        }

        const token = generateToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion ?? 0 });
        const serializedUser = serializeDoc(user) as unknown as Record<string, unknown>;

        return {
            success: true,
            user: {
                ...serializedUser,
                businessId,
                businessStatus,
                accessToken: token
            },
            token
        };
    }
}
