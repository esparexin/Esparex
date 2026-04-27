"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.requireSuperAdmin = exports.requireAdmin = exports.extractAdminToken = void 0;
const Admin_1 = __importDefault(require("@core/models/Admin"));
const cookieHelper_1 = require("@core/utils/cookieHelper");
const auth_1 = require("@core/utils/auth");
const errorResponse_1 = require("@core/utils/errorResponse");
const roles_1 = require("@core/constants/enums/roles");
const AdminSessionService_1 = require("@core/services/AdminSessionService");
const userStatus_1 = require("@core/constants/enums/userStatus");
const adminPermissions_1 = require("@core/constants/adminPermissions");
const extractAdminToken = (req) => {
    const cookieToken = req.cookies?.admin_token;
    if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
        return { token: cookieToken, source: 'cookie' };
    }
    const authHeader = req.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice('Bearer '.length).trim();
        if (bearerToken.length > 0) {
            return { token: bearerToken, source: 'authorization' };
        }
    }
    return null;
};
exports.extractAdminToken = extractAdminToken;
const requireAdmin = async (req, res, next) => {
    const tokenData = (0, exports.extractAdminToken)(req);
    if (!tokenData) {
        res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
        return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized: No token');
    }
    const { token, source } = tokenData;
    const shouldClearCookie = source === 'cookie';
    try {
        const decoded = (0, auth_1.verifyAdminToken)(token);
        if (!decoded?.id) {
            if (shouldClearCookie) {
                res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
            }
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized: Invalid token');
        }
        const activeSession = await (0, AdminSessionService_1.validateAdminSession)({
            adminId: decoded.id,
            token,
            tokenId: decoded.jti
        });
        if (!activeSession) {
            if (shouldClearCookie) {
                res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
            }
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized: Session expired. Please login again.');
        }
        const admin = await Admin_1.default.findById(decoded.id);
        if (!admin || admin.status !== userStatus_1.USER_STATUS.LIVE) {
            if (shouldClearCookie) {
                res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
            }
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized: Invalid admin');
        }
        req.admin = admin;
        const adminUser = {
            _id: admin._id,
            id: admin._id?.toString(),
            role: admin.role || 'admin',
            isAdmin: true,
            permissions: admin.permissions,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
        };
        req.user = adminUser;
        res.cookie('admin_token', token, (0, cookieHelper_1.getAdminCookieOptions)(await (0, AdminSessionService_1.getAdminSessionTtlMs)()));
        next();
    }
    catch {
        if (shouldClearCookie) {
            res.clearCookie('admin_token', (0, cookieHelper_1.getAdminCookieOptions)(0));
        }
        return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized: Invalid token');
    }
};
exports.requireAdmin = requireAdmin;
const requireSuperAdmin = (req, res, next) => {
    const userRole = req.user?.role;
    if (userRole !== roles_1.Role.SUPER_ADMIN) {
        return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Super Admin access required');
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        }
        if (!roles.includes(userRole)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, `Forbidden: Requires one of roles [${roles.join(', ')}]`);
        }
        return next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        }
        // Super Admin has all permissions
        if (user.role === roles_1.Role.SUPER_ADMIN) {
            return next();
        }
        const normalizedPermission = (0, adminPermissions_1.normalizeAdminPermission)(permission);
        const permissions = Array.isArray(user.permissions) ? user.permissions : [];
        const hasPermission = permissions.includes(normalizedPermission) ||
            permissions.includes(permission) ||
            permissions.includes('*') ||
            permissions.includes('all') ||
            (0, adminPermissions_1.roleGrantsPermission)(user.role, normalizedPermission);
        if (!hasPermission) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Forbidden', {
                details: { message: `Permission denied: ${normalizedPermission} required` }
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=adminAuth.js.map