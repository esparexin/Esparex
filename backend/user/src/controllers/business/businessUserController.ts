import { BusinessCoreService_NS as businessCoreService } from '@esparex/core/services';;

import { logger } from '@esparex/core/utils';;;;
import { Business, ApiResponse } from "@esparex/shared";
import { respond } from '@esparex/core/utils';;;;
import { Request, Response } from 'express';

import { sendErrorResponse } from '@esparex/core/utils';;;;
import { BusinessStatsPayload, serializeBusinessForOwner } from './shared';

export const getMyBusiness = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const business = await businessCoreService.getBusinessByUserId(user._id.toString());

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
        const business = await businessCoreService.getBusinessByUserId(userId);

        if (!business) {
            const response = respond<ApiResponse<BusinessStatsPayload>>({
                success: true,
                data: { totalServices: 0, approvedServices: 0, pendingServices: 0, views: 0 }
            });
            res.json(response);
            return;
        }

        const stats = await businessCoreService.getBusinessStats(userId);
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
