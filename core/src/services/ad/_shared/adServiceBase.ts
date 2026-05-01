/**
 * adServiceBase.ts
 * Shared re-export barrel for all Ad sub-services.
 * Eliminates the identical 48-line import block duplicated across
 * AdSearchService, AdMetricsService, AdFeedService, AdDetailService,
 * and AdAggregationService.
 */

export { default as mongoose } from 'mongoose';
export type { PipelineStage } from 'mongoose';
export { default as Ad } from '@core/models/Ad';
export { default as Category } from '@core/models/Category';
export { default as Brand } from '@core/models/Brand';
export { default as ProductModel } from '@core/models/Model';
export { default as Business } from '@core/models/Business';
export { default as Report } from '@core/models/Report';
export { default as BlockedUser } from '@core/models/BlockedUser';
export { default as SparePart } from '@core/models/SparePart';
export { default as ServiceType } from '@core/models/ServiceType';
export { serializeDoc } from '@core/utils/serialize';
export { normalizeLocationResponse } from '@core/services/location/LocationNormalizer';
export { touchLocationSearchAnalytics } from '@core/services/location/LocationAnalyticsService';
export { buildGeoNearStage, normalizeGeoInput } from '@core/utils/mongoGeoUtils';
export { normalizeAdStatus } from '@core/services/AdStatusService';
export { buildAdFilterFromCriteria } from '@core/utils/adFilterHelper';
export type { AdFilterCriteria } from '@core/utils/adFilterHelper';
export { getCache, setCache, getMultiCache, setMultiCache, CACHE_KEYS } from '@core/utils/redisCache';
export { buildPublicAdFilter } from '@core/utils/FeedVisibilityGuard';
export { LISTING_TYPE, type ListingTypeValue } from '@core/constants/enums/listingType';
export { default as logger } from '@core/utils/logger';
export { default as RankingTelemetry } from '@core/models/RankingTelemetry';
export { v4 as uuidv4 } from 'uuid';
export { escapeRegExp } from '@core/utils/stringUtils';
export {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
} from '@core/services/adQuery/AdQueryHelpers';
export type { SortStage } from '@core/services/adQuery/AdQueryHelpers';
export { LISTING_STATUS } from '@core/constants/enums/listingStatus';
export { FeatureFlag, isEnabled } from '@core/config/featureFlags';
export { default as AdminMetrics } from '@core/models/AdminMetrics';
export { isBusinessPublishedStatus } from '@core/utils/businessStatus';
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
