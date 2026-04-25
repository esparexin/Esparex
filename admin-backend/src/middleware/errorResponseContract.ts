import { NextFunction, Request, Response } from 'express';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const resolveMessage = (payload: JsonRecord): string => {
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
        return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message;
    }
    return 'Request failed';
};

export const enforceErrorResponseContract = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
        const statusCode = res.statusCode || 200;
        const isErrorStatus = statusCode >= 400 && statusCode <= 599;

        if (!isErrorStatus || !isRecord(body)) {
            return originalJson(body);
        }

        if (body.success === true) {
            return originalJson(body);
        }

        const normalized: JsonRecord = {
            ...body,
            success: false,
            error: resolveMessage(body),
            meta: {
                requestId: (req as Request & { requestId?: string }).requestId || 'unknown',
                timestamp: new Date().toISOString(),
                path: typeof body.path === 'string' && body.path.trim().length > 0
                    ? body.path
                    : (req.originalUrl || req.path || 'unknown')
            },
            status: typeof body.status === 'number' ? body.status : statusCode
        };


        return originalJson(normalized);
    }) as Response['json'];

    next();
};
