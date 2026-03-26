import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { getCache, setCache } from '../utils/redisCache';
import { normalizeAdImagesForResponse } from './adQuery/AdQueryHelpers';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import Category from '../models/Category';
import logger from '../utils/logger';
import { toObjectId, toObjectIdString } from '../utils/idUtils';

type SimilarAdsOptions = {
    limit?: number;
};

type SimilarAdRecord = Record<string, unknown> & {
    _id?: unknown;
    createdAt?: unknown;
    brandId?: unknown;
    modelId?: unknown;
};

const SIMILAR_ADS_CACHE_TTL_SECONDS = 300;
const SIMILAR_ADS_MIN_LIMIT = 6;
const SIMILAR_ADS_MAX_LIMIT = 12;
const SIMILAR_ADS_DEFAULT_LIMIT = 8;



const normalizeLimit = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return SIMILAR_ADS_DEFAULT_LIMIT;
    const rounded = Math.floor(parsed);
    return Math.max(SIMILAR_ADS_MIN_LIMIT, Math.min(SIMILAR_ADS_MAX_LIMIT, rounded));
};

const buildSimilarityScore = (
    sourceAd: { brandId?: unknown; modelId?: unknown },
    candidate: SimilarAdRecord
): number => {
    let score = 0;
    const sourceBrand = toObjectIdString(sourceAd.brandId);
    const sourceModel = toObjectIdString(sourceAd.modelId);
    const candidateBrand = toObjectIdString(candidate.brandId);
    const candidateModel = toObjectIdString(candidate.modelId);

    if (sourceBrand && candidateBrand && sourceBrand === candidateBrand) {
        score += 2;
    }
    if (sourceModel && candidateModel && sourceModel === candidateModel) {
        score += 3;
    }

    return score;
};

export const getSimilarAds = async (
    adId: string | mongoose.Types.ObjectId,
    options: SimilarAdsOptions = {}
): Promise<{ ads: SimilarAdRecord[] }> => {
    const sourceAdId = toObjectId(adId);
    if (!sourceAdId) return { ads: [] };

    const limit = normalizeLimit(options.limit);
    const cacheKey = `similar:${sourceAdId.toHexString()}`;

    try {
        const cached = await getCache<{ ads: SimilarAdRecord[] }>(cacheKey);
        if (cached && Array.isArray(cached.ads)) {
            return { ads: cached.ads.slice(0, limit) };
        }

        const sourceAd = await Ad.findById(sourceAdId)
            .select('_id categoryId location.locationId location.city price brandId modelId status isDeleted')
            .lean<{
                _id: mongoose.Types.ObjectId;
                categoryId?: mongoose.Types.ObjectId;
                location?: { locationId?: mongoose.Types.ObjectId; city?: string };
                price?: number;
                brandId?: mongoose.Types.ObjectId;
                modelId?: mongoose.Types.ObjectId;
                status?: string;
                isDeleted?: boolean;
            } | null>();

        if (!sourceAd || sourceAd.isDeleted || !sourceAd.categoryId) {
            return { ads: [] };
        }

        const match: Record<string, unknown> = {
            _id: { $ne: sourceAdId },
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true },
            categoryId: sourceAd.categoryId,
        };

        const sourceLocationId = sourceAd.location?.locationId;
        if (sourceLocationId) {
            match['location.locationId'] = sourceLocationId;
        } else if (typeof sourceAd.location?.city === 'string' && sourceAd.location.city.trim().length > 0) {
            const escapedCity = sourceAd.location.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            match['location.city'] = { $regex: `^${escapedCity}$`, $options: 'i' };
        } else {
            return { ads: [] };
        }

        if (typeof sourceAd.price === 'number' && Number.isFinite(sourceAd.price) && sourceAd.price > 0) {
            const minPrice = Number((sourceAd.price * 0.8).toFixed(2));
            const maxPrice = Number((sourceAd.price * 1.2).toFixed(2));
            match.price = { $gte: minPrice, $lte: maxPrice };
        }

        const candidates = await Ad.find(match)
            .sort({ createdAt: -1 })
            .limit(48)
            .lean<SimilarAdRecord[]>();

        const ranked = [...candidates].sort((left, right) => {
            const scoreDiff = buildSimilarityScore(sourceAd, right) - buildSimilarityScore(sourceAd, left);
            if (scoreDiff !== 0) return scoreDiff;

            const rightCreatedAt = new Date(String(right.createdAt ?? 0)).getTime();
            const leftCreatedAt = new Date(String(left.createdAt ?? 0)).getTime();
            return rightCreatedAt - leftCreatedAt;
        });

        const normalizedAds = ranked
            .slice(0, SIMILAR_ADS_MAX_LIMIT)
            .map((ad) => normalizeAdImagesForResponse(ad));

        await setCache(cacheKey, { ads: normalizedAds }, SIMILAR_ADS_CACHE_TTL_SECONDS);
        return { ads: normalizedAds.slice(0, limit) };
    } catch (error) {
        logger.error('Failed to fetch similar ads', {
            adId: sourceAdId.toHexString(),
            error: error instanceof Error ? error.message : String(error)
        });
        return { ads: [] };
    }
};

