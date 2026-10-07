import { isValidObjectId } from '@esparex/core';
import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from "../utils/errorResponse";

/**
 * Middleware to validate ObjectId route parameter
 * 
 * @param param - Name of the route parameter to validate (default: 'id')
 * @returns Express middleware function
 * 
 * @example
 * router.get('/users/:id', validateObjectId('id'), userController.getById);
 * router.delete('/ads/:adId', validateObjectId('adId'), adController.delete);
 */
// Overload for direct middleware usage (defaults to 'id')
export function validateObjectId(req: Request, res: Response, next: NextFunction): void;
// Overload for factory usage (custom param name)
export function validateObjectId(param: string): (req: Request, res: Response, next: NextFunction) => void;

export function validateObjectId(arg1: string | Request, arg2?: Response, arg3?: NextFunction) {
    // Case 1: Factory usage - validateObjectId('paramName')
    if (typeof arg1 === 'string' || arg1 === undefined) {
        const param = arg1 || 'id';
        return (req: Request, res: Response, next: NextFunction) => {
            validateInternal(req, res, next, param);
        };
    }

    // Case 2: Middleware usage - validateObjectId(req, res, next)
    const req = arg1;
    const res = arg2 as Response;
    const next = arg3 as NextFunction;
    validateInternal(req, res, next, 'id');
}

function validateInternal(req: Request, res: Response, next: NextFunction, param: string) {
    const rawId = req.params[param];

    if (!rawId) {
        return sendErrorResponse(req, res, 400, 'Bad Request', {
            details: { message: `Missing required parameter: ${param}` }
        });
    }

    if (Array.isArray(rawId)) {
        return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
            details: {
                message: `Parameter '${param}' must be a single ObjectId`,
                received: rawId
            }
        });
    }

    // Special keyword support for bulk operations
    if (rawId === 'all') {
        next();
        return;
    }

    if (!isValidObjectId(rawId)) {
        return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
            details: {
                message: `Parameter '${param}' must be a valid ObjectId`,
                received: rawId
            }
        });
    }

    next();
}


