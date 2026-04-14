import logger from '../../utils/logger';
import { Business } from '../../../../shared/types/Business';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { Request, Response } from 'express';
import * as businessService from '../../services/BusinessService';
import { sendErrorResponse } from '../../utils/errorResponse';
import { BusinessStatsPayload, serializeBusinessForOwner } from './shared';

export const getMyBusiness = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const business = await businessService.getBusinessByUserId(user._id.toString());

        const response = respond<ApiResponse<Business | null>>({
            success: true,
            data: (business ? serializeBusinessForOwner(business) : null) as Business | null
        });

        res.json(response);
    } catch (error: unknown) {
        logger.error('Get My Business Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch business');
    }
};

export const getMyBusinessStats = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const userId = user._id.toString();
        const business = await businessService.getBusinessByUserId(userId);

        if (!business) {
            const response = respond<ApiResponse<BusinessStatsPayload>>({
                success: true,
                data: { totalServices: 0, approvedServices: 0, pendingServices: 0, views: 0 }
            });
            res.json(response);
            return;
        }

        const stats = await businessService.getBusinessStats(userId);
        const response = respond<ApiResponse<BusinessStatsPayload>>({
            success: true,
            data: stats,
        });

        res.json(response);

    } catch (error: unknown) {
        logger.error('Get Business Stats Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch business stats');
    }
};
