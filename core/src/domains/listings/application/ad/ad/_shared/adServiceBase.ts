/**
 * adServiceBase.ts
 * Shared re-export barrel for all Ad sub-services.
 * Eliminates the identical 48-line import block duplicated across
 * AdSearchService, AdMetricsService, AdFeedService, AdDetailService,
 * and AdAggregationService.
 */

export { default as mongoose } from 'mongoose';

export { default as Ad } from '../../../../../../models/Ad';

export { default as Business } from '../../../../../../models/Business';
export { default as Report } from '../../../../../../models/Report';

export { serializeDoc } from '../../../../../../utils/serialize';
export { normalizeLocationResponse } from '../../../../../../services/location/LocationNormalizer';
export { touchLocationSearchAnalytics } from '../../../../../analytics/application/services/location/LocationAnalyticsService';
export { buildGeoNearStage, normalizeGeoInput } from '../../../../../../utils/mongoGeoUtils';
export { normalizeAdStatus } from '../../../../../../services/lifecycle/AdStatusService';
export { buildAdFilterFromCriteria } from '../../../../../../utils/adFilterHelper';

export { getCache, setCache, getMultiCache, setMultiCache, CACHE_KEYS } from '../../../../../../utils/redisCache';
export { buildPublicAdFilter } from '../../../../../../utils/FeedVisibilityGuard';

export { default as logger } from '../../../../../../utils/logger';
export { default as RankingTelemetry } from '../../../../../../models/RankingTelemetry';
export { v4 as uuidv4 } from 'uuid';

export {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
} from '../../../queries/adQuery/AdQueryHelpers';
export type { SortStage } from '../../../queries/adQuery/AdQueryHelpers';
export { LISTING_STATUS } from '@esparex/contracts';
export { FeatureFlag, isEnabled } from '../../../../../../config/featureFlags';

export { getBlockedSellerIds, recordListingTypeCompatMetric, buildListingTypeFilter } from './adFilterHelpers';
export type { AdsListResult, AdFilters, UnknownRecord, AggregationStage, ListingTypeCompatMetricContext, BuildAdMatchStageOptions, PaginationOptions, PublicQueryOptions } from './adFilterHelpers';
