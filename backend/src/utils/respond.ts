import { Response } from 'express';
import { serializeDoc } from './serialize';
import { ApiResponse } from './apiResponse';

/**
 * Enforces explicit type checking for API response payloads 
 * and automatically normalizes Mongo _id to id.
 */
export function respond<T>(payload: T): T {
    return serializeDoc(payload);
}

/**
 * Enhanced Success Response
 * Delegates to unified ApiResponse for consistent meta/envelope.
 */
export const sendSuccessResponse = (res: Response, data: unknown, message?: string, statusCode = 200) => {
    return ApiResponse.sendSuccess(res, data, message, statusCode);
};

/**
 * Enhanced Paginated Response
 * Delegates to unified ApiResponse for consistent meta/pagination.
 */
export const sendPaginatedResponse = (res: Response, data: unknown[], total: number, page: number, limit: number) => {
    return ApiResponse.sendPaginated(res, data, total, page, limit);
};
