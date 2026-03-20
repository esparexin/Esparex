import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';

const toLower = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isUnsafeLiveStatusMutation = (req: Request) => {
    const requestedStatus = toLower(req.body?.status);
    if (requestedStatus !== 'live') return false;
    return !req.path.endsWith('/approve');
};

export const lifecyclePolicyHttpGuard = (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.hardDelete === true) {
        sendErrorResponse(req, res, 400, 'Hard delete is forbidden. Listings must be soft deleted.', {
            code: 'HARD_DELETE_FORBIDDEN',
        });
        return;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'expiresAt') && !req.path.endsWith('/approve')) {
        sendErrorResponse(req, res, 400, 'expiresAt cannot be mutated outside moderation approval.', {
            code: 'EXPIRESAT_MUTATION_FORBIDDEN',
        });
        return;
    }

    if (isUnsafeLiveStatusMutation(req)) {
        sendErrorResponse(req, res, 400, 'Live transition is allowed only via moderation approval.', {
            code: 'LIVE_TRANSITION_REQUIRES_APPROVAL',
        });
        return;
    }

    next();
};
