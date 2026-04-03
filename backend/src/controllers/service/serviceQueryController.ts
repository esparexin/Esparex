import logger from '../../utils/logger';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Document, Model as MongooseModel } from 'mongoose';
import AdModel from '../../models/Ad';
import CategoryModel from '../../models/Category';
import * as adService from '../../services/AdService';
import { getSellerPhone } from '../../services/ContactRevealService';
import { Service } from '../../../../shared/types/Service';
import { ApiResponse, ContactResponse, PaginatedResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { handlePaginatedContent } from '../../utils/contentHandler';
import { hydrateServiceRefs, type ServiceRecord } from '../../utils/serviceRefResolver';
import { getSingleParam } from '../../utils/requestParams';
import { sendErrorResponse } from '../../utils/errorResponse';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { AD_STATUS } from '../../../../shared/enums/adStatus';

type ServiceAnalyticsPayload = {
    totalServices: number;
    pendingServices: number;
    activeServices: number;
    growth: number;
};

const asModel = <T extends Document>(model: MongooseModel<T>): MongooseModel<T> => model;

/* ---------------------------------------------------
   Get All Services (Public)
--------------------------------------------------- */
export const getServices = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandId, locationId, level, location, search, page, limit, lat, lng, radiusKm, minPrice, maxPrice, cursor } = req.query;
        const parsedLat = typeof lat === 'string' ? Number(lat) : undefined;
        const parsedLng = typeof lng === 'string' ? Number(lng) : undefined;
        const parsedRadiusKm = typeof radiusKm === 'string' ? Number(radiusKm) : undefined;

        // Redirect to unified AdQueryService
        const result = await adService.getAds(
            {
                listingType: LISTING_TYPE.SERVICE,
                categoryId: categoryId as string,
                brandId: brandId as string,
                locationId: locationId as string,
                level: level as any,
                location: location as string,
                search: search as string,
                lat: Number.isFinite(parsedLat) ? parsedLat : undefined,
                lng: Number.isFinite(parsedLng) ? parsedLng : undefined,
                radiusKm: Number.isFinite(parsedRadiusKm) ? parsedRadiusKm : undefined,
                minPrice: Number(minPrice),
                maxPrice: Number(maxPrice),
                status: AD_STATUS.LIVE
            },
            {
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                cursor: cursor as string
            },
            { enforcePublicVisibility: true }
        );

        // Map unified 'price' to legacy 'priceMin' for frontend compatibility
        const mappedData = result.data.map(ad => ({
            ...ad,
            priceMin: ad.price,
            priceMax: ad.price, // Unified model uses single price field currently
            id: ad.id || ad._id?.toString()
        }));

        const response = respond<PaginatedResponse<Service>>({
            success: true,
            data: mappedData as unknown as Service[],
            pagination: {
                ...result.pagination,
                page: result.pagination.page || 1,
                limit: result.pagination.limit || 20,
            }
        });

        res.json(response);
    } catch (error) {
        logger.error('Get Services Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch services');
    }
};



/**
 * Note: incrementServiceView and getServicePhone removed.
 * Use listingController.incrementListingView and listingController.getListingPhone via generic /api/v1/listings routes.
 */

/* ---------------------------------------------------
   Analytics (Admin Only)
--------------------------------------------------- */
export const getServiceAnalytics = async (req: Request, res: Response) => {
    try {
        const totalServices = await AdModel.countDocuments({ listingType: LISTING_TYPE.SERVICE });
        const pendingServices = await AdModel.countDocuments({ listingType: LISTING_TYPE.SERVICE, status: 'pending' });
        const activeServices = await AdModel.countDocuments({ listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.LIVE });

        // Simple mock growth data for now (or aggregation if needed)
        const growth = 12; // Mock +12%

        const response = respond<ApiResponse<ServiceAnalyticsPayload>>({
            success: true,
            data: {
                totalServices,
                pendingServices,
                activeServices,
                growth
            }
        });

        res.json(response);
    } catch (error) {
        logger.error('Service Analytics Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch service analytics');
    }
};
