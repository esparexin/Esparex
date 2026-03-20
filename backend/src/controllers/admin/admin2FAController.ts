import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Admin from '../../models/Admin';
import logger from '../../utils/logger';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { sendSuccessResponse } from './adminBaseController';

const resolveAdminId = (req: Request): string | null => {
    const reqAdmin = req.admin?._id?.toString();
    if (reqAdmin) return reqAdmin;

    const reqUser = req.user?._id;
    if (!reqUser) return null;
    return typeof reqUser === 'string' ? reqUser : reqUser.toString();
};

const getAdminWith2FA = async (req: Request) => {
    const adminId = resolveAdminId(req);
    if (!adminId) return null;
    return Admin.findById(adminId).select('+twoFactorSecret +twoFactorEnabled');
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendContractErrorResponse(req, res, 401, 'Unauthorized');
        }

        const secret = speakeasy.generateSecret({
            name: `Esparex Admin (${admin.email})`,
            issuer: 'Esparex'
        });

        admin.twoFactorSecret = secret.base32;
        admin.twoFactorEnabled = false;
        await admin.save();

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
        logger.error('Admin 2FA setup failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendContractErrorResponse(req, res, 500, 'Failed to setup 2FA');
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token?: string };
        if (!token) {
            return sendContractErrorResponse(req, res, 400, 'Verification code required');
        }

        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendContractErrorResponse(req, res, 401, 'Unauthorized');
        }

        if (!admin.twoFactorSecret) {
            return sendContractErrorResponse(req, res, 400, '2FA not set up. Please run setup first.');
        }

        const verified = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return sendContractErrorResponse(req, res, 400, 'Invalid verification code');
        }

        admin.twoFactorEnabled = true;
        await admin.save();

        logger.info('Admin 2FA enabled', { adminId: admin._id.toString() });
        return sendSuccessResponse(
            res,
            { twoFactorEnabled: true },
            '2FA enabled successfully'
        );
    } catch (error) {
        logger.error('Admin 2FA verification failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendContractErrorResponse(req, res, 500, 'Failed to verify 2FA');
    }
};

export const disable2FA = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token?: string };
        if (!token) {
            return sendContractErrorResponse(req, res, 400, 'Verification code required to disable 2FA');
        }

        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendContractErrorResponse(req, res, 401, 'Unauthorized');
        }

        if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
            return sendContractErrorResponse(req, res, 400, '2FA is not enabled');
        }

        const verified = speakeasy.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return sendContractErrorResponse(req, res, 400, 'Invalid verification code');
        }

        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = undefined;
        await admin.save();

        logger.warn('Admin 2FA disabled', { adminId: admin._id.toString() });
        return sendSuccessResponse(
            res,
            { twoFactorEnabled: false },
            '2FA disabled successfully'
        );
    } catch (error) {
        logger.error('Admin 2FA disable failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendContractErrorResponse(req, res, 500, 'Failed to disable 2FA');
    }
};

export const get2FAStatus = async (req: Request, res: Response) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return sendContractErrorResponse(req, res, 401, 'Unauthorized');
        }

        return sendSuccessResponse(res, {
            twoFactorEnabled: Boolean(admin.twoFactorEnabled)
        });
    } catch (error) {
        logger.error('Failed to get admin 2FA status', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendContractErrorResponse(req, res, 500, 'Failed to get 2FA status');
    }
};
