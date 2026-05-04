/**
 * adServiceBase.ts
 * Shared re-export barrel for all Ad sub-services.
 * Eliminates the identical 48-line import block duplicated across
 * AdSearchService, AdMetricsService, AdFeedService, AdDetailService,
 * and AdAggregationService.
 */

export { default as mongoose } from 'mongoose';
export type { PipelineStage } from 'mongoose';
export { default as Ad } from '@esparex/core/models/Ad';
export { default as Category } from '@esparex/core/models/Category';
export { default as Brand } from '@esparex/core/models/Brand';
export { default as ProductModel } from '@esparex/core/models/Model';
export { default as Business } from '@esparex/core/models/Business';
export { default as Report } from '@esparex/core/models/Report';
export { default as BlockedUser } from '@esparex/core/models/BlockedUser';
export { default as SparePart } from '@esparex/core/models/SparePart';
export { default as ServiceType } from '@esparex/core/models/ServiceType';
export { serializeDoc } from '@esparex/core/utils/serialize';
export { normalizeLocationResponse } from '@esparex/core/services/location/LocationNormalizer';
export { touchLocationSearchAnalytics } from '@esparex/core/services/location/LocationAnalyticsService';
export { buildGeoNearStage, normalizeGeoInput } from '@esparex/core/utils/mongoGeoUtils';
export { normalizeAdStatus } from '@esparex/core/services/AdStatusService';
export { buildAdFilterFromCriteria } from '@esparex/core/utils/adFilterHelper';
export type { AdFilterCriteria } from '@esparex/core/utils/adFilterHelper';
export { getCache, setCache, getMultiCache, setMultiCache, CACHE_KEYS } from '@esparex/core/utils/redisCache';
export { buildPublicAdFilter } from '@esparex/core/utils/FeedVisibilityGuard';
export { LISTING_TYPE, type ListingTypeValue } from '@esparex/core/constants/enums/listingType';
export { default as logger } from '@esparex/core/utils/logger';
export { default as RankingTelemetry } from '@esparex/core/models/RankingTelemetry';
export { v4 as uuidv4 } from 'uuid';
export { escapeRegExp } from '@esparex/core/utils/stringUtils';
export {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
} from '@esparex/core/services/adQuery/AdQueryHelpers';
export type { SortStage } from '@esparex/core/services/adQuery/AdQueryHelpers';
export { LISTING_STATUS } from '@esparex/core/constants/enums/listingStatus';
export { FeatureFlag, isEnabled } from '@esparex/core/config/featureFlags';
export { default as AdminMetrics } from '@esparex/core/models/AdminMetrics';
export { isBusinessPublishedStatus } from '@esparex/core/utils/businessStatus';
export {
    getBlockedSellerIds,
    recordListingTypeCompatMetric,
    AD_DETAIL_CACHE_TTL_SECONDS,
    buildListingTypeFilter
} from './adFilterHelpers';
export type {
    AdsListResult,
    AdFilters,
    UnknownRecord,
    AggregationStage,
    ListingTypeCompatMetricContext,
    ListingTypeFilterBuildResult,
    BuildAdMatchStageOptions,
    PaginationOptions,
    PublicQueryOptions,
} from './adFilterHelpers';
