import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import Ad from '../models/Ad';
import SparePart from '../models/SparePart';
import Brand from '../models/Brand';
import { normalizeLocation } from './location/LocationNormalizer';
import { toGeoPoint } from '@esparex/shared';
import { resolveEquivalentActiveCategoryIds } from '../utils/categoryCanonical';
import { generateUniqueSlug } from '../utils/slugGenerator';
import { LIFECYCLE_STATUS } from '../constants/enums/lifecycle';
import { resolveLocationPathIds } from '../utils/locationHierarchy';
import { processImages } from '../utils/imageProcessor';
import { sanitizeStoredImageUrls } from '../utils/s3';
import { AdContext } from '../types/ad.types';
import { computeActiveExpiry } from './AdStatusService';
import { LISTING_TYPE, type ListingTypeValue } from '../constants/enums/listingType';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import { computeListingQualityScore } from '../utils/adQualityScorer';
import { 
    validateBrandBelongsToCategory, 
    validateModelBelongsToBrand,
    validateListingCategoryCapability
} from './catalog/CatalogValidationService';

export interface PreparedPayload {
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    catalogRequestId?: string;
    catalogPending?: boolean;
    screenSize?: string;
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
    thumbnails?: string[];
    locationId?: unknown;
    location?: Record<string, unknown>;
    locationPath?: string[];
    sparePartIds?: string[];
    isFree?: boolean;
    deviceCondition?: string;
    imageHashes?: string[];
    seoSlug?: string;
    sellerId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    publishedAt?: Date;
    status?: string;
    moderationStatus?: string;
    moderationReason?: string;
    expiresAt?: Date;
    fraudScore?: number;
    listingQualityScore?: number;
    sparePartsSnapshot?: Record<string, unknown>[];
    duplicateFingerprint?: string;
    $push?: {
        timeline: {
            status: string;
            timestamp: Date;
            reason: string;
        };
    };
}

const toObjectIdString = (value: unknown): string | undefined => {
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const candidate = record._id ?? record.id;
        if (typeof candidate === 'string') return candidate.trim() || undefined;
        if (typeof candidate === 'number') return String(candidate);
    }
    return undefined;
};

export const validateSparePartsForCategory = async (
    sparePartIds: string[],
    categoryId: string
): Promise<Array<{ _id: unknown; name: unknown; brandId?: unknown }>> => {
    const uniqueSparePartIds = Array.from(new Set(sparePartIds));
    if (uniqueSparePartIds.length === 0) return [];

    const equivalentCategoryIds = await resolveEquivalentActiveCategoryIds(categoryId);
    const categoryScope = equivalentCategoryIds.length > 0 ? equivalentCategoryIds : [categoryId];

    const validParts = await SparePart.find({
        _id: { $in: uniqueSparePartIds },
        categoryIds: { $in: categoryScope },
        isActive: true
    }).select('_id name brandId').lean();

    if (validParts.length !== uniqueSparePartIds.length) {
        throw new AppError('One or more selected spare parts are invalid for the selected category.', 400);
    }

    return validParts;
};

/**
 * AdCreationService
 * Logic extracted from God-Service adService.ts
 */
export class AdCreationService {
    /**
     * AdCreationService: preparePayload
     * Normalizes input data, builds spare parts snapshots, and prepares the final document.
     */
    static async preparePayload(
        data: unknown,
        context: AdContext,
        partial: boolean = false,
        fallbackCategoryId?: string,
        adId?: string
    ): Promise<PreparedPayload> {
        const source = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
        const listingType = (source.listingType as ListingTypeValue) || LISTING_TYPE.AD;

        const payload: PreparedPayload & Record<string, unknown> = {
            listingType,
            categoryId: typeof source.categoryId === 'string' ? source.categoryId : undefined,
            brandId: typeof source.brandId === 'string' ? source.brandId : undefined,
            modelId: typeof source.modelId === 'string' ? source.modelId : undefined,
            catalogRequestId: typeof source.catalogRequestId === 'string' ? source.catalogRequestId : undefined,
            screenSize: typeof source.screenSize === 'string' ? source.screenSize : undefined,
            title: typeof source.title === 'string' ? source.title : undefined,
            description: typeof source.description === 'string' ? source.description : undefined,
            price: typeof source.price === 'number' ? source.price : undefined,
            images: Array.isArray(source.images) ? source.images.filter((img): img is string => typeof img === 'string') : undefined,
            locationId: source.locationId,
            location: source.location && typeof source.location === 'object' ? source.location as Record<string, unknown> : undefined,
            sparePartIds: Array.isArray(source.spareParts) ? Array.from(new Set(source.spareParts.filter((part): part is string => typeof part === 'string'))) : undefined,
            isFree: typeof source.isFree === 'boolean' ? source.isFree : undefined,
            deviceCondition: (source.deviceCondition === 'power_on' || source.deviceCondition === 'power_off') ? source.deviceCondition : undefined,
            
            // Specialized Fields
            sparePartId: typeof source.sparePartId === 'string' ? source.sparePartId : undefined,
            serviceTypeIds: Array.isArray(source.serviceTypeIds) ? source.serviceTypeIds : undefined,
            businessId: source.businessId,
            sellerType: typeof source.sellerType === 'string' ? source.sellerType : undefined,
            attributes: source.attributes && typeof source.attributes === 'object' ? source.attributes : undefined,
        };

        if (payload.catalogRequestId) {
            if (!mongoose.Types.ObjectId.isValid(payload.catalogRequestId)) {
                throw new AppError('catalogRequestId must be a valid ObjectId.', 400);
            }

            const CatalogRequest = (await import('../models/CatalogRequest')).default;
            const catalogRequest = await CatalogRequest.findById(payload.catalogRequestId)
                .select('requestType categoryId parentBrandId status requestedBy')
                .lean<{
                    requestType?: 'brand' | 'model';
                    categoryId?: mongoose.Types.ObjectId;
                    parentBrandId?: mongoose.Types.ObjectId | null;
                    status?: 'pending' | 'approved' | 'rejected' | 'duplicate';
                    requestedBy?: mongoose.Types.ObjectId;
                } | null>();

            if (!catalogRequest) {
                throw new AppError('Referenced catalog request was not found.', 404, 'CATALOG_REQUEST_NOT_FOUND');
            }

            if (catalogRequest.status !== 'pending') {
                throw new AppError('Only pending catalog requests can be linked to ads.', 400, 'CATALOG_REQUEST_NOT_PENDING');
            }

            if (context.actor === 'USER' && String(catalogRequest.requestedBy) !== context.sellerId) {
                throw new AppError('You can only link your own pending catalog requests.', 403, 'CATALOG_REQUEST_OWNERSHIP_MISMATCH');
            }

            if (payload.categoryId && String(catalogRequest.categoryId) !== payload.categoryId) {
                throw new AppError('catalogRequestId category does not match the listing category.', 400, 'CATALOG_REQUEST_CATEGORY_MISMATCH');
            }

            if (!payload.categoryId) {
                payload.categoryId = String(catalogRequest.categoryId);
            }

            if (catalogRequest.requestType === 'model') {
                const parentBrandId = catalogRequest.parentBrandId ? String(catalogRequest.parentBrandId) : null;
                if (!parentBrandId) {
                    throw new AppError('Model catalog requests must include a valid parent brand.', 400, 'CATALOG_REQUEST_PARENT_BRAND_MISSING');
                }
                if (payload.brandId && payload.brandId !== parentBrandId) {
                    throw new AppError('Listing brand does not match the model request parent brand.', 400, 'CATALOG_REQUEST_BRAND_MISMATCH');
                }
                payload.brandId = parentBrandId;
            }

            payload.catalogPending = true;
        }

        if (payload.title) payload.title = payload.title.replace(/<[^>]*>?/gm, '').trim();
        if (payload.description) {
            payload.description = payload.description.replace(/<[^>]*>?/gm, '').trim();
            if (payload.description.length < 20) throw new AppError('Description must be at least 20 characters.', 400);
        }

        // 🛡️ GOVERNANCE: Category capability guard (Type-aware)
        if (payload.categoryId) {
            const catValidation = await validateListingCategoryCapability(payload.categoryId, listingType);
            if (!catValidation.ok) {
                throw new AppError(catValidation.reason || `Invalid category for ${listingType}.`, 400);
            }
        }

        // 🛡️ GOVERNANCE: Unified Relation Validation
        if (listingType === LISTING_TYPE.SERVICE && Array.isArray(payload.serviceTypeIds) && payload.serviceTypeIds.length > 0) {
            const serviceTypeIds = payload.serviceTypeIds.filter(Boolean) as string[];
            if (serviceTypeIds.length === 0) {
                throw new AppError('At least one service type is required for service listings.', 400);
            }
        }

        if (listingType === LISTING_TYPE.SPARE_PART && !payload.sparePartId) {
            throw new AppError('A valid spare part from the catalog is required for spare part listings.', 400);
        }

        if (payload.categoryId && payload.brandId) {
            const brandValidation = await validateBrandBelongsToCategory(payload.brandId, payload.categoryId);
            if (!brandValidation.ok) {
                throw new AppError(brandValidation.reason || 'Invalid brand for category.', 400);
            }
        }

        if (payload.brandId && payload.modelId) {
            const modelValidation = await validateModelBelongsToBrand(payload.modelId, payload.brandId);
            if (!modelValidation.ok) {
                throw new AppError(modelValidation.reason || 'Invalid model for brand.', 400);
            }
        }

        if (Array.isArray(payload.sparePartIds) && payload.sparePartIds.length > 0) {
            const cat = payload.categoryId || fallbackCategoryId;
            if (!cat) throw new AppError('Category required for spare parts.', 400);
            const validParts = await validateSparePartsForCategory(payload.sparePartIds, cat);
            
            if (await isEnabled(FeatureFlag.ENABLE_SPAREPARTS_SNAPSHOT)) {
                const brandIds = validParts.map((p) => p.brandId).filter(Boolean) as import('mongoose').Types.ObjectId[];
                const brands = await Brand.find({ _id: { $in: brandIds } }).select('_id name').lean();
                const brandMap = new Map(brands.map((b) => [String(b._id), b.name]));
                payload.sparePartsSnapshot = validParts.map((part) => ({
                    _id: part._id,
                    name: part.name,
                    brand: part.brandId ? brandMap.get(String(part.brandId)) : undefined
                }));
            }
        }

        if (payload.location) {
            // Require locationId for canonical enforcement
            const normalized = await normalizeLocation(payload.location, { requireLocationId: true });
            if (normalized) {
                payload.location = { 
                    ...normalized, 
                    coordinates: toGeoPoint(normalized.coordinates) 
                };
                payload.locationId = normalized.locationId || normalized.id;
                
                const canonicalId = toObjectIdString(payload.locationId);
                if (canonicalId) {
                    const path = await resolveLocationPathIds(canonicalId);
                    if (path.length > 0) payload.locationPath = path.map((entry) => entry.toString());
                }
            } else {
                throw new AppError('Valid location selection is required.', 400);
            }
        } else if (!partial) {
            throw new AppError('Location is required.', 400);
        }

        if (Array.isArray(payload.images) && payload.images.length > 0) {
            const targetAdId = adId || new mongoose.Types.ObjectId().toString();
            type ProcessedImage = { url: string; thumbnailUrl?: string; hash?: string };
            
            // folder path based on listingType
            let folder = 'ads';
            if (listingType === LISTING_TYPE.SERVICE) folder = 'services';
            else if (listingType === LISTING_TYPE.SPARE_PART) folder = 'spare-part-listings';

            const processed = (await processImages(payload.images ?? [], `${folder}/${targetAdId}`)) as ProcessedImage[];

            payload.images = sanitizeStoredImageUrls(processed.map((img) => img.url));
            payload.thumbnails = sanitizeStoredImageUrls(processed.map((img) => img.thumbnailUrl || img.url));

            payload.imageHashes = processed
                .filter((img) => payload.images?.includes(img.url))
                .map((img) => img.hash ?? '');

            if (processed.length > 0 && (!payload.images || payload.images.length === 0)) {
                throw new AppError('Image upload failed. Please retry.', 502);
            }
        }

        if (payload.title) {
            if (listingType === LISTING_TYPE.SPARE_PART) {
                const { generateUniqueSparePartSlug } = await import('./SparePartListingService');
                payload.seoSlug = await generateUniqueSparePartSlug(payload.title, adId);
            } else {
                payload.seoSlug = await generateUniqueSlug(Ad, payload.title, undefined, adId);
            }
        }

        if (!partial) {
            payload.sellerId = context.sellerId;
            payload.createdAt = payload.updatedAt = new Date();
            
            const isHeldForCatalog = payload.catalogPending === true;
            
            payload.status = (context.actor === 'ADMIN' && !isHeldForCatalog) ? LIFECYCLE_STATUS.LIVE : LIFECYCLE_STATUS.PENDING;
            payload.moderationStatus = (context.actor === 'ADMIN' && !isHeldForCatalog) ? 'auto_approved' : 'held_for_review';
            
            payload.isFree = payload.price === 0 || payload.isFree === true;
            payload.expiresAt = (context.actor === 'ADMIN' && !isHeldForCatalog) ? await computeActiveExpiry(listingType) : undefined;
        }

        // --- Compute Lightweight Listing Quality Score ---
        if (listingType === LISTING_TYPE.SERVICE) {
            const { calculateServiceQuality } = await import('../utils/serviceQuality');
            payload.listingQualityScore = calculateServiceQuality(payload, (data as { business?: Record<string, unknown> })?.business);
        } else {
            payload.listingQualityScore = computeListingQualityScore(payload);
        }

        return payload;
    }
}
