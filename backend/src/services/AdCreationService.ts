import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import Ad from '../models/Ad';
import { normalizeLocation } from './location/LocationNormalizer';
import { toGeoPoint } from '../../../shared/utils/geoUtils';
import { resolveEquivalentActiveCategoryIds } from '../utils/categoryCanonical';
import { generateUniqueSlug } from '../utils/slugGenerator';
import { LIFECYCLE_STATUS } from '../../../shared/enums/lifecycle';
import { resolveLocationPathIds } from '../utils/locationHierarchy';
import { processImages } from '../utils/imageProcessor';
import { sanitizeStoredImageUrls } from '../utils/s3';
import { AdContext } from '../types/ad.types';
import { computeActiveExpiry } from './adStatusService';
import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import { computeListingQualityScore } from '../utils/adQualityScorer';
import { 
    validateBrandBelongsToCategory, 
    validateModelBelongsToBrand,
    validateAdCategoryCapability
} from './catalog/CatalogValidationService';

export interface PreparedPayload {
    categoryId?: string;
    brandId?: string;
    modelId?: string;
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

    const SparePart = (await import('../models/SparePart')).default;
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

    return validParts as Array<{ _id: unknown; name: string; brandId?: unknown }>;
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
        const payload: PreparedPayload = {
            categoryId: typeof source.categoryId === 'string' ? source.categoryId : undefined,
            brandId: typeof source.brandId === 'string' ? source.brandId : undefined,
            modelId: typeof source.modelId === 'string' ? source.modelId : undefined,
            screenSize: typeof source.screenSize === 'string' ? source.screenSize : undefined,
            title: typeof source.title === 'string' ? source.title : undefined,
            description: typeof source.description === 'string' ? source.description : undefined,
            price: typeof source.price === 'number' ? source.price : undefined,
            images: Array.isArray(source.images) ? source.images.filter((img): img is string => typeof img === 'string') : undefined,
            locationId: source.locationId,
            location: source.location && typeof source.location === 'object' ? source.location as Record<string, unknown> : undefined,
            sparePartIds: Array.isArray(source.spareParts) ? Array.from(new Set(source.spareParts.filter((part): part is string => typeof part === 'string'))) : undefined,
            isFree: typeof source.isFree === 'boolean' ? source.isFree : undefined,
            deviceCondition: (source.deviceCondition === 'power_on' || source.deviceCondition === 'power_off') ? source.deviceCondition : undefined
        };

        if (payload.title) payload.title = payload.title.replace(/<[^>]*>?/gm, '').trim();
        if (payload.description) {
            payload.description = payload.description.replace(/<[^>]*>?/gm, '').trim();
            if (payload.description.length < 20) throw new AppError('Description must be at least 20 characters.', 400);
        }

        if (payload.categoryId) {
            const catValidation = await validateAdCategoryCapability(payload.categoryId);
            if (!catValidation.ok) {
                throw new AppError(catValidation.reason || 'Invalid category for ads.', 400);
            }
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
                const Brand = (await import('../models/Brand')).default;
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
            const processed = (await processImages(payload.images ?? [], `ads/${targetAdId}`)) as ProcessedImage[];

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
            // Proactive slug regeneration: Ensure title changes trigger a new unique slug
            // even during partial updates. AdUpdateService.ts will handle collisions.
            payload.seoSlug = await generateUniqueSlug(Ad, payload.title, undefined, adId);
        }

        if (!partial) {
            payload.sellerId = context.sellerId;
            payload.createdAt = payload.updatedAt = new Date();
            payload.status = context.actor === 'ADMIN' ? LIFECYCLE_STATUS.LIVE : LIFECYCLE_STATUS.PENDING;
            payload.moderationStatus = context.actor === 'ADMIN' ? 'auto_approved' : 'held_for_review';
            payload.isFree = payload.price === 0 || payload.isFree === true;
            payload.expiresAt = context.actor === 'ADMIN' ? await computeActiveExpiry((source.listingType as ListingTypeValue) || LISTING_TYPE.AD) : undefined;
        }

        // --- Compute Lightweight Listing Quality Score ---
        payload.listingQualityScore = computeListingQualityScore(payload);

        return payload;
    }
}
