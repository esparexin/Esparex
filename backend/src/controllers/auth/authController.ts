import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService';
import User from '../../models/User';
import { blacklistToken } from '../../utils/redisCache';
import { verifyToken } from '../../utils/auth';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SendOtpResult, VerifyOtpResult } from '../../services/AuthService';

import { env } from '../../config/env';

const getAuthCookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge
});

export class AuthController {
    private static sendAuthFailure(req: Request, res: Response, result: SendOtpResult | VerifyOtpResult) {
        if (result.success) return;
        const { status, error, code, ...rest } = result;
        sendErrorResponse(req, res, status, error, {
            ...(code ? { code } : {}),
            ...(Object.keys(rest).length > 0 ? { details: rest } : {})
        });
    }

    private static normalizePhone(phone: string): string {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) return cleaned;
        if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.slice(2);
        return cleaned.slice(-10);
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile } = req.body;
            const normalizedPhone = AuthController.normalizePhone(mobile);
            const result = await AuthService.sendLoginOtp(normalizedPhone);

            if (!result.success) {
                AuthController.sendAuthFailure(req, res, result);
                return;
            }

            res.status(200).json(respond(result));
        } catch (error: unknown) {
            next(error);
        }
    }

    static async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile, otp, name } = req.body;
            const normalizedPhone = AuthController.normalizePhone(mobile);
            const result = await AuthService.verifyLoginOtp(normalizedPhone, otp, name);

            if (!result.success) {
                AuthController.sendAuthFailure(req, res, result);
                return;
            }

            // Match the 7 day JWT expiration
            const cookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
            if (result.token) {
                res.cookie('esparex_auth', result.token, getAuthCookieOptions(cookieMaxAgeMs));
            }

            res.status(200).json(respond(result));
        } catch (error: unknown) {
            next(error);
        }
    }

    static async cancelOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile } = req.body;
            const normalizedPhone = AuthController.normalizePhone(mobile);
            const result = await AuthService.cancelOtpSession(normalizedPhone);
            res.status(200).json(respond(result));
        } catch (error: unknown) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            let token = req.cookies?.esparex_auth;
            if (!token && req.headers.authorization?.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (token) {
                try {
                    const decoded = verifyToken(token) as { jti?: string, exp?: number } | null;
                    if (decoded?.jti && decoded?.exp) {
                        await blacklistToken(decoded.jti, decoded.exp);
                    }
                } catch {
                    // Ignore decode errors on logout
                }
            }

            const { fcmToken } = (req.body ?? {}) as { fcmToken?: string };
            if (fcmToken && req.user?._id) {
                await User.findByIdAndUpdate(req.user._id, {
                    $pull: { fcmTokens: fcmToken }
                });
            }

            res.clearCookie('esparex_auth', getAuthCookieOptions(0));
            res.status(200).json(respond({ success: true, message: 'Logged out successfully' }));
        } catch (error) {
            next(error);
        }
    }
}
