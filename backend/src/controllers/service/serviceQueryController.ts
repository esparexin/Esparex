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
   Get My Services (Owner Only)
--------------------------------------------------- */
export const getMyServices = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        sendErrorResponse(req, res, 401, 'Unauthorized');
        return;
    }

    // Unified: use AdModel with listingType guard
    return handlePaginatedContent(req, res, asModel(AdModel), {
        adminQuery: { sellerId: user._id, listingType: LISTING_TYPE.SERVICE },
        publicQuery: { sellerId: user._id, listingType: LISTING_TYPE.SERVICE },
        populate: [
            { path: 'location.locationId', select: 'name city state' }
        ],
        transformResponse: (items: unknown[]) => hydrateServiceRefs(items as ServiceRecord[]),
        defaultSort: { createdAt: -1 }
    });
};

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
                page: result.pagination.page || 1,
                limit: result.pagination.limit || 20,
                total: result.pagination.total,
                hasMore: result.pagination.hasMore,
                cursor: result.pagination.cursor
            }
        });

        res.json(response);
    } catch (error) {
        logger.error('Get Services Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch services');
    }
};

/* ---------------------------------------------------
   Get Service By ID (Public with Status Guard)
--------------------------------------------------- */
export const getServiceById = async (req: Request, res: Response) => {
    try {
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Service ID or Slug' });
        if (!idOrSlug) return;
        const viewerId = (req.user as any)?._id;

        let serviceId = idOrSlug;

        // 1. If it's NOT an ObjectId, it must be a slug
        if (!mongoose.Types.ObjectId.isValid(idOrSlug)) {
            const foundService = await AdModel.findOne(
                viewerId
                    ? {
                        seoSlug: idOrSlug, // Unified uses 'seoSlug'
                        listingType: LISTING_TYPE.SERVICE,
                        isDeleted: { $ne: true },
                        $or: [
                            { status: AD_STATUS.LIVE },
                            { sellerId: viewerId }
                        ]
                    }
                    : {
                        seoSlug: idOrSlug, // Unified uses 'seoSlug'
                        listingType: LISTING_TYPE.SERVICE,
                        status: AD_STATUS.LIVE,
                        isDeleted: { $ne: true }
                    }
            ).select('_id').exec();

            if (!foundService) {
                sendErrorResponse(req, res, 404, 'Service not found');
                return;
            }
            serviceId = foundService._id.toString();
        }

        // 2. Fetch full service details using the resolved ID
        const viewerIdString = (req.user as any)?._id?.toString();
        const viewerRole = (req.user as any)?.role;
        const viewer = viewerIdString ? { userId: viewerIdString, role: viewerRole } : undefined;

        const service = await adService.getPublicAdById(serviceId, viewer) as (Service & { restricted?: boolean }) | null;

        if (!service) {
            sendErrorResponse(req, res, 404, 'Service not found');
            return;
        }

        // Map unified fields for legacy compatibility
        const mappedService = {
            ...service,
            priceMin: (service as any).price,
            priceMax: (service as any).price,
            id: (service as any).id || (service as any)._id?.toString()
        };

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: mappedService as unknown as Service
        });

        res.json(response);
    } catch (error) {
        logger.error('Get Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch service');
    }
};

export const incrementServiceView = async (req: Request, res: Response) => {
    try {
        const idOrSlug = getSingleParam(req, res, 'id', { error: 'Invalid Service ID or Slug' });
        if (!idOrSlug) return;

        const lookup = mongoose.Types.ObjectId.isValid(idOrSlug)
            ? { _id: idOrSlug, status: AD_STATUS.LIVE, listingType: LISTING_TYPE.SERVICE }
            : { seoSlug: idOrSlug, status: AD_STATUS.LIVE, listingType: LISTING_TYPE.SERVICE };

        await AdModel.exists(lookup);
        // Note: Views are tracked via incrementAdView which is called by AdEngagementService usually
        
        res.json(respond({ success: true }));
    } catch {
        // Service view tracking is non-critical. Preserve JSON success contract.
        res.json(respond({ success: true }));
    }
};

export const getServicePhone = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;
        const requesterId = req.user?._id?.toString();
        const metadata = {
            ip: req.ip || req.socket.remoteAddress,
            device: req.headers['user-agent'] as string | undefined
        };
        // Use 'ad' type because it's now in the Ad collection
        const result = await getSellerPhone(id, 'ad', requesterId, metadata);
        if (!result || result.error) {
            sendErrorResponse(req, res, 404, result?.error || 'Phone number not found');
            return;
        }

        const response = respond<ApiResponse<ContactResponse>>({
            success: true,
            data: result as unknown as ContactResponse
        });

        res.json(response);
    } catch (error: unknown) {
        const statusCode = typeof error === 'object'
            && error !== null
            && 'statusCode' in error
            && typeof (error as { statusCode?: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        const message = error instanceof Error ? error.message : 'Failed to fetch phone number';
        sendErrorResponse(req, res, statusCode, message);
    }
};

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
