"use strict";
/**
 * Ad Query Service
 * Handles ad searching, filtering, and listing operations
 *
 * Extracted from adService.ts for better separation of concerns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockedSellerIds = exports.AD_DETAIL_CACHE_TTL_SECONDS = exports.recordListingTypeCompatMetric = exports.normalizeMetricSegment = exports.buildListingTypeFilter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BlockedUser_1 = __importDefault(require("@core/models/BlockedUser"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const AdminMetrics_1 = __importDefault(require("@core/models/AdminMetrics"));
const buildListingTypeFilter = (listingType, allowLegacyListingTypeNullCompat) => {
    if (!listingType)
        return undefined;
    if (Array.isArray(listingType)) {
        const values = [...listingType];
        // Legacy rows can miss listingType; treat them as "ad" during transition.
        if (allowLegacyListingTypeNullCompat && values.includes('ad')) {
            return {
                filter: { $in: [...values, null] },
                compatibilityApplied: true
            };
        }
        return {
            filter: { $in: values },
            compatibilityApplied: false
        };
    }
    if (allowLegacyListingTypeNullCompat && listingType === 'ad') {
        // `{ $in: ['ad', null] }` matches explicit "ad" and missing/null legacy rows.
        return {
            filter: { $in: ['ad', null] },
            compatibilityApplied: true
        };
    }
    return {
        filter: listingType,
        compatibilityApplied: false
    };
};
exports.buildListingTypeFilter = buildListingTypeFilter;
const LISTINGTYPE_COMPAT_METRIC_MODULE = 'ad_listingtype_compat';
const normalizeMetricSegment = (value) => value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
exports.normalizeMetricSegment = normalizeMetricSegment;
const recordListingTypeCompatMetric = async (context, listingType) => {
    try {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const filterLabelRaw = Array.isArray(listingType)
            ? listingType.join('_')
            : String(listingType ?? 'unknown');
        const filterLabel = (0, exports.normalizeMetricSegment)(filterLabelRaw);
        await AdminMetrics_1.default.findOneAndUpdate({ metricModule: LISTINGTYPE_COMPAT_METRIC_MODULE, aggregationDate: date }, {
            $inc: {
                'payload.total': 1,
                [`payload.context.${context}`]: 1,
                [`payload.filters.${filterLabel}`]: 1
            }
        }, { upsert: true });
    }
    catch (error) {
        logger_1.default.warn('Failed to record listingType compatibility metric', {
            context,
            listingType,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.recordListingTypeCompatMetric = recordListingTypeCompatMetric;
exports.AD_DETAIL_CACHE_TTL_SECONDS = 300;
const getBlockedSellerIds = async (viewerId) => {
    if (!viewerId || !mongoose_1.default.Types.ObjectId.isValid(viewerId))
        return [];
    const records = await BlockedUser_1.default.find({
        blockerId: new mongoose_1.default.Types.ObjectId(viewerId),
    })
        .select('blockedId')
        .lean();
    const deduped = new Set();
    const blockedIds = [];
    for (const record of records) {
        const id = record?.blockedId;
        if (!id)
            continue;
        const str = String(id);
        if (deduped.has(str))
            continue;
        deduped.add(str);
        blockedIds.push(id);
    }
    return blockedIds;
};
exports.getBlockedSellerIds = getBlockedSellerIds;
/**
 * @architecture-note Two-Stage Filter Pipeline
 *
 * `buildAdFilterFromCriteria` (utils/adFilterHelper.ts) — Stage 1 (Base Filter)
 *   Builds a flat MongoDB $match object from structured criteria (brandId, categoryId,
 *   price range, location, keywords, status). Used when only a basic match is needed.
 *
 * `buildAdMatchStage` (ad/AdSearchService.ts) — Stage 2 (Enriched Pipeline Stage)
 *   Wraps Stage 1, then adds: geo-enrichment, legacy category slug resolution,
 *   listingType null-compat filters, and seller blocking. Used in $geoNear aggregation
 *   pipelines (AdAggregationService, FeedQueryService) where stage ordering matters.
 *
 * These two functions are intentionally separate — they serve different pipeline depths.
 * Do not collapse them into a single utility without verifying all aggregation stage orders.
 */
//# sourceMappingURL=adFilterHelpers.js.map