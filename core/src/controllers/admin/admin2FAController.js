"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get2FAStatus = exports.disable2FA = exports.verify2FA = exports.setup2FA = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const systemConfigHelper_1 = require("@esparex/core/utils/systemConfigHelper");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const AdminService_1 = require("@esparex/core/services/AdminService");
const resolveAdminId = (req) => {
    const adminDoc = req.admin;
    const reqAdmin = adminDoc?._id?.toString();
    if (reqAdmin)
        return reqAdmin;
    const reqUser = req.user?._id;
    if (!reqUser)
        return null;
    return typeof reqUser === 'string' ? reqUser : reqUser.toString();
};
const getAdminWith2FA = async (req) => {
    const adminId = resolveAdminId(req);
    if (!adminId)
        return null;
    return (0, AdminService_1.getAdminWithTwoFactor)(adminId);
};
const setup2FA = async (req, res) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Unauthorized', 401);
        }
        const systemConfig = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        const issuer = systemConfig?.security?.twoFactor?.issuer?.trim() || 'Esparex Admin';
        const secret = speakeasy_1.default.generateSecret({
            name: `${issuer} (${admin.email})`,
            issuer
        });
        admin.twoFactorSecret = secret.base32;
        admin.twoFactorEnabled = false;
        await (0, AdminService_1.saveAdmin)(admin);
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(secret.otpauth_url || '');
        logger_1.default.info('Admin 2FA setup initiated', { adminId: admin._id.toString() });
        return (0, adminBaseController_1.sendSuccessResponse)(res, {
            secret: secret.base32,
            qrCode: qrCodeDataUrl
        }, 'Scan this QR code with Google Authenticator or Authy');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.setup2FA = setup2FA;
const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Verification code required', 400);
        }
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Unauthorized', 401);
        }
        if (!admin.twoFactorSecret) {
            return (0, adminBaseController_1.sendAdminError)(req, res, '2FA not set up. Please run setup first.', 400);
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });
        if (!verified) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid verification code', 400);
        }
        admin.twoFactorEnabled = true;
        await (0, AdminService_1.saveAdmin)(admin);
        logger_1.default.info('Admin 2FA enabled', { adminId: admin._id.toString() });
        return (0, adminBaseController_1.sendSuccessResponse)(res, { twoFactorEnabled: true }, '2FA enabled successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.verify2FA = verify2FA;
const disable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Verification code required to disable 2FA', 400);
        }
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Unauthorized', 401);
        }
        if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
            return (0, adminBaseController_1.sendAdminError)(req, res, '2FA is not enabled', 400);
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: admin.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });
        if (!verified) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid verification code', 400);
        }
        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = undefined;
        await (0, AdminService_1.saveAdmin)(admin);
        logger_1.default.warn('Admin 2FA disabled', { adminId: admin._id.toString() });
        return (0, adminBaseController_1.sendSuccessResponse)(res, { twoFactorEnabled: false }, '2FA disabled successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.disable2FA = disable2FA;
const get2FAStatus = async (req, res) => {
    try {
        const admin = await getAdminWith2FA(req);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Unauthorized', 401);
        }
        return (0, adminBaseController_1.sendSuccessResponse)(res, {
            twoFactorEnabled: Boolean(admin.twoFactorEnabled)
        });
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.get2FAStatus = get2FAStatus;
//# sourceMappingURL=admin2FAController.js.map