"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.restrictTo = exports.extractUser = exports.protect = void 0;
const mongoose_1 = require("mongoose");
const auth_1 = require("@core/utils/auth");
const redis_1 = __importDefault(require("@core/config/redis"));
const User_1 = __importDefault(require("@core/models/User"));
const redisCache_1 = require("@core/utils/redisCache");
const errorResponse_1 = require("@core/utils/errorResponse");
const logger_1 = __importDefault(require("@core/utils/logger"));
const roles_1 = require("@core/constants/enums/roles");
const cookieHelper_1 = require("@core/utils/cookieHelper");
/**
 * ESPAREX — CANONICAL END-USER AUTH MIDDLEWARE (SSOT)
 *
 * Used by:
 * - backend/user (Public App)
 * - backend/admin (Admin masked/masquerade actions)
 */
const extractToken = (req) => {
    // 1️⃣ Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return { token: authHeader.split(" ")[1] ?? "" };
    }
    // 2️⃣ User Cookie Fallback
    if (req.cookies?.esparex_auth) {
        return { token: req.cookies.esparex_auth };
    }
    return null;
};
const clearAuthCookie = (res) => {
    res.clearCookie("esparex_auth", (0, cookieHelper_1.getLegacyHostOnlyAuthCookieOptions)(0));
    res.clearCookie("esparex_auth", (0, cookieHelper_1.getAuthCookieOptions)(0));
};
const parseCachedUserStatus = (cached) => {
    if (!cached)
        return null;
    try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.status === "string") {
            return {
                status: parsed.status,
                tokenVersion: typeof parsed.tokenVersion === "number" ? parsed.tokenVersion : undefined,
            };
        }
    }
    catch {
        // Backward compatibility
    }
    return { status: cached };
};
/**
 * Protect route - requires valid end-user token
 */
const protect = async (req, res, next) => {
    try {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        // Skip if already verified (e.g. by requireAdmin)
        if (req.admin || req.user?.isAdmin) {
            return next();
        }
        const tokenData = extractToken(req);
        if (!tokenData) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Not authorized, no token");
            return;
        }
        const { token } = tokenData;
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded?.id || !decoded.role) {
            clearAuthCookie(res);
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Invalid token");
            return;
        }
        const isBlacklisted = await (0, redisCache_1.isTokenBlacklisted)(decoded.jti || token);
        if (isBlacklisted) {
            clearAuthCookie(res);
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Session expired or invalid");
            return;
        }
        // Canonical req.user Setup
        req.user = {
            _id: new mongoose_1.Types.ObjectId(decoded.id),
            id: decoded.id,
            role: decoded.role,
            isAdmin: decoded.role === roles_1.Role.ADMIN || decoded.role === roles_1.Role.SUPER_ADMIN
        };
        const cacheKey = `user:status:${req.user.id}`;
        const cachedUserStatus = parseCachedUserStatus(await redis_1.default.get(cacheKey));
        const user = await User_1.default.findById(req.user._id).select('status tokenVersion').lean();
        if (!user) {
            clearAuthCookie(res);
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, "User not found");
            return;
        }
        const storedTokenVersion = user.tokenVersion ?? 0;
        const decodedVersion = decoded.tokenVersion ?? 0;
        if (storedTokenVersion !== decodedVersion) {
            await redis_1.default.del(cacheKey);
            clearAuthCookie(res);
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Session expired. Please log in again.");
            return;
        }
        const userStatus = user.status;
        if (!cachedUserStatus ||
            cachedUserStatus.status !== userStatus ||
            (cachedUserStatus.tokenVersion ?? -1) !== storedTokenVersion) {
            await redis_1.default.set(cacheKey, JSON.stringify({ status: userStatus, tokenVersion: storedTokenVersion }), 'EX', 60);
        }
        if (userStatus !== 'live') {
            (0, errorResponse_1.sendErrorResponse)(req, res, 403, "Account restricted", {
                message: `Your account is currently ${userStatus}. Please contact support.`,
                type: userStatus.toUpperCase(),
                code: `USER_${userStatus.toUpperCase()}`
            });
            return;
        }
        next();
    }
    catch (err) {
        logger_1.default.error("[Auth] Protect error:", err);
        clearAuthCookie(res);
        (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Token verification failed");
    }
};
exports.protect = protect;
/**
 * Optional Auth - populates req.user if token exists
 */
const extractUser = (req, res, next) => {
    const tokenData = extractToken(req);
    if (!tokenData)
        return next();
    try {
        const { token } = tokenData;
        const decoded = (0, auth_1.verifyToken)(token);
        if (decoded?.id && decoded.role) {
            req.user = {
                _id: new mongoose_1.Types.ObjectId(decoded.id),
                id: decoded.id,
                role: decoded.role,
                isAdmin: decoded.role === roles_1.Role.ADMIN || decoded.role === roles_1.Role.SUPER_ADMIN
            };
        }
    }
    catch {
        // Ignore invalid tokens for optional auth
    }
    next();
};
exports.extractUser = extractUser;
/**
 * Role Restriction
 */
const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Not authorized");
        return;
    }
    if (!roles.includes(req.user.role)) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 403, "You do not have permission to perform this action");
        return;
    }
    next();
};
exports.restrictTo = restrictTo;
/**
 * Admin-only Check
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 401, "Not authorized");
        return;
    }
    if (!req.user.isAdmin) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 403, "Admin access required");
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=authMiddleware.js.map