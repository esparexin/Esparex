"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdCreationService = exports.validateSparePartsForCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("@core/utils/AppError");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const LocationNormalizer_1 = require("./location/LocationNormalizer");
const _shared_1 = require("@shared");
const categoryCanonical_1 = require("@core/utils/categoryCanonical");
const slugGenerator_1 = require("@core/utils/slugGenerator");
const lifecycle_1 = require("@core/constants/enums/lifecycle");
const locationHierarchy_1 = require("@core/utils/locationHierarchy");
const imageProcessor_1 = require("@core/utils/imageProcessor");
const s3_1 = require("@core/utils/s3");
const AdStatusService_1 = require("./AdStatusService");
const listingType_1 = require("@core/constants/enums/listingType");
const featureFlags_1 = require("@core/config/featureFlags");
const adQualityScorer_1 = require("@core/utils/adQualityScorer");
const CatalogValidationService_1 = require("./catalog/CatalogValidationService");
const toObjectIdString = (value) => {
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value.toString();
    if (typeof value === 'string')
        return value.trim() || undefined;
    if (typeof value === 'number')
        return String(value);
    if (value && typeof value === 'object') {
        const record = value;
        const candidate = record._id ?? record.id;
        if (typeof candidate === 'string')
            return candidate.trim() || undefined;
        if (typeof candidate === 'number')
            return String(candidate);
    }
    return undefined;
};
const validateSparePartsForCategory = async (sparePartIds, categoryId) => {
    const uniqueSparePartIds = Array.from(new Set(sparePartIds));
    if (uniqueSparePartIds.length === 0)
        return [];
    const equivalentCategoryIds = await (0, categoryCanonical_1.resolveEquivalentActiveCategoryIds)(categoryId);
    const categoryScope = equivalentCategoryIds.length > 0 ? equivalentCategoryIds : [categoryId];
    const validParts = await SparePart_1.default.find({
        _id: { $in: uniqueSparePartIds },
        categoryIds: { $in: categoryScope },
        isActive: true
    }).select('_id name brandId').lean();
    if (validParts.length !== uniqueSparePartIds.length) {
        throw new AppError_1.AppError('One or more selected spare parts are invalid for the selected category.', 400);
    }
    return validParts;
};
exports.validateSparePartsForCategory = validateSparePartsForCategory;
/**
 * AdCreationService
 * Logic extracted from God-Service adService.ts
 */
class AdCreationService {
    /**
     * AdCreationService: preparePayload
     * Normalizes input data, builds spare parts snapshots, and prepares the final document.
     */
    static async preparePayload(data, context, partial = false, fallbackCategoryId, adId) {
        const source = (data && typeof data === 'object') ? data : {};
        const listingType = source.listingType || listingType_1.LISTING_TYPE.AD;
        const payload = {
            listingType,
            categoryId: typeof source.categoryId === 'string' ? source.categoryId : undefined,
            brandId: typeof source.brandId === 'string' ? source.brandId : undefined,
            modelId: typeof source.modelId === 'string' ? source.modelId : undefined,
            screenSize: typeof source.screenSize === 'string' ? source.screenSize : undefined,
            title: typeof source.title === 'string' ? source.title : undefined,
            description: typeof source.description === 'string' ? source.description : undefined,
            price: typeof source.price === 'number' ? source.price : undefined,
            images: Array.isArray(source.images) ? source.images.filter((img) => typeof img === 'string') : undefined,
            locationId: source.locationId,
            location: source.location && typeof source.location === 'object' ? source.location : undefined,
            sparePartIds: Array.isArray(source.spareParts) ? Array.from(new Set(source.spareParts.filter((part) => typeof part === 'string'))) : undefined,
            isFree: typeof source.isFree === 'boolean' ? source.isFree : undefined,
            deviceCondition: (source.deviceCondition === 'power_on' || source.deviceCondition === 'power_off') ? source.deviceCondition : undefined,
            // Specialized Fields
            sparePartId: typeof source.sparePartId === 'string' ? source.sparePartId : undefined,
            serviceTypeIds: Array.isArray(source.serviceTypeIds) ? source.serviceTypeIds : undefined,
            businessId: source.businessId,
            sellerType: typeof source.sellerType === 'string' ? source.sellerType : undefined,
            attributes: source.attributes && typeof source.attributes === 'object' ? source.attributes : undefined,
        };
        if (payload.title)
            payload.title = payload.title.replace(/<[^>]*>?/gm, '').trim();
        if (payload.description) {
            payload.description = payload.description.replace(/<[^>]*>?/gm, '').trim();
            if (payload.description.length < 20)
                throw new AppError_1.AppError('Description must be at least 20 characters.', 400);
        }
        if (payload.categoryId) {
            const catValidation = await (0, CatalogValidationService_1.validateAdCategoryCapability)(payload.categoryId);
            if (!catValidation.ok) {
                throw new AppError_1.AppError(catValidation.reason || 'Invalid category for ads.', 400);
            }
        }
        if (payload.categoryId && payload.brandId) {
            const brandValidation = await (0, CatalogValidationService_1.validateBrandBelongsToCategory)(payload.brandId, payload.categoryId);
            if (!brandValidation.ok) {
                throw new AppError_1.AppError(brandValidation.reason || 'Invalid brand for category.', 400);
            }
        }
        if (payload.brandId && payload.modelId) {
            const modelValidation = await (0, CatalogValidationService_1.validateModelBelongsToBrand)(payload.modelId, payload.brandId);
            if (!modelValidation.ok) {
                throw new AppError_1.AppError(modelValidation.reason || 'Invalid model for brand.', 400);
            }
        }
        if (Array.isArray(payload.sparePartIds) && payload.sparePartIds.length > 0) {
            const cat = payload.categoryId || fallbackCategoryId;
            if (!cat)
                throw new AppError_1.AppError('Category required for spare parts.', 400);
            const validParts = await (0, exports.validateSparePartsForCategory)(payload.sparePartIds, cat);
            if (await (0, featureFlags_1.isEnabled)(featureFlags_1.FeatureFlag.ENABLE_SPAREPARTS_SNAPSHOT)) {
                const brandIds = validParts.map((p) => p.brandId).filter(Boolean);
                const brands = await Brand_1.default.find({ _id: { $in: brandIds } }).select('_id name').lean();
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
            const normalized = await (0, LocationNormalizer_1.normalizeLocation)(payload.location, { requireLocationId: true });
            if (normalized) {
                payload.location = {
                    ...normalized,
                    coordinates: (0, _shared_1.toGeoPoint)(normalized.coordinates)
                };
                payload.locationId = normalized.locationId || normalized.id;
                const canonicalId = toObjectIdString(payload.locationId);
                if (canonicalId) {
                    const path = await (0, locationHierarchy_1.resolveLocationPathIds)(canonicalId);
                    if (path.length > 0)
                        payload.locationPath = path.map((entry) => entry.toString());
                }
            }
            else {
                throw new AppError_1.AppError('Valid location selection is required.', 400);
            }
        }
        else if (!partial) {
            throw new AppError_1.AppError('Location is required.', 400);
        }
        if (Array.isArray(payload.images) && payload.images.length > 0) {
            const targetAdId = adId || new mongoose_1.default.Types.ObjectId().toString();
            // folder path based on listingType
            let folder = 'ads';
            if (listingType === listingType_1.LISTING_TYPE.SERVICE)
                folder = 'services';
            else if (listingType === listingType_1.LISTING_TYPE.SPARE_PART)
                folder = 'spare-part-listings';
            const processed = (await (0, imageProcessor_1.processImages)(payload.images ?? [], `${folder}/${targetAdId}`));
            payload.images = (0, s3_1.sanitizeStoredImageUrls)(processed.map((img) => img.url));
            payload.thumbnails = (0, s3_1.sanitizeStoredImageUrls)(processed.map((img) => img.thumbnailUrl || img.url));
            payload.imageHashes = processed
                .filter((img) => payload.images?.includes(img.url))
                .map((img) => img.hash ?? '');
            if (processed.length > 0 && (!payload.images || payload.images.length === 0)) {
                throw new AppError_1.AppError('Image upload failed. Please retry.', 502);
            }
        }
        if (payload.title) {
            if (listingType === listingType_1.LISTING_TYPE.SPARE_PART) {
                const { generateUniqueSparePartSlug } = await Promise.resolve().then(() => __importStar(require('./SparePartListingService')));
                payload.seoSlug = await generateUniqueSparePartSlug(payload.title, adId);
            }
            else {
                payload.seoSlug = await (0, slugGenerator_1.generateUniqueSlug)(Ad_1.default, payload.title, undefined, adId);
            }
        }
        if (!partial) {
            payload.sellerId = context.sellerId;
            payload.createdAt = payload.updatedAt = new Date();
            payload.status = context.actor === 'ADMIN' ? lifecycle_1.LIFECYCLE_STATUS.LIVE : lifecycle_1.LIFECYCLE_STATUS.PENDING;
            payload.moderationStatus = context.actor === 'ADMIN' ? 'auto_approved' : 'held_for_review';
            payload.isFree = payload.price === 0 || payload.isFree === true;
            payload.expiresAt = context.actor === 'ADMIN' ? await (0, AdStatusService_1.computeActiveExpiry)(listingType) : undefined;
        }
        // --- Compute Lightweight Listing Quality Score ---
        if (listingType === listingType_1.LISTING_TYPE.SERVICE) {
            const { calculateServiceQuality } = await Promise.resolve().then(() => __importStar(require('../utils/serviceQuality')));
            payload.listingQualityScore = calculateServiceQuality(payload, data?.business);
        }
        else {
            payload.listingQualityScore = (0, adQualityScorer_1.computeListingQualityScore)(payload);
        }
        return payload;
    }
}
exports.AdCreationService = AdCreationService;
//# sourceMappingURL=AdCreationService.js.map