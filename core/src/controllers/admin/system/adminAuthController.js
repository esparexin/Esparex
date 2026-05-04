"use strict";
/**
 * Admin Authentication Controller
 * Handles admin login, logout, password reset, and profile
 * Extracted from adminSystemController.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.getMe = exports.adminLogout = exports.adminLogin = exports.resetPassword = exports.forgotPassword = void 0;
const AdminService_1 = require("@esparex/core/services/AdminService");
const systemConfigHelper_1 = require("@esparex/core/utils/systemConfigHelper");
const cookieHelper_1 = require("@esparex/core/utils/cookieHelper");
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const appUrl_1 = require("@esparex/core/utils/appUrl");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const crypto_1 = __importDefault(require("crypto"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const EmailService_1 = require("@esparex/core/services/EmailService");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const auth_1 = require("@esparex/core/utils/auth");
const userStatus_1 = require("@esparex/core/constants/enums/userStatus");
const requestParams_1 = require("@esparex/core/utils/requestParams");
const AdminSessionService_1 = require("@esparex/core/services/AdminSessionService");
const normalizeIp = (value) => value.replace(/^::ffff:/, '').trim();
const sendAuthError = (req, res, error) => {
    (0, adminBaseController_1.sendAdminError)(req, res, error);
};
/**
 * Initiate password reset via email
 */
const forgotPassword = async (req, res) => {
    try {
        const forgotBody = req.body;
        const rawEmail = forgotBody.email;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        if (!email) {
            return (0, adminBaseController_1.sendSuccessResponse)(res, { message: 'If that email exists, a reset link has been sent.' });
        }
        const admin = await (0, AdminService_1.findAdminByEmailForAuth)(email);
        if (!admin) {
            // 🛡️ SECURITY: Don't reveal if user exists
            return (0, adminBaseController_1.sendSuccessResponse)(res, { message: 'If that email exists, a reset link has been sent.' });
        }
        // Generate token
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        // Hash and save to DB
        admin.resetPasswordToken = crypto_1.default
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        // Expire in 10 minutes
        admin.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
        await (0, AdminService_1.saveAdmin)(admin);
        // Create reset URL
        const resetUrl = `${(0, appUrl_1.getAdminAppUrl)()}/admin/reset-password/${resetToken}`;
        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for Esparex Admin.</p>
            <p>Click the link below to verify it's you and set a new password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `;
        const sent = await EmailService_1.emailService.sendEmail(admin.email, 'Esparex Admin Password Reset', message);
        if (!sent) {
            admin.resetPasswordToken = undefined;
            admin.resetPasswordExpire = undefined;
            await (0, AdminService_1.saveAdmin)(admin);
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Email could not be sent', 500);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, { message: 'If that email exists, a reset link has been sent.' });
    }
    catch (error) {
        sendAuthError(req, res, error);
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Complete password reset with token
 */
const resetPassword = async (req, res) => {
    try {
        const token = (0, requestParams_1.getSingleParam)(req, res, 'token', { error: 'Invalid reset token' });
        if (!token)
            return;
        const { password } = req.body;
        if (!password || typeof password !== 'string')
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Password is required', 400);
        // 🛡️ SECURITY: Password strength check
        if (password.length < 8) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Password must be at least 8 characters long', 400);
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Password must contain at least one uppercase letter, one lowercase letter, and one number', 400);
        }
        // Hash token to compare
        const resetPasswordToken = crypto_1.default
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const admin = await (0, AdminService_1.findAdminByResetToken)(resetPasswordToken);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid or expired token', 400);
        }
        // Model pre-save hook hashes password; setting plaintext here avoids double-hashing.
        admin.password = password;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;
        await (0, AdminService_1.saveAdmin)(admin);
        await (0, AdminSessionService_1.revokeAdminSessionsForAdmin)(admin._id.toString());
        await (0, adminLogger_1.logAdminAction)(req, 'RESET_PASSWORD', 'Admin', admin._id.toString(), { email: admin.email });
        (0, adminBaseController_1.sendSuccessResponse)(res, { message: 'Password updated successfully' });
    }
    catch (error) {
        sendAuthError(req, res, error);
    }
};
exports.resetPassword = resetPassword;
/**
 * Admin login with optional 2FA
 */
const adminLogin = async (req, res) => {
    try {
        const loginBody = req.body;
        const rawEmail = loginBody.email;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        const password = typeof loginBody.password === 'string' ? loginBody.password : '';
        const twoFactorCode = typeof loginBody.twoFactorCode === 'string' ? loginBody.twoFactorCode : undefined;
        if (!email || !password)
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Email and password are required', 400);
        // 🛡️ SECURITY AUDIT: Load dynamic security settings
        const systemConfig = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        const requestIp = normalizeIp((req.headers['x-forwarded-for']?.split(',')[0]?.trim())
            || req.socket.remoteAddress
            || req.ip
            || '');
        const ipWhitelist = Array.isArray(systemConfig?.security?.ipWhitelist)
            ? systemConfig.security.ipWhitelist.map((value) => normalizeIp(String(value))).filter(Boolean)
            : [];
        if (ipWhitelist.length > 0 && requestIp && !ipWhitelist.includes(requestIp)) {
            logger_1.default.warn('Admin login blocked by system-config IP allowlist', { email, ip: requestIp });
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Sign-in is not allowed from this IP address', 403);
        }
        const admin = await (0, AdminService_1.findAdminForLogin)(email);
        const adminRecord = admin;
        if (!admin) {
            logger_1.default.warn('Admin login failed: Account not found', { email, ip: req.ip });
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid credentials', 401);
        }
        if (admin.status !== userStatus_1.USER_STATUS.LIVE) {
            logger_1.default.warn('Admin login failed: Account status not LIVE', {
                email,
                status: admin.status,
                ip: req.ip
            });
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid credentials', 401);
        }
        const isMatch = admin.password ? await (0, auth_1.comparePassword)(password, admin.password) : false;
        if (!isMatch) {
            logger_1.default.warn('Admin login failed: Invalid password', { email, ip: req.ip });
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid credentials', 401);
        }
        // Use updateOne to bypass pre-save hooks — avoids accidental bcrypt re-hash
        // when +password / +twoFactorSecret were explicitly selected on this doc.
        await (0, AdminService_1.updateAdminLastLogin)(admin._id);
        const adminData = admin.toObject({ virtuals: true });
        delete adminData.password;
        delete adminData.twoFactorSecret;
        const adminDataWithId = adminData;
        // 🔐 2FA VERIFICATION
        if (adminRecord?.twoFactorEnabled) {
            if (!twoFactorCode) {
                return (0, adminBaseController_1.sendAdminError)(req, res, {
                    message: '2FA code required',
                    code: 'ADMIN_2FA_REQUIRED',
                    details: { requires2FA: true }
                }, 403);
            }
            // Verify 2FA code
            const verified = speakeasy_1.default.totp.verify({
                secret: adminRecord.twoFactorSecret || '',
                encoding: 'base32',
                token: twoFactorCode,
                window: 2 // Allow 2 time steps for clock drift
            });
            if (!verified) {
                return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid 2FA code', 401);
            }
        }
        const tokenId = adminDataWithId._id || adminDataWithId.id;
        if (!tokenId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid admin payload', 500);
        }
        // Use standardized token generation
        const token = (0, auth_1.generateAdminToken)({ id: tokenId, role: adminData.role || 'admin' });
        // 🔒 UNIFIED SESSION COOKIE
        const cookieOptions = (0, cookieHelper_1.getAdminCookieOptions)(await (0, AdminSessionService_1.getAdminSessionTtlMs)());
        res.cookie('admin_token', token, cookieOptions);
        // Also clear legacy cookie just in case
        res.clearCookie('admin_access_token');
        const decodedToken = (0, auth_1.verifyAdminToken)(token);
        await (0, AdminSessionService_1.createAdminSession)({
            adminId: String(tokenId),
            token,
            tokenId: decodedToken?.jti,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
            device: req.headers['user-agent'] || ''
        });
        await (0, adminLogger_1.logAdminAction)(req, 'LOGIN', 'Admin', String(tokenId), { email: admin.email, role: adminData.role || 'admin' }, String(tokenId));
        (0, adminBaseController_1.sendSuccessResponse)(res, {
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
    }
    catch (error) {
        sendAuthError(req, res, error);
    }
};
exports.adminLogin = adminLogin;
/**
 * Admin logout
 */
const adminLogout = async (req, res) => {
    try {
        const token = req.cookies?.admin_token;
        if (typeof token === 'string' && token.length > 0) {
            await (0, AdminSessionService_1.revokeAdminSession)(token);
        }
        res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
        res.clearCookie('admin_access_token'); // Clean legacy
        (0, adminBaseController_1.sendSuccessResponse)(res, { message: 'Logged out successfully' });
    }
    catch (error) {
        sendAuthError(req, res, error);
    }
};
exports.adminLogout = adminLogout;
/**
 * Get current logged-in admin profile
 */
const getMe = async (req, res) => {
    try {
        // req.user is populated by requireAdmin middleware
        const adminId = req.user._id;
        const admin = await (0, AdminService_1.getAdminProfileById)(adminId);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, "Admin not found", 401);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, {
            admin: {
                ...admin,
                id: admin._id.toString(),
                name: `${admin.firstName} ${admin.lastName}`.trim()
            },
            role: admin.role,
            type: 'admin'
        });
    }
    catch (error) {
        sendAuthError(req, res, error);
    }
};
exports.getMe = getMe;
// Aliases for compatibility if needed, but routes should update to use these new names
exports.login = exports.adminLogin;
exports.logout = exports.adminLogout;
//# sourceMappingURL=adminAuthController.js.map