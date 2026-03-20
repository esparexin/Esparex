import { Request, Response } from 'express';

import { respond } from '../../utils/respond';
export { respond } from '../../utils/respond';

/**
 * 🔐 ESPAREX PERMISSION CHECKER
 * Ensures the admin user has the required scope for the action.
 * Supports wildcard (*) for full access.
 */
import { IAuthUser } from '../../types/auth';

/**
 * 🔐 ESPAREX PERMISSION CHECKER
 * Ensures the admin user has the required scope for the action.
 * Supports wildcard (*) for full access.
 */
export const checkPermission = (user: IAuthUser | undefined, module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.permissions?.includes('*') || user.permissions?.includes('all')) return true;

    // Check specific permission
    // Format expected: "module:action" or just "module"
    // But previously it expected nested map. 
    // The middleware uses: permissions.includes(permission)
    // So we should expect 'module:action' string to be passed.

    // If exact match
    if (user.permissions?.includes(action)) return true; // Assuming action is full permission string like 'users:write'

    // If module wildcard
    if (user.permissions?.includes(`${module}:*`)) return true;

    return false;
};

export const getPaginationParams = (req: Request) => {
    const rawPage = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

    let page = parseInt(String(rawPage)) || 1;
    let limit = parseInt(String(rawLimit)) || 10;

    if (page < 1) page = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export const sendPaginatedResponse = (res: Response, data: unknown[], total: number, page: number, limit: number) => {
    res.status(200).json(respond({
        success: true,
        data: {
            items: data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }));
};

export const sendSuccessResponse = (res: Response, data: unknown, message?: string) => {
    res.status(200).json(respond({
        success: true,
        data,
        ...(message && { message })
    }));
};
