import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@core/services/AuthService';
import { removeUserFcmToken } from '@core/services/UserService';
import { blacklistToken } from '@core/utils/redisCache';
import { verifyToken } from '@core/utils/auth';
import { sendSuccessResponse } from "../../utils/respond";
import { sendErrorResponse } from "../../utils/errorResponse";
import { SendOtpResult, VerifyOtpResult } from '@core/services/AuthService';
import { getAuthCookieOptions, getLegacyHostOnlyAuthCookieOptions } from '@core/utils/cookieHelper';

export class AuthController {
    private static sendAuthFailure(req: Request, res: Response, result: SendOtpResult | VerifyOtpResult) {
        if (result.success) return;
        const { status, error, code, ...rest } = result;
        sendErrorResponse(req, res, status, error, {
            ...(code ? { code } : {}),
            ...(Object.keys(rest).length > 0 ? { details: rest } : {})
        });
    }

    private static parseMobile(req: Request, res: Response, mobile: string): string | null {
        const cleaned = (mobile || '').replace(/\D/g, '');
        if (cleaned.length === 10) return cleaned;
        if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.slice(2);
        // Invalid length — reject with 400 instead of silently truncating
        sendErrorResponse(req, res, 400, 'Invalid mobile number. Must be a 10-digit Indian mobile number.');
        return null;
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile } = req.body as { mobile?: string };
            const normalizedMobile = AuthController.parseMobile(req, res, mobile as string);
            if (!normalizedMobile) return;
            const result = await AuthService.sendLoginOtp(normalizedMobile);

            if (!result.success) {
                AuthController.sendAuthFailure(req, res, result);
                return;
            }

            return sendSuccessResponse(res, result);

        } catch (error: unknown) {
            next(error);
        }
    }

    static async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile, otp, name } = req.body as { mobile?: string; otp?: string; name?: string };
            const normalizedMobile = AuthController.parseMobile(req, res, mobile as string);
            if (!normalizedMobile) return;
            if (!otp) return sendErrorResponse(req, res, 400, 'OTP is required');
            
            const result = await AuthService.verifyLoginOtp(normalizedMobile, otp, name);

            if (!result.success) {
                AuthController.sendAuthFailure(req, res, result);
                return;
            }


            // Match the 7 day JWT expiration
            const cookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
            if (result.token) {
                // Migration cleanup: remove the old api.esparex.in host-only cookie
                // before setting the shared parent-domain cookie.
                res.clearCookie('esparex_auth', getLegacyHostOnlyAuthCookieOptions(0));
                res.cookie('esparex_auth', result.token, getAuthCookieOptions(cookieMaxAgeMs));
            }

            return sendSuccessResponse(res, result);
        } catch (error: unknown) {
            next(error);
        }
    }

    static async cancelOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { mobile } = req.body as { mobile?: string };
            const normalizedMobile = AuthController.parseMobile(req, res, mobile as string);
            if (!normalizedMobile) return;
            const result = await AuthService.cancelOtpSession(normalizedMobile);
            return sendSuccessResponse(res, result);

        } catch (error: unknown) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            let token = req.cookies?.esparex_auth as string | undefined;
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
                await removeUserFcmToken(req.user._id, fcmToken);
            }

            res.clearCookie('esparex_auth', getLegacyHostOnlyAuthCookieOptions(0));
            res.clearCookie('esparex_auth', getAuthCookieOptions(0));
            return sendSuccessResponse(res, null, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    }
}
