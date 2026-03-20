import { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';

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

    if (!Types.ObjectId.isValid(rawId)) {
        return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
            details: {
                message: `Parameter '${param}' must be a valid ObjectId`,
                received: rawId
            }
        });
    }

    next();
}

/**
 * Middleware to validate multiple ObjectId parameters
 * 
 * @param params - Array of parameter names to validate
 * @returns Express middleware function
 * 
 * @example
 * router.post('/ads/:adId/comments/:commentId', 
 *   validateObjectIds('adId', 'commentId'), 
 *   commentController.reply
 * );
 */
export function validateObjectIds(...params: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];

        for (const param of params) {
            const rawId = req.params[param];

            // Skip if parameter is optional and not provided
            if (!rawId) {
                errors.push(`Missing parameter: ${param}`);
                continue;
            }

            if (Array.isArray(rawId)) {
                errors.push(`Invalid ObjectId format for parameter: ${param}`);
                continue;
            }

            if (!Types.ObjectId.isValid(rawId)) {
                errors.push(`Invalid ObjectId format for parameter: ${param}`);
            }
        }

        if (errors.length > 0) {
            return sendErrorResponse(req, res, 400, 'Validation Failed', {
                details: {
                    message: 'One or more route parameters are invalid',
                    errors
                }
            });
        }

        next();
    };
}

/**
 * Optional: Validate ObjectId in request body
 * 
 * @param field - Name of the body field to validate
 * @returns Express middleware function
 * 
 * @example
 * router.post('/ads', validateBodyObjectId('categoryId'), adController.create);
 */
export function validateBodyObjectId(field: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.body[field];

        // Allow undefined/null for optional fields
        if (!id) {
            return next();
        }

        if (!Types.ObjectId.isValid(id)) {
            return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
                details: {
                    message: `Field '${field}' must be a valid ObjectId`,
                    received: id
                }
            });
        }

        next();
    };
}
