import { Request, Response, NextFunction } from 'express';
import type { IAuthUser } from '@esparex/core/types';;
import { Business } from '@esparex/core/models';;
import { isBusinessPublishedStatus } from '@esparex/core/utils';;;;
import { sendErrorResponse } from '@esparex/core/utils';;;;
import { logger } from '@esparex/core/utils';;;;
import { LISTING_TYPE } from '@esparex/shared';

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
 * Middleware: Require Approved Business Account
 * Ensures the user has a business account in canonical published status.
 * Attaches the business document to req.business.
 */
export const requireBusinessApproved = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const business = await Business.findOne({ userId: user._id });

        if (!business) {
            return sendErrorResponse(req, res, 403, 'Business Account Required', {
                details: {
                    message: 'You need a registered business account to perform this action.'
                }
            });
        }

        if (!isBusinessPublishedStatus(business.status)) {
            return sendErrorResponse(req, res, 403, 'Business Not Approved', {
                details: {
                    message: `Your business account is currently ${business.status}. You cannot post content yet.`
                }
            });
        }

        req.business = business;
        next();
    } catch (error) {
        logger.error('requireBusinessApproved Error:', error);
        sendErrorResponse(req, res, 500, 'Internal Server Error');
    }
};

/**
 * Middleware: Require Verified Business for Service / Spare-Part creation.
 *
 * Checks that the requesting user owns an admin-approved (live) business.
 * Falls back to a direct indexed Business lookup when businessStatus is not
 * available on req.user (which is the common case since it is not in the JWT).
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
 * listingType in the request body (creation) or req.listing (edit) is 'service' or 'spare_part'.
 * Apply this on the unified POST /listings and PUT /listings/:id/edit routes to preserve normal ad posting for all users.
 */
export const requireVerifiedBusinessForServiceParts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const listingType = (req.body as { listingType?: string })?.listingType || req.listing?.listingType;

    if (listingType === LISTING_TYPE.SERVICE || listingType === LISTING_TYPE.SPARE_PART) {
        return requireVerifiedBusiness(req, res, next);
    }

    next();
};
