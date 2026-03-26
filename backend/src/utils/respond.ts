import { Response } from 'express';
import { serializeDoc } from './serialize';

/**
 * Enforces explicit type checking for API response payloads 
 * and automatically normalizes Mongo _id to id.
 * @param payload The data to be sent in the response
 * @returns The payload, verified to match type T and normalized
 */
export function respond<T>(payload: T): T {
    return serializeDoc(payload);
}

export const sendSuccessResponse = (res: Response, data: unknown, message?: string, statusCode = 200) => {
    return res.status(statusCode).json(respond({
        success: true,
        data,
        ...(message && { message })
    }));
};

export const sendPaginatedResponse = (res: Response, data: unknown[], total: number, page: number, limit: number) => {
    return res.status(200).json(respond({
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
