import { Request, Response } from 'express';
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
import { sanitizeStoredImageUrls } from '../utils/s3';
import { INVENTORY_STATUS } from '../../../shared/enums/inventoryStatus';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { getAndVerifyOwnedListing } from '../utils/controllerUtils';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import { SparePartPayloadSchema, PartialSparePartPayloadSchema } from '../../../shared/schemas/sparePartPayload.schema';
import * as adService from '../services/AdService';
import { ListingSubmissionPolicy } from '../services/ListingSubmissionPolicy';
import { getUserConnection } from '../config/db';
import { mutateStatus } from '../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { respond } from '../utils/respond';
import { getSellerPhone } from '../services/ContactRevealService';
import { getSingleParam } from '../utils/requestParams';
import type { ApiResponse, ContactResponse, PaginatedResponse } from '../../../shared/types/Api';
import { ListingMutationService } from '../services/ListingMutationService';

import { normalizeImageTokens, toImageUrls } from '../utils/listingUtils';
import { collectImmutableFieldErrors } from '../utils/immutableFieldErrors';
// ---------------------------------------------

const SPARE_PART_EDIT_LOCK_MESSAGES: Record<string, string> = {
    categoryId: 'Category cannot be changed while editing a spare-part listing.',
    brandId: 'Brand cannot be changed while editing a spare-part listing.',
    sparePartId: 'Spare-part mapping cannot be changed while editing a spare-part listing.',
    sparePartTypeId: 'Spare-part mapping cannot be changed while editing a spare-part listing.',
    location: 'Location is fixed to the business profile for spare-part listings.',
    locationId: 'Location is fixed to the business profile for spare-part listings.',
    listingType: 'Listing type cannot be changed while editing a spare-part listing.',
    sellerId: 'Seller cannot be changed while editing a spare-part listing.',
    businessId: 'Business cannot be changed while editing a spare-part listing.',
    condition: 'Condition cannot be changed while editing a spare-part listing.',
    status: 'Status cannot be changed while editing a spare-part listing.',
    moderationStatus: 'Moderation status cannot be changed while editing a spare-part listing.',
    approvedAt: 'Approval metadata cannot be changed while editing a spare-part listing.',
    approvedBy: 'Approval metadata cannot be changed while editing a spare-part listing.',
    isDeleted: 'Deletion state cannot be changed while editing a spare-part listing.',
    deletedAt: 'Deletion state cannot be changed while editing a spare-part listing.',
    expiresAt: 'Expiry cannot be changed while editing a spare-part listing.',
};

// Schemas imported from shared — single source of truth with frontend
const sparePartListingCreateSchema = SparePartPayloadSchema;
// ── update schema: only content fields; category/part/location cannot change ──
const sparePartListingUpdateSchema = PartialSparePartPayloadSchema.pick({
    title: true,
    description: true,
    price: true,
    images: true,
});

/**
 * Create a new Spare Part Listing
 * POST /api/v1/spare-part-listings
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
            return sendContractErrorResponse(req, res, 400, 'Validation failed', { details: parsed.error.issues });
        }

        const {
            categoryId,
            sparePartId,
            brandId,
            title,
            description,
            price,
            images,
        } = parsed.data;

        const rawBusinessLocationId =
            req.business?.locationId
            || (typeof req.business?.location === 'object' && req.business?.location
                ? (req.business.location as { locationId?: unknown }).locationId
                : undefined);
        const locationId =
            rawBusinessLocationId instanceof mongoose.Types.ObjectId
                ? rawBusinessLocationId
                : (typeof rawBusinessLocationId === 'string' && mongoose.Types.ObjectId.isValid(rawBusinessLocationId)
                    ? new mongoose.Types.ObjectId(rawBusinessLocationId)
                    : undefined);

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
        if (incomingImages.length > 0 && processedImageUrls.length === 0) {
            return sendContractErrorResponse(req, res, 502, 'Image upload failed. Please retry.');
        }

        // 🛡️ SEC: Atomic slot reservation + create executed via Unified Service
        const listing = await ListingMutationService.executeCreationTransaction({
            userId: userId.toString(),
            listingType: LISTING_TYPE.SPARE_PART,
            listingId: listingId.toString(),
            adDoc: {
                _id: listingId,
                listingType: LISTING_TYPE.SPARE_PART,
                categoryId,
                sparePartId,
                brandId,
                title,
                description,
                price,
                images: processedImageUrls,
                sellerId: userId,
                sellerType: 'business',
                businessId, // Linked to businessId field in Ad model
                location: {
                    locationId
                },
                status: INVENTORY_STATUS.PENDING,
                seoSlug
            }
        });

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
 * GET /api/v1/spare-part-listings
 */
export const getSparePartListings = async (req: Request, res: Response) => {
    try {
        const { categoryId, typeId, status, page, limit, cursor, search, locationId, lat, lng, radiusKm } = req.query;

        const requestedPage = Number(page) || 1;
        const requestedLimit = Number(limit) || 20;
        const parsedPage = Math.min(requestedPage, 1000);
        const parsedLimit = Math.min(requestedLimit, 100);

        // Redirect to unified AdQueryService
        const result = await adService.getAds(
            {
                listingType: LISTING_TYPE.SPARE_PART,
                categoryId: categoryId as string,
                sparePartId: typeId as string,
                status: (status as any) || AD_STATUS.LIVE,
                ...(search ? { search: search as string } : {}),
                ...(locationId ? { locationId: locationId as string } : {}),
                ...(lat ? { lat: lat as string } : {}),
                ...(lng ? { lng: lng as string } : {}),
                ...(radiusKm ? { radiusKm: Number(radiusKm) } : {}),
            },
            {
                page: parsedPage,
                limit: parsedLimit,
                cursor: cursor as string
            },
            { enforcePublicVisibility: true }
        );

        res.json(respond<PaginatedResponse<Record<string, unknown>>>({
            success: true,
            data: result.data as Array<Record<string, unknown>>,
            pagination: {
                ...result.pagination,
                page: parsedPage,
                limit: parsedLimit,
                ...(parsedLimit !== requestedLimit ? { clampedLimit: true } : {}),
                ...(parsedPage !== requestedPage ? { clampedPage: true } : {}),
            }
        }));
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to fetch listings');
    }
};

/**
 * Update a Spare Part Listing (Owner only)
 * PUT /api/v1/spare-part-listings/:id
 */
export const updateSparePartListing = async (req: Request, res: Response) => {
    try {
        const businessId = req.business?._id;
        if (!businessId) {
            return sendContractErrorResponse(req, res, 401, 'Business not found');
        }

        const listing = await getAndVerifyOwnedListing(req, res, {
            listingType: LISTING_TYPE.SPARE_PART,
            errorMessage: 'Spare part listing not found or access denied'
        });
        if (!listing) return;

        const body = req.body as Record<string, unknown>;
        const lockErrors = collectImmutableFieldErrors(body, SPARE_PART_EDIT_LOCK_MESSAGES);
        if (lockErrors.length > 0) {
            return sendContractErrorResponse(req, res, 400, 'Validation failed', {
                code: 'LOCKED_FIELDS',
                details: lockErrors,
            });
        }

        const listingId = listing._id.toString();

        const parsed = sparePartListingUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return sendContractErrorResponse(req, res, 400, 'Validation failed', { details: parsed.error.issues });
        }

        const updates: Record<string, unknown> = { ...parsed.data };

        // Process new images if provided (upload to S3)
        if (parsed.data.images && parsed.data.images.length > 0) {
            const incomingImages = normalizeImageTokens(parsed.data.images);
            if (incomingImages.length > 0) {
                updates.images = toImageUrls(await processImages(incomingImages, `spare-part-listings/${listingId}`));
                if (!Array.isArray(updates.images) || updates.images.length === 0) {
                    return sendContractErrorResponse(req, res, 502, 'Image upload failed. Please retry.');
                }
            }
        }

        // Regenerate SEO slug if title changed
        if (parsed.data.title && parsed.data.title !== listing.title) {
            updates.seoSlug = await generateUniqueSlug(AdModel, parsed.data.title, listing._id.toString());
        }

        Object.assign(listing, updates);
        await listing.save();

        // 🛡️ Governance: if the listing was LIVE or REJECTED, route status back to PENDING
        let finalData: unknown = listing;
        const prevStatus = listing.status;
        if (prevStatus === INVENTORY_STATUS.LIVE || prevStatus === INVENTORY_STATUS.REJECTED) {
            try {
                finalData = await mutateStatus({
                    domain: 'spare_part_listing',
                    entityId: listing._id,
                    toStatus: INVENTORY_STATUS.PENDING,
                    actor: { type: ACTOR_TYPE.USER, id: (req.user as any)?._id?.toString() },
                    reason: 'Seller edited listing — re-review required'
                });
            } catch {
                finalData = listing;
            }
        }

        res.status(200).json({ success: true, data: finalData, message: 'Spare part listing updated.' });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to update spare part listing');
    }
};

/**
 * Delete (soft) a Spare Part Listing (Owner only)
 * DELETE /api/v1/spare-part-listings/:id
 */
export const deleteSparePartListing = async (req: Request, res: Response) => {
    try {
        const listing = await getAndVerifyOwnedListing(req, res, {
            listingType: LISTING_TYPE.SPARE_PART,
            errorMessage: 'Spare part listing not found or access denied'
        });
        if (!listing) return;

        await listing.softDelete();
        res.status(204).end();
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to delete spare part listing');
    }
};

/**
 * Deactivate a Spare Part Listing (Owner only) — LIVE → DEACTIVATED
 * PATCH /api/v1/spare-part-listings/:id/deactivate
 */
export const deactivateSparePartListing = async (req: Request, res: Response) => {
    try {
        const listing = await getAndVerifyOwnedListing(req, res, {
            listingType: LISTING_TYPE.SPARE_PART,
            errorMessage: 'Spare part listing not found or access denied',
            select: 'status'
        });
        if (!listing) return;

        const listingId = listing._id.toString();

        const updated = await mutateStatus({
            domain: 'spare_part_listing',
            entityId: listingId,
            toStatus: 'deactivated',
            actor: { type: ACTOR_TYPE.USER, id: (req.user as any)?._id?.toString() },
            reason: 'Deactivated by seller',
        });

        res.status(200).json({ success: true, data: updated, message: 'Spare part listing deactivated.' });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to deactivate spare part listing');
    }
};

/**
 * Repost (Renew) a Spare Part Listing — EXPIRED/REJECTED → PENDING
 * POST /api/v1/spare-part-listings/:id/repost
 */
export const repostSparePartListing = async (req: Request, res: Response) => {
    try {
        const listing = await getAndVerifyOwnedListing(req, res, {
            listingType: LISTING_TYPE.SPARE_PART,
            errorMessage: 'Spare part listing not found or access denied',
            select: 'status'
        });
        if (!listing) return;

        const listingId = (listing._id || getSingleParam(req, res, 'id')).toString();

        const currentStatus = (listing.status || 'unknown') as string;
        if (currentStatus !== AD_STATUS.EXPIRED && currentStatus !== AD_STATUS.REJECTED) {
            return sendContractErrorResponse(req, res, 400, 'Only expired or rejected listings can be reposted');
        }

        const updated = await mutateStatus({
            domain: 'spare_part_listing',
            entityId: listingId,
            toStatus: AD_STATUS.PENDING,
            actor: { type: ACTOR_TYPE.USER, id: (req.user as any)?._id?.toString() },
            reason: 'Reposted by seller for review',
            metadata: { action: 'repost' },
        });

        res.status(200).json({ success: true, data: updated, message: 'Spare part listing reposted and under review.' });
    } catch (error) {
        sendContractErrorResponse(req, res, 500, 'Failed to repost spare part listing');
    }
};

/**
 * Note: getSparePartPhone removed. Use listingController.getListingPhone.
 */
