import { Request, Response, NextFunction } from 'express';
import Business from '../models/Business';
import { isBusinessPublishedStatus } from '../utils/businessStatus';
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * Middleware: Require Approved Business Account
 * Ensures the user has a business account in canonical published status.
 * Attaches the business document to req.business.
 */
export const requireBusinessApproved = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const business = await Business.findOne({ userId: req.user._id });

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
