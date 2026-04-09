
import { Request, Response, NextFunction } from 'express';
import Admin, { type IAdmin } from '../models/Admin';
import { getAdminCookieOptions } from '../utils/cookieHelper';
import { verifyAdminToken } from '../utils/auth';
import type { IAuthUser } from '../types/auth';
import { sendErrorResponse } from '../utils/errorResponse';
import { Role } from '@shared/enums/roles';
import { getAdminSessionTtlMs, validateAdminSession } from '../services/AdminSessionService';
import { USER_STATUS } from '@shared/enums/userStatus';
import { normalizeAdminPermission, roleGrantsPermission } from '../constants/adminPermissions';

const extractAdminToken = (req: Request): { token: string; source: 'cookie' | 'authorization' } | null => {
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

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const tokenData = extractAdminToken(req);
    if (!tokenData) {
        // If no token, clear any potentially stale cookie with the correct path
        res.clearCookie('admin_token', getAdminCookieOptions(0));
        return sendErrorResponse(req, res, 401, 'Unauthorized: No token');
    }

    const { token, source } = tokenData;
    const shouldClearCookie = source === 'cookie';

    try {
        const decoded = verifyAdminToken(token) as { id?: string; role?: string; jti?: string } | null;
        if (!decoded?.id) {
            if (shouldClearCookie) {
                res.clearCookie('admin_token', getAdminCookieOptions(0));
            }
            return sendErrorResponse(req, res, 401, 'Unauthorized: Invalid token');
        }

        const activeSession = await validateAdminSession({
            adminId: decoded.id,
            token,
            tokenId: decoded.jti
        });
        if (!activeSession) {
            if (shouldClearCookie) {
                res.clearCookie('admin_token', getAdminCookieOptions(0));
            }
            return sendErrorResponse(req, res, 401, 'Unauthorized: Session expired. Please login again.');
        }

        const admin: IAdmin | null = await Admin.findById(decoded.id);

        if (!admin || admin.status !== USER_STATUS.LIVE) {
            // If admin is invalid, clear the cookie with the correct path
            if (shouldClearCookie) {
                res.clearCookie('admin_token', getAdminCookieOptions(0));
            }
            return sendErrorResponse(req, res, 401, 'Unauthorized: Invalid admin');
        }

        req.admin = admin;

        const adminUser: IAuthUser = {
            _id: admin._id,
            id: admin._id?.toString(),
            role: admin.role || 'admin',
            isAdmin: true,
            permissions: admin.permissions,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email
        };

        // Populate req.user for downstream middleware compatibility
        req.user = adminUser;

        // Re-set the cookie to refresh its expiration, ensuring path is included
        res.cookie('admin_token', token, getAdminCookieOptions(await getAdminSessionTtlMs()));

        next();
    } catch {
        // If token is invalid, clear the cookie with the correct path
        if (shouldClearCookie) {
            res.clearCookie('admin_token', getAdminCookieOptions(0));
        }
        return sendErrorResponse(req, res, 401, 'Unauthorized: Invalid token');
    }
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // req.user is already populated by requireAdmin
    const userRole = req.user?.role;

    if (userRole !== Role.SUPER_ADMIN) {
        return sendErrorResponse(req, res, 403, 'Super Admin access required');
    }
    next();
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }
        if (!roles.includes(userRole)) {
            return sendErrorResponse(req, res, 403, `Forbidden: Requires one of roles [${roles.join(', ')}]`);
        }
        return next();
    };
};

export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // req.user is populated by requireAdmin
        const user = req.user;

        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        // Super Admin has all permissions
        if (user.role === Role.SUPER_ADMIN) {
            return next();
        }

        const normalizedPermission = normalizeAdminPermission(permission);
        const permissions = Array.isArray(user.permissions) ? user.permissions : [];

        // Check for exact permission or wildcard
        const hasPermission =
            permissions.includes(normalizedPermission) ||
            permissions.includes(permission) ||
            permissions.includes('*') ||
            permissions.includes('all') ||
            roleGrantsPermission(user.role, normalizedPermission);

        if (!hasPermission) {
            return sendErrorResponse(req, res, 403, 'Forbidden', {
                details: { message: `Permission denied: ${normalizedPermission} required` }
            });
        }

        next();
    };
};
