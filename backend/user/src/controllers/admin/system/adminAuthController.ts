import { findAdminByEmailForAuth, findAdminByResetToken, findAdminForLogin, updateAdminLastLogin, getAdminProfileById, saveAdmin, seedAdmin, emailService, createAdminSession, getAdminSessionTtlMs, revokeAdminSession, revokeAdminSessionsForAdmin } from '@esparex/core/services';

﻿/**
 * Admin Authentication Controller
 * Handles admin login, logout, password reset, and profile
 * Extracted from adminSystemController.ts
 */

import { Request, Response } from 'express';
import type { IAdmin } from '@esparex/core/models/Admin';

import { getSystemConfigDoc } from '@esparex/core/utils/systemConfigHelper';
import { normalizeRole } from '@esparex/core/utils/roleNormalization';
import { getAdminCookieOptions } from '@esparex/core/utils/cookieHelper';
import logger from '@esparex/core/utils/logger';
import { getAdminAppUrl } from '@esparex/core/utils/appUrl';
import {
    sendSuccessResponse,
    sendAdminError
} from '@esparex/core/utils/adminBaseController';

import crypto from 'crypto';
import speakeasy from 'speakeasy';

import { logAdminAction } from '@esparex/core/utils/adminLogger';
import { comparePassword, generateAdminToken, verifyAdminToken } from '@esparex/core/utils/auth';
import { USER_STATUS } from '@esparex/shared';
import { getSingleParam } from '@esparex/core/utils/requestParams';

const normalizeIp = (value: string) => value.replace(/^::ffff:/, '').trim();

const sendAuthError = (req: Request, res: Response, error: unknown) => {
    sendAdminError(req, res, error);
};

/**
 * Initiate password reset via email
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const forgotBody = req.body as { email?: unknown };
        const rawEmail = forgotBody.email;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        if (!email) {
            return sendSuccessResponse(res, { message: 'If that email exists, a reset link has been sent.' });
        }

        const admin = await findAdminByEmailForAuth(email);

        if (!admin) {
            // 🛡️ SECURITY: Don't reveal if user exists
            return sendSuccessResponse(res, { message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and save to DB
        admin.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Expire in 10 minutes
        admin.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

        await saveAdmin(admin);

        // Create reset URL
        const resetUrl = `${getAdminAppUrl()}/admin/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for Esparex Admin.</p>
            <p>Click the link below to verify it's you and set a new password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `;

        const sent = await emailService.sendEmail(
            admin.email,
            'Esparex Admin Password Reset',
            message
        );

        if (!sent) {
            admin.resetPasswordToken = undefined;
            admin.resetPasswordExpire = undefined;
            await saveAdmin(admin);
            return sendAdminError(req, res, 'Email could not be sent', 500);
        }

        sendSuccessResponse(res, { message: 'If that email exists, a reset link has been sent.' });

    } catch (error: unknown) {
        sendAuthError(req, res, error);
    }
};

/**
 * Complete password reset with token
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const token = getSingleParam(req, res, 'token', { error: 'Invalid reset token' });
        if (!token) return;
        const { password } = req.body as { password?: unknown };

        if (!password || typeof password !== 'string') return sendAdminError(req, res, 'Password is required', 400);

        // 🛡️ SECURITY: Password strength check
        if (password.length < 8) {
            return sendAdminError(req, res, 'Password must be at least 8 characters long', 400);
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return sendAdminError(req, res, 'Password must contain at least one uppercase letter, one lowercase letter, and one number', 400);
        }

        // Hash token to compare
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const admin = await findAdminByResetToken(resetPasswordToken);

        if (!admin) {
            return sendAdminError(req, res, 'Invalid or expired token', 400);
        }

        // Model pre-save hook hashes password; setting plaintext here avoids double-hashing.
        admin.password = password;

        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await saveAdmin(admin);
        await revokeAdminSessionsForAdmin(admin._id.toString());

        await logAdminAction(req, 'RESET_PASSWORD', 'Admin', admin._id.toString(), { email: admin.email });

        sendSuccessResponse(res, { message: 'Password updated successfully' });

    } catch (error: unknown) {
        sendAuthError(req, res, error);
    }
};

/**
 * Admin login with optional 2FA
 */
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const loginBody = req.body as { email?: unknown; password?: unknown; twoFactorCode?: unknown };
        const rawEmail = loginBody.email;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        const password = typeof loginBody.password === 'string' ? loginBody.password : '';
        const twoFactorCode = typeof loginBody.twoFactorCode === 'string' ? loginBody.twoFactorCode : undefined;
        if (!email || !password) return sendAdminError(req, res, 'Email and password are required', 400);

        // 🛡️ GOVERNANCE: Ensure default admin exists in local dev environments
        await seedAdmin(email);

        // 🛡️ SECURITY AUDIT: Load dynamic security settings
        const systemConfig = await getSystemConfigDoc();
        const requestIp = normalizeIp(
            ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim())
            || req.socket.remoteAddress
            || req.ip
            || ''
        );
        const ipWhitelist = Array.isArray(systemConfig?.security?.ipWhitelist)
            ? systemConfig.security.ipWhitelist.map((value: unknown) => normalizeIp(String(value))).filter(Boolean)
            : [];
        if (ipWhitelist.length > 0 && requestIp && !ipWhitelist.includes(requestIp)) {
            logger.warn('Admin login blocked by system-config IP allowlist', { email, ip: requestIp });
            return sendAdminError(req, res, 'Sign-in is not allowed from this IP address', 403);
        }

        const admin = await findAdminForLogin(email);
        if (!admin) {
            logger.warn('Admin login failed: Account not found in database', { email, ip: req.ip });
            return sendAdminError(req, res, 'Admin account not found', 401);
        }

        if (admin.status !== USER_STATUS.LIVE) {
            logger.warn('Admin login failed: Account status not LIVE', {
                email,
                status: admin.status,
                ip: req.ip
            });
            return sendAdminError(req, res, `Admin account is ${admin.status} (expected LIVE)`, 401);
        }

        const isMatch = admin.password ? await comparePassword(password, admin.password) : false;
        const adminRecord = admin as unknown as
            (typeof admin & { twoFactorEnabled?: boolean; twoFactorSecret?: string });
        if (!isMatch) {
            logger.warn('Admin login failed: Password mismatch', { email, ip: req.ip });
            return sendAdminError(req, res, 'Incorrect password', 401);
        }

        // Use updateOne to bypass pre-save hooks — avoids accidental bcrypt re-hash
        // when +password / +twoFactorSecret were explicitly selected on this doc.
        await updateAdminLastLogin(admin._id);

        const adminData = admin.toObject({ virtuals: true }) as Partial<IAdmin>;
        if (adminData.role) {
            adminData.role = normalizeRole(adminData.role);
        }
        delete (adminData as Record<string, unknown>).password;
        delete (adminData as Record<string, unknown>).twoFactorSecret;
        const adminDataWithId = adminData as Partial<IAdmin> & {
            _id?: { toString: () => string } | string;
            id?: string;
        };

        // 🔐 2FA VERIFICATION
        if (adminRecord?.twoFactorEnabled) {
            if (!twoFactorCode) {
                return sendAdminError(req, res, {
                    message: '2FA code required',
                    code: 'ADMIN_2FA_REQUIRED',
                    details: { requires2FA: true }
                }, 403);
            }

            // Verify 2FA code
            const verified = speakeasy.totp.verify({
                secret: adminRecord.twoFactorSecret || '',
                encoding: 'base32',
                token: twoFactorCode,
                window: 2 // Allow 2 time steps for clock drift
            });

            if (!verified) {
                return sendAdminError(req, res, 'Invalid 2FA code', 401);
            }
        }

        const tokenId = adminDataWithId._id || adminDataWithId.id;
        if (!tokenId) {
            return sendAdminError(req, res, 'Invalid admin payload', 500);
        }

        // Use standardized token generation
        const token = generateAdminToken({ id: tokenId, role: adminData.role || 'admin' });

        // 🔒 UNIFIED SESSION COOKIE
        const cookieOptions = getAdminCookieOptions(await getAdminSessionTtlMs());
        res.cookie('admin_token', token, cookieOptions);

        // Also clear legacy cookie just in case
        res.clearCookie('admin_access_token');

        const decodedToken = verifyAdminToken(token) as { jti?: string } | null;
        await createAdminSession({
            adminId: String(tokenId),
            token,
            tokenId: decodedToken?.jti,
            ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
            device: req.headers['user-agent'] || ''
        });

        await logAdminAction(
            req,
            'LOGIN',
            'Admin',
            String(tokenId),
            { email: admin.email, role: adminData.role || 'admin' },
            String(tokenId)
        );

        sendSuccessResponse(res, {
            accessToken: token, // Frontend expects this in response body too
            admin: {
                ...adminData,
                id: typeof adminDataWithId._id === 'string'
                    ? adminDataWithId._id
                    : adminDataWithId._id?.toString() || adminDataWithId.id,
                name: `${adminData.firstName} ${adminData.lastName}`.trim(),
                mobile: "",
                twoFactorEnabled: adminRecord?.twoFactorEnabled || false
            }
        });

    } catch (error: unknown) {
        sendAuthError(req, res, error);
    }
};

/**
 * Admin logout
 */
export const adminLogout = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.admin_token as string | undefined;
        if (typeof token === 'string' && token.length > 0) {
            await revokeAdminSession(token);
        }
        res.clearCookie('admin_token', getAdminCookieOptions(0));
        res.clearCookie('admin_access_token'); // Clean legacy
        sendSuccessResponse(res, { message: 'Logged out successfully' });
    } catch (error: unknown) {
        sendAuthError(req, res, error);
    }
};

/**
 * Get current logged-in admin profile
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        const adminId = req.user?._id;
        if (!adminId) {
            return sendAdminError(req, res, "Unauthorized: No admin session", 401);
        }

        const admin = await getAdminProfileById(adminId);

        if (!admin) {
            return sendAdminError(req, res, "Admin not found", 401);
        }

        const adminIdStr = admin._id?.toString() || (admin as { id?: string }).id || '';
        if (!adminIdStr) {
            return sendAdminError(req, res, "Unauthorized: Invalid admin state", 401);
        }

        const firstName = admin.firstName || '';
        const lastName = admin.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        sendSuccessResponse(res, {
            admin: {
                ...admin,
                id: adminIdStr,
                name: fullName
            },
            role: admin.role,
            type: 'admin'
        });
    } catch (error: unknown) {
        logger.error('[AdminMeError] Failed to fetch admin profile', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, "Unauthorized: Session lookup failed", 401);
    }
};

// Aliases for compatibility if needed, but routes should update to use these new names
export const login = adminLogin;
export const logout = adminLogout;
