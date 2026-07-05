/**
 * ESPAREX — CANONICAL ADMIN AUTH MIDDLEWARE
 *
 * Ownership transferred to backend/user gateway as part of
 * Milestone 3 Project A (Transport Separation — Batch 1).
 *
 * Previous SSOT: core/src/middleware/adminAuth.ts
 * Current SSOT:  backend/user/src/middleware/adminAuth.ts
 */
import { Request, Response, NextFunction } from 'express';
import Admin, { type IAdmin } from '@esparex/core/models/Admin';
import { getAdminCookieOptions } from '@esparex/core/utils/cookieHelper';
import { verifyAdminToken } from '@esparex/core/utils/auth';
import type { IAuthUser } from '@esparex/core/types/auth';
import { sendErrorResponse } from '@esparex/core/utils/errorResponse';
import { Role } from '@esparex/shared';
import { getAdminSessionTtlMs, validateAdminSession } from '@esparex/core/services/AdminSessionService';
import { USER_STATUS } from '@esparex/shared';
import { normalizeAdminPermission, roleGrantsPermission } from '@esparex/core/constants/adminPermissions';
import { setReliabilityContext } from '@esparex/core/utils/reliabilityContext';

export const extractAdminToken = (req: Request): { token: string; source: 'cookie' | 'authorization' } | null => {
    const cookieToken = req.cookies?.admin_token as string | undefined;
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

const isStaticAsset = (path: string | undefined): boolean => {
    if (!path || typeof path !== 'string') return false;
    const cleanPath = path.split('?')[0];
    return (
        cleanPath === '/manifest.json' ||
        cleanPath === '/sw.js' ||
        cleanPath === '/favicon.ico' ||
        cleanPath === '/robots.txt' ||
        cleanPath.startsWith('/icons/')
    );
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (isStaticAsset(req.path)) {
        return next();
    }

    const tokenData = extractAdminToken(req);
    if (!tokenData) {
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
            if (shouldClearCookie) {
                res.clearCookie('admin_token', getAdminCookieOptions(0));
            }
            return sendErrorResponse(req, res, 401, 'Unauthorized: Invalid admin');
        }

        req.admin = admin;

        const adminUser: IAuthUser = {
            _id: admin._id,
            id: admin._id?.toString() || '',
            role: admin.role || Role.ADMIN,
            isAdmin: true,
            permissions: admin.permissions || [],
            firstName: admin.firstName || '',
            lastName: admin.lastName || '',
            email: admin.email || '',
        };

        req.user = adminUser;
        setReliabilityContext({
            userId: adminUser.id || '',
            requestPath: req.originalUrl || req.url,
            method: req.method,
        });

        res.cookie('admin_token', token, getAdminCookieOptions(await getAdminSessionTtlMs()));

        next();
    } catch {
        if (shouldClearCookie) {
            res.clearCookie('admin_token', getAdminCookieOptions(0));
        }
        return sendErrorResponse(req, res, 401, 'Unauthorized: Invalid token');
    }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (userRole !== Role.SUPER_ADMIN) {
        return sendErrorResponse(req, res, 403, 'Super Admin access required');
    }
    next();
};

export const requireRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role as Role | undefined;
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
        const user = req.user;

        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        // Super Admin has all permissions
        if ((user.role as Role) === Role.SUPER_ADMIN) {
            return next();
        }

        const normalizedPermission = normalizeAdminPermission(permission);
        const permissions = Array.isArray(user.permissions) ? user.permissions : [];

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
