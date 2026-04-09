/**
 * Unified Error Response Builder
 * 
 * Consolidates three similar error handlers into a single, type-safe approach
 * with consistent signatures and behavior across the entire application.
 * 
 * Replaces:
 * - sendErrorResponse() - contract-based responses
 * - sendAdminError() - admin-specific responses  
 * - sendCatalogError() - catalog-specific responses
 * 
 * Usage:
 * ```
 * // Instead of: sendErrorResponse(req, res, 400, 'Not found')
 * // Use:
 * ErrorResponseBuilder.from(req, res)
 *    .status(404)
 *    .message('Resource not found')
 *    .code('NOT_FOUND')
 *    .send();
 * ```
 */

import { Request, Response } from 'express';

export interface ErrorResponseContract {
    success: false;
    error: string;
    status: number;
    path: string;
    code?: string;
    details?: Record<string, unknown>;
}

export class ErrorResponseBuilder {
    private req: Request;
    private res: Response;
    private statusCode = 500;
    private errorMessage = 'Internal server error';
    private errorCode?: string;
    private errorDetails?: Record<string, unknown>;

    private constructor(req: Request, res: Response) {
        this.req = req;
        this.res = res;
    }

    /**
     * Create a new builder from request and response objects
     */
    static from(req: Request, res: Response): ErrorResponseBuilder {
        return new ErrorResponseBuilder(req, res);
    }

    /**
     * Set HTTP status code
     */
    status(code: number): this {
        this.statusCode = code;
        return this;
    }

    /**
     * Set error message
     */
    message(msg: string): this {
        this.errorMessage = msg;
        return this;
    }

    /**
     * Set error code (for client-side error handling)
     */
    code(code: string): this {
        this.errorCode = code;
        return this;
    }

    /**
     * Add detailed error information
     */
    details(details: Record<string, unknown>): this {
        this.errorDetails = details;
        return this;
    }

    /**
     * Build and send the error response
     */
    send(): Response {
        const payload: ErrorResponseContract = {
            success: false,
            error: this.errorMessage,
            status: this.statusCode,
            path: this.req.originalUrl || this.req.path || 'unknown'
        };

        if (this.errorCode) {
            payload.code = this.errorCode;
        }

        if (this.errorDetails) {
            payload.details = this.errorDetails;
        }

        return this.res.status(this.statusCode).json(payload);
    }

    /**
     * Send error and return (for use in handlers)
     */
    sendAndReturn(): Response {
        this.send();
        return this.res;
    }
}

/**
 * Quick error response helpers for common patterns
 */
export const ErrorResponses = {
    /**
     * 400 Bad Request with validation details
     */
    validation: (req: Request, res: Response, message: string, details?: Record<string, unknown>) => {
        const builder = ErrorResponseBuilder.from(req, res)
            .status(400)
            .message(message || 'Validation failed')
            .code('VALIDATION_ERROR');
        if (details) builder.details(details);
        return builder.send();
    },

    /**
     * 401 Unauthorized
     */
    unauthorized: (req: Request, res: Response, message = 'Unauthorized') => {
        return ErrorResponseBuilder.from(req, res)
            .status(401)
            .message(message)
            .code('UNAUTHORIZED')
            .send();
    },

    /**
     * 403 Forbidden
     */
    forbidden: (req: Request, res: Response, message = 'Forbidden') => {
        return ErrorResponseBuilder.from(req, res)
            .status(403)
            .message(message)
            .code('FORBIDDEN')
            .send();
    },

    /**
     * 404 Not Found
     */
    notFound: (req: Request, res: Response, resource = 'Resource') => {
        return ErrorResponseBuilder.from(req, res)
            .status(404)
            .message(`${resource} not found`)
            .code('NOT_FOUND')
            .send();
    },

    /**
     * 409 Conflict (duplicate, race condition, etc)
     */
    conflict: (req: Request, res: Response, message: string, details?: Record<string, unknown>) => {
        const builder = ErrorResponseBuilder.from(req, res)
            .status(409)
            .message(message || 'Conflict')
            .code('CONFLICT');
        if (details) builder.details(details);
        return builder.send();
    },

    /**
     * 422 Unprocessable Entity
     */
    unprocessable: (req: Request, res: Response, message: string, details?: Record<string, unknown>) => {
        const builder = ErrorResponseBuilder.from(req, res)
            .status(422)
            .message(message || 'Cannot process')
            .code('UNPROCESSABLE_ENTITY');
        if (details) builder.details(details);
        return builder.send();
    },

    /**
     * 500 Internal Server Error
     */
    serverError: (req: Request, res: Response, message = 'Internal server error', details?: Record<string, unknown>) => {
        const builder = ErrorResponseBuilder.from(req, res)
            .status(500)
            .message(message)
            .code('INTERNAL_ERROR');
        if (details) builder.details(details);
        return builder.send();
    },

    /**
     * 503 Service Unavailable
     */
    unavailable: (req: Request, res: Response, message = 'Service unavailable') => {
        return ErrorResponseBuilder.from(req, res)
            .status(503)
            .message(message)
            .code('SERVICE_UNAVAILABLE')
            .send();
    }
};
