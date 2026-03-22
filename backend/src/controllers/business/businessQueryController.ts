import logger from '../../utils/logger';
import { Business } from '../../../../shared/types/Business';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { Request, Response } from 'express';
import * as businessService from '../../services/BusinessService';
import Ad from '../../models/Ad';
import { Service as SharedService } from '../../../../shared/types/Service';
import { getSingleParam } from '../../utils/requestParams';
import { sendErrorResponse } from '../../utils/errorResponse';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';
import {
    BusinessStatsPayload,
    findBusinessByIdentifier,
    sanitizeBusinessForPublic
} from './shared';

export const getBusinesses = async (req: Request, res: Response) => {
    try {
        const { city, category, limit } = req.query;
        const businesses = await businessService.getBusinesses({
            city: city as string,
            category: category as string,
            limit: limit ? parseInt(limit as string) : 20
        });
        const sanitizedBusinesses = businesses.map((business) => sanitizeBusinessForPublic(business));

        const response = respond<ApiResponse<Business[]>>({
            success: true,
            data: sanitizedBusinesses as unknown as Business[]
        });

        res.json(response);
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch businesses');
    }
};

export const getBusinessById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID format' });
        if (!id) return;

        const business = await findBusinessByIdentifier(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const user = req.user;
        const isOwner = user && business.userId.toString() === user._id.toString();
        const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.isAdmin);

        if (!isBusinessPublishedStatus(business.status) && !isOwner && !isAdmin) {
            sendErrorResponse(req, res, 403, 'Profile unverified', {
                message: 'This business profile is pending approval or is not currently active.'
            });
            return;
        }

        const payload = (!isOwner && !isAdmin)
            ? sanitizeBusinessForPublic(business)
            : business;

        const response = respond<ApiResponse<Business>>({
            success: true,
            data: payload as unknown as Business
        });

        res.json(response);
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch business');
    }
};

export const getBusinessServices = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID' });
        if (!id) return;
        const business = await findBusinessByIdentifier(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const services = await Ad.find({
            sellerId: business.userId,
            listingType: LISTING_TYPE.SERVICE,
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 }).lean();

        const response = respond<ApiResponse<SharedService[]>>({
            success: true,
            data: services as unknown as SharedService[]
        });

        res.json(response);
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch business services');
    }
};

export const getBusinessAds = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID' });
        if (!id) return;
        const business = await findBusinessByIdentifier(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const ads = await Ad.find({
            sellerId: business.userId,
            listingType: LISTING_TYPE.AD,
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 }).lean();

        res.json(respond<ApiResponse<unknown[]>>({ success: true, data: ads }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch business ads');
    }
};

export const getBusinessSpareParts = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID' });
        if (!id) return;
        const business = await findBusinessByIdentifier(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const parts = await Ad.find({
            sellerId: business.userId,
            listingType: LISTING_TYPE.SPARE_PART,
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 }).lean();

        res.json(respond<ApiResponse<unknown[]>>({ success: true, data: parts }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch business spare parts');
    }
};

export const getBusinessStatsById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID' });
        if (!id) return;

        const business = await findBusinessByIdentifier(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const userId = business.userId.toString();
        const [totalServices, approvedServices, pendingServices] = await Promise.all([
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE }),
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.LIVE }),
            Ad.countDocuments({ sellerId: userId, listingType: LISTING_TYPE.SERVICE, status: 'pending' })
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
        logger.error('Get Business Stats By ID Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch business stats');
    }
};
