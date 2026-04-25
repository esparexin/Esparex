import { Request, Response } from 'express';
import { sendErrorResponse } from './errorResponse';

type ParamErrorOptions = {
    label?: string;
    error?: string;
};

export const getSingleParam = (
    req: Request,
    res: Response,
    param: string,
    options: ParamErrorOptions = {}
): string | null => {
    const raw = req.params[param];

    if (!raw || Array.isArray(raw)) {
        const message = options.error ?? `Invalid ${options.label ?? param}`;
        sendErrorResponse(req, res, 400, message);
        return null;
    }

    return raw;
};
