import logger from '../../utils/logger';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AdModel from '../../models/Ad';
import Category from '../../models/Category';
import { getUserConnection } from '../../config/db';
import { resolveMasterDataIds } from '../../utils/masterDataResolver';
import { calculateServiceQuality } from '../../utils/serviceQuality';
import { Service } from '../../../../shared/types/Service';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { ListingSubmissionPolicy } from '../../services/ListingSubmissionPolicy';
import { getSingleParam } from '../../utils/requestParams';
import { deleteFromS3Url } from '../../utils/s3';
import { normalizeLocation } from '../../services/LocationService';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';
import { sendErrorResponse } from '../../utils/errorResponse';
import { processImages } from '../../utils/imageProcessor';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { SERVICE_STATUS } from '../../../../shared/enums/serviceStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { mutateStatus } from '../../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import { resolveServiceTypes, toServiceTypeObjectId as toObjectId } from '../../utils/serviceTypeResolver';
import * as CatalogValidationService from '../../services/catalog/CatalogValidationService';
import { resolveCategoryId } from '../../../../shared/utils/resolveCategoryId';

const SERVICE_ALLOWED_FIELDS = [
    'title',
    'description',
    // NOTE: 'price' intentionally excluded — it is not a DB field.
    // Legacy 'price' → 'priceMin' coercion happens on the raw body before field-picking.
    'images',
    'serviceTypeIds',
    'serviceTypes', // frontend sends names; resolveServiceTypes handles both names and ObjectIds
    'deviceType',
    'priceMin'
] as const;
const SERVICE_TAXONOMY_FIELDS = ['categoryId', 'brandId', 'modelId'] as const;

const pickAllowedFields = (
    body: Record<string, unknown>,
    allowedFields: readonly string[],
    options: { allowUndefined?: boolean } = {}
): Record<string, unknown> => {
    const picked: Record<string, unknown> = {};
    const allowUndefined = options.allowUndefined !== false;
    allowedFields.forEach((key) => {
        if (
            Object.prototype.hasOwnProperty.call(body, key)
            && (allowUndefined || body[key] !== undefined)
        ) {
            picked[key] = body[key];
        }
    });
    return picked;
};

const buildLocationInput = (body: Record<string, unknown>) => ({
    locationId: body.locationId,
    ...(typeof body.location === 'object' ? body.location : {}),
    ...(typeof body.location === 'string'
        ? { city: body.location, display: body.location }
        : {}),
});

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

/* ---------------------------------------------------
   Create Service (Business User)
--------------------------------------------------- */
export const createService = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const business = req.business; // 🔒 FROM MIDDLEWARE
        const body = req.body as Record<string, unknown>;
        const safeBody = pickAllowedFields(body, SERVICE_ALLOWED_FIELDS, { allowUndefined: true });
        const createServiceTypeTokens = safeBody.serviceTypeIds ?? safeBody.serviceTypes;
        if (safeBody.serviceTypes !== undefined && safeBody.serviceTypeIds === undefined) {
            logger.warn('Legacy serviceTypes payload detected; prefer serviceTypeIds', {
                route: 'createService'
            });
        }

        const resolvedCategory = resolveCategoryId(body.categoryId || body.category);
        const resIds = await resolveMasterDataIds({
            category: resolvedCategory,
            brand: (body.brandId || body.brand) as string,
            model: (body.modelId || body.model || body.deviceModel) as string
        });

        const categoryId = mongoose.Types.ObjectId.isValid(body.categoryId as string)
            ? new mongoose.Types.ObjectId(body.categoryId as string)
            : resIds.categoryId;
        const brandId = mongoose.Types.ObjectId.isValid(body.brandId as string)
            ? new mongoose.Types.ObjectId(body.brandId as string)
            : resIds.brandId;
        const modelId = mongoose.Types.ObjectId.isValid(body.modelId as string)
            ? new mongoose.Types.ObjectId(body.modelId as string)
            : resIds.modelId;

        if (!user || !business || !isBusinessPublishedStatus(business.status)) {
            sendErrorResponse(req, res, 403, 'Approved Business Account Required');
            return;
        }

        if (!categoryId) {
            sendErrorResponse(req, res, 400, 'Valid category is required');
            return;
        }

        const catCapability = await CatalogValidationService.validateServiceCategoryCapability(categoryId.toString());
        if (!catCapability.ok) {
            sendErrorResponse(req, res, 400, catCapability.reason || 'Category does not support services');
            return;
        }

        const resolvedServiceTypes = await resolveServiceTypes(
            createServiceTypeTokens,
            categoryId
        );

        // 🛡️ Selection Mode Validation
        const categoryDoc = await Category.findById(categoryId).select('serviceSelectionMode').lean() as { serviceSelectionMode?: 'single' | 'multi' } | null;
        const selectionMode = categoryDoc?.serviceSelectionMode || 'multi';

        if (selectionMode === 'single' && resolvedServiceTypes && resolvedServiceTypes.serviceTypeIds.length > 1) {
            logger.warn('Selection mode violation in service creation', { categoryId, selectionMode, selectedCount: resolvedServiceTypes.serviceTypeIds.length });
            sendErrorResponse(req, res, 400, 'This category only allows selecting a single service type');
            return;
        }

        if (!resolvedServiceTypes || resolvedServiceTypes.serviceTypeIds.length === 0) {
            logger.warn('No service types resolved in service creation', { categoryId, rawTypes: createServiceTypeTokens });
            sendErrorResponse(req, res, 400, 'At least one valid service type is required for this category');
            return;
        }

        let locId: mongoose.Types.ObjectId | undefined;
        try {
            const normalizedLocation = await normalizeLocation(
                buildLocationInput(body),
                { requireLocationId: false } // Relaxed: fallback handled below
            );
            locId = normalizedLocation?.locationId;
        } catch (locationError: unknown) {
            logger.warn('Non-fatal location resolution error in service creation', { error: locationError });
        }

        // 🛡️ Fix 2: Fallback to business location if not explicitly provided or resolved
        if (!locId && business.locationId) {
            locId = business.locationId as mongoose.Types.ObjectId;
        }

        if (!locId) {
            sendErrorResponse(req, res, 400, 'Valid location is required (business profile missing location)');
            return;
        }

        // 🛡️ Fix 1: Catalog Integrity Validation
        if (categoryId && brandId && brandId.toString() !== 'all') {
            const validation = await CatalogValidationService.validateBrandBelongsToCategory(
                brandId.toString(),
                categoryId.toString()
            );
            if (!validation.ok) {
                sendErrorResponse(req, res, 400, validation.reason || 'Brand does not belong to the selected category', {
                    code: 'INVALID_BRAND_CATEGORY_COMBO'
                });
                return;
            }
        }

        // Image processing (S3) runs outside the transaction — non-DB, non-rollbackable
        const serviceId = new mongoose.Types.ObjectId();
        const incomingImages = normalizeImageTokens(safeBody.images);
        if (incomingImages.length > 0) {
            safeBody.images = toImageUrls(await processImages(incomingImages, `services/${serviceId.toString()}`));
        }

        // 🛡️ Fix 3: Compute Initial Quality Score
        const listingQualityScore = calculateServiceQuality(safeBody, business);

        // 🛡️ SEC-3: Atomic slot reservation + create in a single transaction to prevent TOCTOU race.
        const dbSession = await getUserConnection().startSession();
        let service: unknown;
        try {
            await dbSession.withTransaction(async () => {
                await ListingSubmissionPolicy.reserveSlot({
                    userId: user._id.toString(),
                    listingType: LISTING_TYPE.SERVICE,
                    listingId: serviceId.toString(),
                    session: dbSession,
                    actor: 'user',
                });
                const adDoc = {
                    _id: serviceId,
                    listingType: LISTING_TYPE.SERVICE,
                    listingQualityScore,
                    serviceTypeIds: resolvedServiceTypes.serviceTypeIds,
                    categoryId,
                    brandId,
                    modelId,
                    location: {
                        locationId: locId
                    },
                    sellerId: user._id,
                    sellerType: 'business' as const,
                    businessId: business._id, // 🔒 LINKED TO BUSINESS
                    status: 'pending' as const,        // 🔒 ALWAYS PENDING
                    expiresAt: undefined,     // 🔒 NO EXPIRY YET
                    price: (safeBody.priceMin as number) || 0, // Use priceMin as the main price for the unified record
                    title: safeBody.title as string,
                    description: safeBody.description as string,
                    images: safeBody.images as string[],
                    attributes: {
                        ...safeBody,
                    }
                };

                const created = await AdModel.create([adDoc], { session: dbSession });
                service = created[0];
            });
        } finally {
            await dbSession.endSession();
        }

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: service as unknown as Service,
            message: 'Service submitted for approval.'
        });

        res.status(201).json(response);
    } catch (error) {
        logger.error('Create Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to create service');
    }
};

/* ---------------------------------------------------
   Update Service (Owner Only → Re-review)
--------------------------------------------------- */
export const updateService = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const business = req.business; // 🔒 FROM MIDDLEWARE
        const body = req.body as Record<string, unknown>;

        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            sendErrorResponse(req, res, 400, 'Invalid Service ID');
            return;
        }

        const updates = pickAllowedFields(body, [...SERVICE_ALLOWED_FIELDS, 'deviceModel'], { allowUndefined: false });

        const categoryIdInput = body.categoryId || body.category;
        const rawCategoryId = categoryIdInput ? resolveCategoryId(categoryIdInput) : undefined;
        
        const resIds = await resolveMasterDataIds({
            category: rawCategoryId,
            brand: (body.brandId || body.brand) as string,
            model: (body.modelId || body.model || body.deviceModel) as string
        });

        const existingService = await AdModel.findOne({
            _id: id,
            listingType: LISTING_TYPE.SERVICE,
            businessId: business?._id || { $exists: false },
            sellerId: user._id
        }).select('images status approvedAt categoryId brandId').lean();

        if (!existingService) {
            sendErrorResponse(req, res, 404, 'Service not found or unauthorized');
            return;
        }

        const categoryId = mongoose.Types.ObjectId.isValid(body.categoryId as string)
            ? new mongoose.Types.ObjectId(body.categoryId as string)
            : resIds.categoryId;
        const brandId = mongoose.Types.ObjectId.isValid(body.brandId as string)
            ? new mongoose.Types.ObjectId(body.brandId as string)
            : resIds.brandId;
        const modelId = mongoose.Types.ObjectId.isValid(body.modelId as string)
            ? new mongoose.Types.ObjectId(body.modelId as string)
            : resIds.modelId;

        const hasTaxonomyUpdate = (categoryId && categoryId.toString() !== existingService.categoryId?.toString())
            || (brandId && brandId.toString() !== existingService.brandId?.toString());

        if (categoryId) updates.categoryId = categoryId;
        if (brandId) updates.brandId = brandId;
        if (modelId) updates.modelId = modelId;

        if (updates.serviceTypeIds !== undefined || body.serviceTypes !== undefined) {
            const updateServiceTypeTokens = body.serviceTypeIds ?? body.serviceTypes;
            if (body.serviceTypes !== undefined && body.serviceTypeIds === undefined) {
                logger.warn('Legacy serviceTypes payload detected; prefer serviceTypeIds', {
                    route: 'updateService',
                    serviceId: id
                });
            }
            const categoryForServiceType = categoryId || existingService.categoryId;
            const resolvedServiceTypes = await resolveServiceTypes(
                updateServiceTypeTokens,
                categoryForServiceType
            );

            if (resolvedServiceTypes.serviceTypeIds.length === 0) {
                logger.warn('No service types resolved in service update', { categoryId: categoryForServiceType, rawTypes: updateServiceTypeTokens });
                sendErrorResponse(req, res, 400, 'At least one valid service type is required for this category');
                return;
            }

            updates.serviceTypeIds = resolvedServiceTypes.serviceTypeIds;

            // 🛡️ Selection Mode Validation
            const categoryDocForUpdate = await Category.findById(categoryForServiceType).select('serviceSelectionMode').lean() as { serviceSelectionMode?: 'single' | 'multi' } | null;
            const selectionModeForUpdate = categoryDocForUpdate?.serviceSelectionMode || 'multi';

            if (selectionModeForUpdate === 'single' && Array.isArray(updates.serviceTypeIds) && (updates.serviceTypeIds as any[]).length > 1) {
                sendErrorResponse(req, res, 400, 'This category only allows selecting a single service type');
                return;
            }
        }

        if (body.locationId || body.location) {
            try {
                const normalizedLocation = await normalizeLocation(
                    buildLocationInput(body),
                    { requireLocationId: false }
                );

                if (normalizedLocation?.locationId) {
                    updates.location = {
                        locationId: normalizedLocation.locationId
                    };
                }
            } catch (locationError: unknown) {
                logger.warn('Non-fatal location resolution error in service update', { error: locationError });
            }
        }

        // Brand/Category validation if changed (Fix 1)
        const finalCategoryId = (updates.categoryId || existingService.categoryId)?.toString();
        const finalBrandId = (updates.brandId || existingService.brandId)?.toString();

        if (finalCategoryId && finalBrandId && finalBrandId !== 'all') {
            const capValidation = await CatalogValidationService.validateServiceCategoryCapability(finalCategoryId);
            if (!capValidation.ok) {
                sendErrorResponse(req, res, 400, capValidation.reason || 'Category does not support services');
                return;
            }

            const validation = await CatalogValidationService.validateBrandBelongsToCategory(
                finalBrandId,
                finalCategoryId
            );
            if (!validation.ok) {
                sendErrorResponse(req, res, 400, validation.reason || 'Brand does not belong to the selected category', {
                    code: 'INVALID_BRAND_CATEGORY_COMBO'
                });
                return;
            }
        }

        // Image processing with hierarchical pathing
        if (updates.images !== undefined) {
            const incomingImages = normalizeImageTokens(updates.images);
            updates.images = toImageUrls(await processImages(incomingImages, `services/${id}`));
        }

        // Keep normalized location updates when provided.
        // A previous cleanup step removed this field and silently dropped
        // valid location edits from the persisted update payload.

        // 🛡️ Fix 3: Recalculate Quality Score on Update
        // Note: Merge existing and updates to get the full picture
        const mergedForQuality = { ...existingService, ...updates };
        updates.listingQualityScore = calculateServiceQuality(mergedForQuality, business);

        if (updates.priceMin !== undefined) {
            updates.price = updates.priceMin;
        }

        // 🔒 Ensure service belongs to this business
        const service = await AdModel.findOneAndUpdate(
            { _id: id, listingType: LISTING_TYPE.SERVICE, businessId: business?._id || { $exists: false }, sellerId: user._id },
            updates,
            { new: true }
        );

        // If not found, it might belong to another business or user
        if (!service) {
            sendErrorResponse(req, res, 404, 'Service not found or unauthorized');
            return;
        }

        if (Array.isArray(updates.images) && Array.isArray(existingService.images)) {
            const nextImages = new Set(updates.images.filter((img: unknown) => typeof img === 'string' && img.length > 0));
            const removedImages = existingService.images.filter((img: string) => img && !nextImages.has(img));

            if (removedImages.length > 0) {
                await Promise.all(
                    removedImages.map(async (url: string) => {
                        try {
                            await deleteFromS3Url(url);
                        } catch (cleanupError) {
                            logger.warn('Failed to cleanup removed service image', {
                                serviceId: id,
                                imageUrl: url,
                                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
                            });
                        }
                    })
                );
            }
        }

        // 🛡️ Governance: route status transitions through mutateStatus for history tracking.
        // LIVE→PENDING and REJECTED→PENDING require a StatusHistory audit entry.
        // PENDING→PENDING is a no-op transition (already under review); leave status as-is.
        let finalServiceData: unknown = service;
        const prevStatus = existingService.status;
        if (prevStatus === AD_STATUS.LIVE || prevStatus === SERVICE_STATUS.REJECTED) {
            try {
                finalServiceData = await mutateStatus({
                    domain: 'service',
                    entityId: id,
                    toStatus: SERVICE_STATUS.PENDING,
                    actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
                    reason: 'Seller edited service — re-review required'
                });
            } catch (statusError) {
                logger.error('Service status transition failed after update', {
                    serviceId: id,
                    error: statusError instanceof Error ? statusError.message : String(statusError)
                });
            }
        }

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: finalServiceData as unknown as Service,
            message: 'Service updated and submitted for re-approval.'
        });

        res.json(response);
    } catch (error) {
        logger.error('Update Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to update service');
    }
};

/* ---------------------------------------------------
   Mark Service as Sold (Owner Only)
--------------------------------------------------- */
export const markServiceAsSold = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) { sendErrorResponse(req, res, 401, 'Unauthorized'); return; }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;

        const service = await AdModel.findOne({
            _id: id,
            listingType: LISTING_TYPE.SERVICE,
            sellerId: user._id,
            isDeleted: false,
        }).select('status');

        if (!service) { sendErrorResponse(req, res, 404, 'Service not found or unauthorized'); return; }
        if (service.status !== 'live') { sendErrorResponse(req, res, 400, 'Only live services can be marked as sold'); return; }

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: 'sold',
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: req.body.soldReason || 'Marked as sold by seller',
            patch: { soldReason: req.body.soldReason, soldAt: new Date() },
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service marked as sold' }));
    } catch (error) {
        logger.error('Mark Service Sold Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to mark service as sold');
    }
};

/* ---------------------------------------------------
   Deactivate Service (Owner Only) — LIVE → DEACTIVATED
--------------------------------------------------- */
export const deactivateService = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) { sendErrorResponse(req, res, 401, 'Unauthorized'); return; }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;

        const service = await AdModel.findOne({
            _id: id,
            listingType: LISTING_TYPE.SERVICE,
            sellerId: user._id,
            isDeleted: false,
        }).select('status');

        if (!service) { sendErrorResponse(req, res, 404, 'Service not found or unauthorized'); return; }

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: 'deactivated',
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: 'Deactivated by seller',
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service deactivated' }));
    } catch (error) {
        logger.error('Deactivate Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to deactivate service');
    }
};

/* ---------------------------------------------------
   Repost Service (Owner Only) — EXPIRED/REJECTED → PENDING
--------------------------------------------------- */
export const repostService = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) { sendErrorResponse(req, res, 401, 'Unauthorized'); return; }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;

        const service = await AdModel.findOne({
            _id: id,
            listingType: LISTING_TYPE.SERVICE,
            sellerId: user._id,
            isDeleted: false,
        }).select('status');

        if (!service) { sendErrorResponse(req, res, 404, 'Service not found or unauthorized'); return; }

        const currentStatus = service.status as string;
        if (currentStatus !== AD_STATUS.EXPIRED && currentStatus !== AD_STATUS.REJECTED) {
            sendErrorResponse(req, res, 400, 'Only expired or rejected services can be reposted');
            return;
        }

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: AD_STATUS.PENDING,
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: 'Reposted by seller for review',
            metadata: { action: 'repost' },
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service reposted and under review' }));
    } catch (error) {
        logger.error('Repost Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to repost service');
    }
};

/* ---------------------------------------------------
   Delete Service (Owner Only)
--------------------------------------------------- */
export const deleteService = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            sendErrorResponse(req, res, 400, 'Invalid Service ID');
            return;
        }

        // 🛡️ Find first to ensure ownership and existence
        const service = await AdModel.findOne({
            _id: id,
            listingType: LISTING_TYPE.SERVICE,
            sellerId: user._id
        });

        if (!service) {
            sendErrorResponse(req, res, 404, 'Service not found or unauthorized');
            return;
        }

        // 🛡️ Soft Delete
        await (service as unknown as { softDelete: () => Promise<void> }).softDelete();

        const response = respond<ApiResponse<null>>({
            success: true,
            data: null,
            message: 'Service deleted'
        });

        res.json(response);
    } catch (error) {
        logger.error('Delete Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to delete service');
    }
};
