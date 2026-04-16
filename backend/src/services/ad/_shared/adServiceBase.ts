/**
 * adServiceBase.ts
 * Shared re-export barrel for all Ad sub-services.
 * Eliminates the identical 48-line import block duplicated across
 * AdSearchService, AdMetricsService, AdFeedService, AdDetailService,
 * and AdAggregationService.
 */

export { default as mongoose } from 'mongoose';
export type { PipelineStage } from 'mongoose';
export { default as Ad } from '../../../models/Ad';
export { default as Category } from '../../../models/Category';
export { default as Brand } from '../../../models/Brand';
export { default as ProductModel } from '../../../models/Model';
export { default as Business } from '../../../models/Business';
export { default as Report } from '../../../models/Report';
export { default as BlockedUser } from '../../../models/BlockedUser';
export { default as SparePart } from '../../../models/SparePart';
export { default as ServiceType } from '../../../models/ServiceType';
export { serializeDoc } from '../../../utils/serialize';
export { normalizeLocationResponse } from '../../location/LocationNormalizer';
export { touchLocationSearchAnalytics } from '../../location/LocationAnalyticsService';
export { buildGeoNearStage, normalizeGeoInput } from '../../../utils/GeoUtils';
export { normalizeAdStatus } from '../../adStatusService';
export { buildAdFilterFromCriteria } from '../../../utils/adFilterHelper';
export type { AdFilterCriteria } from '../../../utils/adFilterHelper';
export { getCache, setCache, getMultiCache, setMultiCache, CACHE_KEYS } from '../../../utils/redisCache';
export { buildPublicAdFilter } from '../../../utils/FeedVisibilityGuard';
export type { ListingTypeValue } from '../../../../../shared/enums/listingType';
export { default as logger } from '../../../utils/logger';
export { default as RankingTelemetry } from '../../../models/RankingTelemetry';
export { v4 as uuidv4 } from 'uuid';
export { escapeRegExp } from '../../../utils/stringUtils';
export {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
} from '../../adQuery/AdQueryHelpers';
export type { SortStage } from '../../adQuery/AdQueryHelpers';
export { AD_STATUS } from '../../../../../shared/enums/adStatus';
export { FeatureFlag, isEnabled } from '../../../config/featureFlags';
export { default as AdminMetrics } from '../../../models/AdminMetrics';
export { isBusinessPublishedStatus } from '../../../utils/businessStatus';
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
