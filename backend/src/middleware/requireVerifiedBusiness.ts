import { Request, Response, NextFunction } from 'express';
import type { IAuthUser } from '../types/auth';
import Business from '../models/Business';
import { isBusinessPublishedStatus } from '../utils/businessStatus';
import { sendErrorResponse } from '../utils/errorResponse';
import logger from '../utils/logger';
import { LISTING_TYPE } from '../../../shared/enums/listingType';

/**
 * Resolve businessStatus for the current request user.
 *
 * `req.user.businessStatus` is only present when the frontend session has been
 * explicitly synced (it is NOT encoded in the JWT). This helper falls back to
 * a single indexed DB query so the middleware works correctly even when the
 * JWT-decoded req.user has no businessStatus field.
 */
async function resolveBusinessStatus(req: Request): Promise<string | undefined> {
    const userWithStatus = req.user as IAuthUser & { businessStatus?: string };
    const fromSession: string | undefined = userWithStatus.businessStatus;
    if (fromSession) return fromSession;

    const userId = (req.user as IAuthUser)?._id || (req.user as IAuthUser)?.id;
    if (!userId) return undefined;

    const biz = await Business.findOne({ userId }).select('status').lean();
    return (biz as { status?: string } | null)?.status;
}

/**
 * Middleware: Require Verified Business for Service / Spare-Part creation.
 *
 * Checks that the requesting user owns an admin-approved (live) business.
 * Falls back to a direct indexed Business lookup when businessStatus is not
 * available on req.user (which is the common case since it is not in the JWT).
 *
 * Use `requireBusinessApproved` (businessMiddleware.ts) when you also need the
 * full Business document attached to `req.business`.
 */
export const requireVerifiedBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const businessStatus = await resolveBusinessStatus(req);

        if (!businessStatus || !isBusinessPublishedStatus(businessStatus)) {
            sendErrorResponse(req, res, 403, 'BUSINESS_NOT_VERIFIED', {
                details: {
                    message:
                        'Only admin-verified business accounts can post services or spare parts.' +
                        ` Your current business status: ${businessStatus ?? 'none'}.`,
                    code: 'BUSINESS_NOT_VERIFIED',
                },
            });
            return;
        }

        next();
    } catch (error) {
        logger.error('requireVerifiedBusiness Error:', error);
        sendErrorResponse(req, res, 500, 'Internal Server Error');
    }
};

/**
 * Conditional variant: only enforces the business-verified check when the
 * listingType in the request body is 'service' or 'spare_part'.
 * Apply this on the unified POST /ads route to preserve normal ad posting for all users.
 */
export const requireVerifiedBusinessForServiceParts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const listingType: string | undefined = req.body?.listingType;

    if (listingType === LISTING_TYPE.SERVICE || listingType === LISTING_TYPE.SPARE_PART) {
        return requireVerifiedBusiness(req, res, next);
    }

    next();
};
