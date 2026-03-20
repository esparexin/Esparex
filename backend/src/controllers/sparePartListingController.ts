import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import AdModel from '../models/Ad';
// NOTE: SparePart and Category are registered on getAdminConnection() — direct import IS the
// admin-connection-bound model; no additional connection context is needed here.
import SparePart from '../models/SparePart';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Model from '../models/Model';
import { sendSuccessResponse } from './admin/adminBaseController';
import { sendErrorResponse as sendContractErrorResponse } from '../utils/errorResponse';
import { generateUniqueSlug } from '../utils/slugGenerator';
import { processImages } from '../utils/imageProcessor';
import { INVENTORY_STATUS } from '../../../shared/enums/inventoryStatus';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import * as adService from '../services/AdService';
import { ListingSubmissionPolicy } from '../services/ListingSubmissionPolicy';
import { getUserConnection } from '../config/db';
import { mutateStatus } from '../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { respond } from '../utils/respond';

// --------------- local helpers ---------------
const normalizeImageTokens = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
};

const toImageUrls = (value: Array<{ url: string; hash: string }>): string[] =>
    value
        .map((item) => item.url)
        .filter((item): item is string => typeof item === 'string' && item.length > 0);
// ---------------------------------------------

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');

const sparePartListingCreateSchema = z.object({
    categoryId: objectIdSchema,
    sparePartId: objectIdSchema,
    compatibleModels: z.array(objectIdSchema).optional(),
    brandId: objectIdSchema.optional(),
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(10).max(2000),
    price: z.number().min(0),
    condition: z.enum(['new', 'used', 'refurbished']).default('used'),
    stock: z.coerce.number().int().min(1).default(1),
    warranty: z.string().optional(),
    images: z.array(z.string()).optional(),
    locationId: objectIdSchema.optional(),
    location: z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        display: z.string().optional(),
        coordinates: z.object({
            type: z.literal('Point'),
            coordinates: z.array(z.number()).length(2)
        }).optional()
    }).optional()
}).strict();

/**
 * Create a new Spare Part Listing
 * POST /api/v1/spare-parts
 */
export const createSparePartListing = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const businessId = req.business?._id;

        if (!userId || !businessId) {
            return sendContractErrorResponse(req, res, 401, 'Unauthorized or Business not found');
        }

        const parsed = sparePartListingCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            return sendContractErrorResponse(req, res, 400, 'Validation failed', { details: parsed.error.errors });
        }

        const {
            categoryId,
            sparePartId,
            compatibleModels,
            brandId,
            title,
            description,
            price,
            condition,
            stock,
            warranty,
            images,
            locationId,
            location
        } = parsed.data;

        // Explicit check after optional parse — user-friendly error message
        if (!locationId) {
            return sendContractErrorResponse(req, res, 400, 'Business location ID is required. Please update your business profile to set a valid location.');
        }

        // Verify Master Data (read-only catalog lookups; safe outside transaction)
        const [category, type] = await Promise.all([
            Category.findById(categoryId),
            SparePart.findById(sparePartId)
        ]);

        if (!category) return sendContractErrorResponse(req, res, 404, 'Category not found');
        if (!type) return sendContractErrorResponse(req, res, 404, 'Spare Part not found');

        // Generate listing ID upfront for consistent S3 folder path
        const listingId = new mongoose.Types.ObjectId();
        const seoSlug = await generateUniqueSlug(AdModel, title, undefined);

        // Upload images to S3 — external operation, must run BEFORE the transaction
        const incomingImages = normalizeImageTokens(images ?? []);
        const processedImageUrls = incomingImages.length > 0
            ? toImageUrls(await processImages(incomingImages, `spare-part-listings/${listingId.toString()}`))
            : [];

        // 🛡️ SEC: Atomic slot reservation + create in a single transaction to prevent TOCTOU race.
        const dbSession = await getUserConnection().startSession();
        let listing: unknown;
        try {
            await dbSession.withTransaction(async () => {
                await ListingSubmissionPolicy.reserveSlot({
                    userId: userId.toString(),
                    listingType: 'spare_part',
                    listingId: listingId.toString(),
                    session: dbSession,
                    actor: 'user',
                });
                [listing] = await AdModel.create([{
                    _id: listingId,
                    listingType: 'spare_part',
                    categoryId,
                    sparePartId,
                    compatibleModels: compatibleModels ?? [],
                    brandId,
                    title,
                    description,
                    price,
                    condition,
                    stock,
                    warranty,
                    images: processedImageUrls,
                    sellerId: userId,
                    sellerType: 'business',
                    businessId, // Linked to businessId field in Ad model
                    location: {
                        ...location,
                        locationId
                    },
                    status: INVENTORY_STATUS.PENDING,
                    seoSlug
                }], { session: dbSession });
            });
        } finally {
            await dbSession.endSession();
        }

        res.status(201).json({
            success: true,
            data: listing,
            message: 'Spare part listing created successfully. Pending moderation.'
        });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to create spare part listing');
    }
};

/**
 * Get Spare Part Listings (Public/Search)
 * GET /api/v1/spare-parts
 */
export const getSparePartListings = async (req: Request, res: Response) => {
    try {
        const { categoryId, typeId, status, page, limit, cursor } = req.query;

        // Redirect to unified AdQueryService
        const result = await adService.getAds(
            {
                listingType: 'spare_part',
                categoryId: categoryId as string,
                sparePartId: typeId as string,
                status: (status as any) || AD_STATUS.LIVE
            },
            {
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                cursor: cursor as string
            },
            { enforcePublicVisibility: true }
        );

        res.json(respond({
            success: true,
            data: {
                items: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                hasMore: result.pagination.hasMore
            }
        }));
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to fetch listings');
    }
};

/**
 * Get single Spare Part Listing by slug or ID
 * GET /api/v1/spare-parts/:idOrSlug
 */
export const getSparePartListing = async (req: Request, res: Response) => {
    try {
        const idOrSlug = req.params.idOrSlug as string;
        let adId = idOrSlug;

        if (!mongoose.Types.ObjectId.isValid(idOrSlug)) {
            // Resolve slug via Ad model
            const resolvedId = await adService.getAdIdBySlug(idOrSlug, { listingType: 'spare_part', isDeleted: { $ne: true } });
            if (!resolvedId) {
                return sendContractErrorResponse(req, res, 404, 'Listing not found');
            }
            adId = resolvedId;
        }

        const viewerId = (req.user as any)?._id?.toString();
        const viewerRole = (req.user as any)?.role;
        const viewer = viewerId ? { userId: viewerId, role: viewerRole } : undefined;

        const listing = await adService.getPublicAdById(adId, viewer);

        if (!listing) {
            return sendContractErrorResponse(req, res, 404, 'Listing not found');
        }

        res.json(respond({ success: true, data: listing }));
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to fetch listing');
    }
};

/**
 * Get My Spare Part Listings (Authenticated Business)
 * GET /api/v1/spare-parts/my-listings
 */
export const getMySparePartListings = async (req: Request, res: Response) => {
    try {
        const businessId = req.business?._id;
        if (!businessId) {
            return sendContractErrorResponse(req, res, 401, 'Business not found');
        }

        const { status } = req.query;
        const query: any = { sellerBusinessId: businessId, listingType: 'spare_part', isDeleted: false };
        if (status) query.status = status;

        const items = await AdModel.find(query)
            .populate({ path: 'categoryId', model: Category, select: 'name slug' })
            .populate({ path: 'sparePartIds', model: SparePart, select: 'name slug' }) // Note: plural field in Ad model
            .sort({ createdAt: -1 });

        res.json(respond({ success: true, data: { items, total: items.length } }));
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to fetch your listings');
    }
};

// ── update schema: only content fields; category/part/location cannot change ──
const sparePartListingUpdateSchema = z.object({
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    price: z.number().min(0).optional(),
    condition: z.enum(['new', 'used', 'refurbished']).optional(),
    stock: z.coerce.number().int().min(1).optional(),
    warranty: z.string().optional(),
    images: z.array(z.string()).optional(),
    compatibleModels: z.array(objectIdSchema).optional(),
}).strict();

/**
 * Update a Spare Part Listing (Owner only)
 * PUT /api/v1/spare-parts/:id
 */
export const updateSparePartListing = async (req: Request, res: Response) => {
    try {
        const businessId = req.business?._id;
        if (!businessId) {
            return sendContractErrorResponse(req, res, 401, 'Business not found');
        }

        const listingId = req.params.id as string;
        const listing = await AdModel.findOne({
            _id: listingId,
            listingType: 'spare_part',
            businessId: businessId,
            isDeleted: false,
        });

        if (!listing) {
            return sendContractErrorResponse(req, res, 404, 'Spare part listing not found or access denied');
        }

        const parsed = sparePartListingUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return sendContractErrorResponse(req, res, 400, 'Validation failed', { details: parsed.error.errors });
        }

        const updates: Record<string, unknown> = { ...parsed.data };

        // Process new images if provided (upload to S3)
        if (parsed.data.images && parsed.data.images.length > 0) {
            const incomingImages = normalizeImageTokens(parsed.data.images);
            if (incomingImages.length > 0) {
                updates.images = toImageUrls(await processImages(incomingImages, `spare-part-listings/${listingId}`));
            }
        }

        // Regenerate SEO slug if title changed
        if (parsed.data.title && parsed.data.title !== listing.title) {
            updates.seoSlug = await generateUniqueSlug(AdModel, parsed.data.title, listing._id.toString());
        }

        Object.assign(listing, updates);
        await listing.save();

        // 🛡️ Governance: if the listing was LIVE or REJECTED, route status back to PENDING
        // so admin re-reviews the updated content. Mirrors serviceMutationController.updateService().
        let finalData: unknown = listing;
        const prevStatus = listing.status;
        if (prevStatus === INVENTORY_STATUS.LIVE || prevStatus === INVENTORY_STATUS.REJECTED) {
            finalData = await mutateStatus({
                domain: 'spare_part_listing',
                entityId: listing._id,
                toStatus: INVENTORY_STATUS.PENDING,
                actor: { type: ACTOR_TYPE.USER, id: (req.user as any)?._id?.toString() },
                reason: 'Seller edited listing — re-review required'
            });
        }

        res.status(200).json({ success: true, data: finalData, message: 'Spare part listing updated.' });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to update spare part listing');
    }
};

/**
 * Delete (soft) a Spare Part Listing (Owner only)
 * DELETE /api/v1/spare-parts/:id
 */
export const deleteSparePartListing = async (req: Request, res: Response) => {
    try {
        const businessId = req.business?._id;
        if (!businessId) {
            return sendContractErrorResponse(req, res, 401, 'Business not found');
        }

        const listingId = req.params.id as string;
        const listing = await AdModel.findOne({
            _id: listingId,
            listingType: 'spare_part',
            businessId: businessId,
            isDeleted: false,
        });

        if (!listing) {
            return sendContractErrorResponse(req, res, 404, 'Spare part listing not found or access denied');
        }

        await listing.softDelete();
        res.status(200).json({ success: true, data: null, message: 'Spare part listing deleted.' });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to delete spare part listing');
    }
};
