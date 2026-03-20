import { Request, Response } from 'express';

type ErrorResponseOptions = {
    code?: string;
    details?: unknown;
    [key: string]: unknown;
};

export const buildErrorResponse = (
    req: Request,
    status: number,
    error: string,
    options: ErrorResponseOptions = {}
) => {
    const requestPath = req.originalUrl || req.path || 'unknown';
    const payload: Record<string, unknown> = {
        success: false,
        error,
        path: requestPath,
        status
    };

    if (options.code) payload.code = options.code;
    if (options.details !== undefined) payload.details = options.details;

    for (const [key, value] of Object.entries(options)) {
        if (key === 'code' || key === 'details') continue;
        payload[key] = value;
    }

    return payload;
};

export const sendErrorResponse = (
    req: Request,
    res: Response,
    status: number,
    error: string,
    options: ErrorResponseOptions = {}
) => {
    return res.status(status).json(buildErrorResponse(req, status, error, options));
};
