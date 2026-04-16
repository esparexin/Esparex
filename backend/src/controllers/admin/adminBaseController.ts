import { Request, Response } from 'express';

export { respond } from '../../utils/respond';

/**
 * 🔐 ESPAREX PERMISSION CHECKER
 * Ensures the admin user has the required scope for the action.
 * Supports wildcard (*) for full access.
 */
import { IAuthUser } from '../../types/auth';
import { sendErrorResponse } from '../../utils/errorResponse';
import { ApiResponse } from '../../utils/apiResponse';
import logger from '../../utils/logger';


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

export { sendPaginatedResponse, sendSuccessResponse } from '../../utils/respond';

/**
 * 🛠️ CENTRALIZED ADMIN ERROR HANDLER
 * Standardizes administrative error responses.
 */
export const sendAdminError = (req: Request, res: Response, error: unknown, statusCode = 500) => {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const code = (error as { code?: string }).code;
    const details = (error as { details?: unknown }).details;

    if (statusCode >= 500) {
        logger.error('ADMIN_CONTROLLER_ERROR', {
            path: req.path,
            method: req.method,
            error: message,
            stack: isError ? error.stack : undefined
        });
    }

    const errorPayload: Record<string, unknown> = { code };
    if (details !== undefined) errorPayload.details = details;

    return ApiResponse.sendError(req, res, statusCode, message, errorPayload);
};

