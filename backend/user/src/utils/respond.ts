/**
 * ESPAREX â€” HTTP RESPONSE HELPERS (backend/user transport layer)
 *
 * Contains Express-aware sendSuccessResponse and sendPaginatedResponse.
 * The pure respond<T>() serializer remains in @utils/respond.
 */
export { respond } from '@esparex/core/utils/respond';
export { ApiResponse } from './apiResponse';

import { Response } from 'express';
import { ApiResponse as ApiResponseClass } from './apiResponse';

/**
 * Enhanced Success Response
 * Delegates to unified ApiResponse for consistent meta/envelope.
 */
export const sendSuccessResponse = (res: Response, data: unknown, message?: string, statusCode = 200) => {
    return ApiResponseClass.sendSuccess(res, data, message, statusCode);
};

/**
 * Enhanced Paginated Response
 * Delegates to unified ApiResponse for consistent meta/pagination.
 */
export const sendPaginatedResponse = (res: Response, data: unknown[], total: number, page: number, limit: number) => {
    return ApiResponseClass.sendPaginated(res, data, total, page, limit);
};

