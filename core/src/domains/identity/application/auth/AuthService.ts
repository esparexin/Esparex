import Otp from '../../../../models/Otp';
import Business from '../../../../models/Business';
import { generateToken } from './auth';
import { serializeDoc } from '../../../../utils/serialize';
import logger from '../../../../utils/logger';
import { generateSecureOtp } from '../../../../utils/otpGenerator';
import { normalizeBusinessStatus } from '../../../../utils/businessStatus';
import { hashOtp, verifyOtpHash } from '../../../../utils/otpSecurity';
import { 
    canonicalizeToIndian, 
    getMobileVariants, 
    normalizeTo10Digits 
} from '../../../../utils/phoneUtils';
import { recordOtpAbuseSignal } from '../../../../utils/securityMonitoring';
import {
    type SendOtpResult,
    type VerifyOtpResult,
    OTP_EXPIRY_SECONDS,
    OTP_MAX_ATTEMPTS,
    isLocalOtpLockBypass,
    isStaticOtpBypassMatch,
    createFailure,
    findUserByMobile,
    lockUserForOtpAbuse,
    getUserAuthFailure,
    handleOtpAttemptFailure,
} from './authOtpHelpers';
import { dispatchOtpSms } from './authSmsDispatcher';
import { provisionNewUser } from './authRegistrationHelper';

export type { SendOtpResult, VerifyOtpResult };

/**
 * Centralized Authentication Service
 * Handles User Login, OTP Management, and Token Generation.
 */
export class AuthService {

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

        const effectiveUser = user?.status === 'deleted' ? null : user;
        const userFailure = getUserAuthFailure(effectiveUser, now);
        if (userFailure) {
            return userFailure;
        }

        const otpValue = generateSecureOtp();
        const otpHash = hashOtp(otpValue);
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);

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

        const staticOtpAccepted = isStaticOtpBypassMatch(otp);
        if (staticOtpAccepted) {
            logger.info('Static OTP bypass: accepting configured static code before stored OTP validation');
            await Otp.deleteMany({ mobile: { $in: mobileVariants } });
        }

        if (staticOtpAccepted) {
            // Bypass validation and proceed
        } else if (!otpRecord) {
            recordOtpAbuseSignal({
                mobileSuffix: mobileDigits.slice(-4).padStart(4, '*'),
                reason: 'invalid_otp',
                userId: userFromMobile?._id ? String(userFromMobile._id) : undefined,
            });
            return createFailure(400, 'Invalid OTP', { code: 'OTP_INVALID' });
        } else {
            if (otpRecord.expiresAt < now) {
                const isDefaultOtp = isStaticOtpBypassMatch(otp);

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
                recordOtpAbuseSignal({
                    mobileSuffix: mobileDigits.slice(-4).padStart(4, '*'),
                    reason: 'invalid_otp',
                    userId: userFromMobile?._id ? String(userFromMobile._id) : undefined,
                });

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

        let user = (userFromMobile?.status === 'deleted') ? null : userFromMobile;

        if (!user) {
            if (!normalizedName) {
                return createFailure(400, 'Name is required for new user registration.', {
                    code: 'NAME_REQUIRED'
                });
            }

            user = await provisionNewUser(mobile, normalizedName, now);
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
        const rawUser: unknown = serializeDoc(user);
        const serializedUser = rawUser as Record<string, unknown>;

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
