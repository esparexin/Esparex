import mongoose, { PipelineStage } from 'mongoose';
import Ad from '../../models/Ad';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import ProductModel from '../../models/Model';
import Business from '../../models/Business';
import Report from '../../models/Report';
import BlockedUser from '../../models/BlockedUser';
import SparePart from '../../models/SparePart';
import { serializeDoc } from '../../utils/serialize';
import { normalizeLocationResponse } from '../location/LocationNormalizer';
import { touchLocationSearchAnalytics } from '../location/LocationAnalyticsService';
import { buildGeoNearStage, normalizeGeoInput } from '../../utils/GeoUtils';
import { normalizeAdStatus } from '../adStatusService';
import { buildAdFilterFromCriteria, AdFilterCriteria } from '../../utils/adFilterHelper';
import { getCache, setCache } from '../../utils/redisCache';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';
import { type ListingTypeValue } from '../../../../shared/enums/listingType';
import logger from '../../utils/logger';
import RankingTelemetry from '../../models/RankingTelemetry';
import { v4 as uuidv4 } from 'uuid';
import { escapeRegExp } from '../../utils/stringUtils';
import {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
    type SortStage
} from '../adQuery/AdQueryHelpers';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { FeatureFlag, isEnabled } from '../../config/featureFlags';
import AdminMetrics from '../../models/AdminMetrics';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';

import { 
    AdsListResult, 
    AdFilters, 
    getBlockedSellerIds, 
    recordListingTypeCompatMetric, 
    AD_DETAIL_CACHE_TTL_SECONDS,
    UnknownRecord,
    AggregationStage,
    ListingTypeCompatMetricContext,
    ListingTypeFilterBuildResult,
    BuildAdMatchStageOptions,
    PaginationOptions,
    PublicQueryOptions,
    buildListingTypeFilter
} from './_shared/adFilterHelpers';

export const buildHomeFeedPipeline = (
    matchStage: UnknownRecord,
    boostedIds: mongoose.Types.ObjectId[],
    limit: number,
    geoStage?: mongoose.PipelineStage,
    cursor?: { createdAt: Date; id?: string | null }
): mongoose.PipelineStage[] => {
    const pipeline: mongoose.PipelineStage[] = [];
    const now = new Date();
    const effectiveSpotlightMatch: UnknownRecord = {
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now }
    };
    const nonSpotlightFallbackMatch: UnknownRecord = {
        $or: [
            { isSpotlight: { $ne: true } },
            { spotlightExpiresAt: { $exists: false } },
            { spotlightExpiresAt: null },
            { spotlightExpiresAt: { $lte: now } }
        ]
    };

    if (geoStage) {
        pipeline.push(geoStage);
    }
    
    // SSOT Pipeline Protection
    const visibilityMatch = { ...(matchStage || {}), ...buildPublicAdFilter() };
    pipeline.push({ $match: visibilityMatch as any });

    if (cursor?.id && mongoose.Types.ObjectId.isValid(cursor.id)) {
        pipeline.push({
            $match: {
                $or: [
                    { createdAt: { $lt: cursor.createdAt } },
                    {
                        createdAt: cursor.createdAt,
                        _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                    }
                ]
            }
        });
    } else if (cursor) {
        pipeline.push({
            $match: {
                createdAt: { $lt: cursor.createdAt }
            }
        });
    }

    pipeline.push(
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $facet: {
                spotlight: [
                    { $match: { ...visibilityMatch, ...effectiveSpotlightMatch } as any },
                    { $limit: limit * 2 }
                ],
                boosted: [
                    {
                        $match: {
                            _id: { $in: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as any
                    },
                    { $limit: limit * 2 }
                ],
                organic: [
                    {
                        $match: {
                            _id: { $nin: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as any
                    },
                    { $limit: limit * 2 }
                ]
            }
        }
    );

    return pipeline;
};
