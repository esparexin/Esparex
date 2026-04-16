import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import logger from '../../utils/logger';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';
import { sendSuccessResponse, sendAdminError } from './adminBaseController';
import { getAdminWithTwoFactor, saveAdmin } from '../../services/AdminService';

const resolveAdminId = (req: Request): string | null => {
    const adminDoc = req.admin as unknown as { _id?: { toString(): string } | string } | undefined;
    const reqAdmin = adminDoc?._id?.toString();
    if (reqAdmin) return reqAdmin;

    const reqUser = req.user?._id;
    if (!reqUser) return null;
    return typeof reqUser === 'string' ? reqUser : reqUser.toString();
};

const getAdminWith2FA = async (req: Request) => {
    const adminId = resolveAdminId(req);
    if (!adminId) return null;
    return getAdminWithTwoFactor(adminId);
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendAdminError(req, res, 'Unauthorized', 401);
        }
        const systemConfig = await getSystemConfigDoc();
        const issuer = systemConfig?.security?.twoFactor?.issuer?.trim() || 'Esparex Admin';

        const secret = speakeasy.generateSecret({
            name: `${issuer} (${admin.email})`,
            issuer
        });

        admin.twoFactorSecret = secret.base32;
        admin.twoFactorEnabled = false;
        await saveAdmin(admin);

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

        logger.info('Admin 2FA setup initiated', { adminId: admin._id.toString() });

        return sendSuccessResponse(
            res,
            {
                secret: secret.base32,
                qrCode: qrCodeDataUrl
            },
            'Scan this QR code with Google Authenticator or Authy'
        );
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token?: string };
        if (!token) {
            return sendAdminError(req, res, 'Verification code required', 400);
        }

        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendAdminError(req, res, 'Unauthorized', 401);
        }

        if (!admin.twoFactorSecret) {
            return sendAdminError(req, res, '2FA not set up. Please run setup first.', 400);
        }

        const verified = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return sendAdminError(req, res, 'Invalid verification code', 400);
        }

        admin.twoFactorEnabled = true;
        await saveAdmin(admin);

        logger.info('Admin 2FA enabled', { adminId: admin._id.toString() });
        return sendSuccessResponse(
            res,
            { twoFactorEnabled: true },
            '2FA enabled successfully'
        );
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const disable2FA = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token?: string };
        if (!token) {
            return sendAdminError(req, res, 'Verification code required to disable 2FA', 400);
        }

        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendAdminError(req, res, 'Unauthorized', 401);
        }

        if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
            return sendAdminError(req, res, '2FA is not enabled', 400);
        }

        const verified = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return sendAdminError(req, res, 'Invalid verification code', 400);
        }

        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = undefined;
        await saveAdmin(admin);

        logger.warn('Admin 2FA disabled', { adminId: admin._id.toString() });
        return sendSuccessResponse(
            res,
            { twoFactorEnabled: false },
            '2FA disabled successfully'
        );
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const get2FAStatus = async (req: Request, res: Response) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendAdminError(req, res, 'Unauthorized', 401);
        }

        return sendSuccessResponse(res, {
            twoFactorEnabled: Boolean(admin.twoFactorEnabled)
        });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
