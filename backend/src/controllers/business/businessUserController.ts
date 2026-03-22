import logger from '../../utils/logger';
import { Business } from '../../../../shared/types/Business';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { Request, Response } from 'express';
import * as businessService from '../../services/BusinessService';
import Ad from '../../models/Ad';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import BusinessModel from '../../models/Business';
import { sendErrorResponse } from '../../utils/errorResponse';
import { BusinessStatsPayload } from './shared';

export const getMyBusinesses = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const businesses = await businessService.getBusinessesByUserId(user._id.toString());

        const response = respond<ApiResponse<Business[]>>({
            success: true,
            data: businesses as unknown as Business[]
        });

        res.json(response);
    } catch (error: unknown) {
        logger.error('Get My Businesses Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch businesses');
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
        const business = await BusinessModel.findOne({ userId });

        if (!business) {
            const response = respond<ApiResponse<BusinessStatsPayload>>({
                success: true,
                data: { totalServices: 0, approvedServices: 0, pendingServices: 0, views: 0 }
            });
            res.json(response);
            return;
        }

        const [totalServices, approvedServices, pendingServices] = await Promise.all([
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE }),
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.LIVE }),
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.PENDING })
        ]);

        const response = respond<ApiResponse<BusinessStatsPayload>>({
            success: true,
            data: {
                totalServices,
                approvedServices,
                pendingServices,
                views: 0
            }
        });

        res.json(response);

    } catch (error: unknown) {
        logger.error('Get Business Stats Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch business stats');
    }
};
