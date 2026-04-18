import { Request, Response } from 'express';
import { serializeDoc } from './serialize';
import { TraceContext } from '@shared/observability/trace';

export interface ApiResponseEnvelope<T = unknown> {
    success: boolean;
    data: T | null;
    error: string | null;
    meta: {
        requestId?: string;
        timestamp: string;
        path: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export class ApiResponse {
    /**
     * Standard success response
     */
    static sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
        const req = (res as unknown as { req: Request }).req;
        const payload: ApiResponseEnvelope<T> = {
            success: true,
            data: serializeDoc(data),
            error: null,
            meta: {
                requestId: TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown'
            }
        };

        if (message) {
            (payload as ApiResponseEnvelope<T> & { message?: string }).message = message;
        }

        return res.status(statusCode).json(payload);
    }

    /**
     * Standard error response
     */
    static sendError(req: Request, res: Response, status: number, error: string, options: Record<string, unknown> = {}) {
        const payload: ApiResponseEnvelope<null> = {
            success: false,
            data: null,
            error,
            meta: {
                requestId: TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown'
            }
        };

        // Merge extra options (code, details, etc.) into top level or meta as needed
        const fullPayload = {
            ...payload,
            ...options,
            status // Consistent with legacy errorResponse
        };

        return res.status(status).json(fullPayload);
    }

    /**
     * Standard paginated response
     */
    static sendPaginated<T>(res: Response, items: T[], total: number, page: number, limit: number) {
        const req = (res as unknown as { req: Request }).req;
        const payload: ApiResponseEnvelope<{ items: T[] }> = {
            success: true,
            data: {
                items: serializeDoc(items)
            },
            error: null,
            meta: {
                requestId: TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown',
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };

        return res.status(200).json(payload);
    }
}
