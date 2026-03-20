import { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * Middleware to support both ObjectId AND Slugs
 * 
 * - If param matches ObjectId format: Validates it
 * - If param looks like a slug: Allows it
 * - Else: Returns 400
 */
export function validateIdOrSlug(param: string = 'id') {
    return (req: Request, res: Response, next: NextFunction) => {
        const rawValue = req.params[param];
        const value = typeof rawValue === 'string' ? rawValue.trim() : '';

        if (!value) {
            return sendErrorResponse(req, res, 400, 'Bad Request', {
                details: { message: `Missing required parameter: ${param}` }
            });
        }

        if (value.length > 200) {
            return sendErrorResponse(req, res, 400, 'Invalid Identifier', {
                details: {
                    message: `Parameter '${param}' is too long`,
                    received: value
                }
            });
        }

        // 1. Is it a valid ObjectId? (24 hex chars)
        if (Types.ObjectId.isValid(value)) {
            req.params[param] = value;
            return next();
        }

        // 2. Slug compatibility:
        // Allow canonical kebab-case plus legacy underscore/dot forms.
        const slugRegex = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/i;

        if (slugRegex.test(value) && value.length >= 2) {
            req.params[param] = value;
            return next();
        }

        // 3. Last-resort compatibility path for legacy slugs with encoded characters.
        // We still reject path traversal markers.
        if (!value.includes('/') && !value.includes('\\') && value.length >= 2) {
            req.params[param] = value;
            return next();
        }

        // 4. Invalid
        return sendErrorResponse(req, res, 400, 'Invalid Identifier', {
            details: {
                message: `Parameter '${param}' must be a valid ID or Slug`,
                received: value
            }
        });
    };
}
