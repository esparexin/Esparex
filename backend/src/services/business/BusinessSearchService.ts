import mongoose from 'mongoose';
import Business from '../../models/Business';
import Ad from '../../models/Ad';
import { normalizeLocationResponse } from '../location/LocationNormalizer';
import { serializeDoc } from '../../utils/serialize';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';

export const getBusinesses = async (filters: Record<string, unknown>) => {
    const normalizedCity = typeof filters.city === 'string' ? filters.city.trim() : '';
    const normalizedCategory = typeof filters.category === 'string' ? filters.category.trim() : '';
    const normalizedLocationId =
        typeof filters.locationId === 'string' && mongoose.Types.ObjectId.isValid(filters.locationId)
            ? new mongoose.Types.ObjectId(filters.locationId)
            : null;
    const normalizedListingCategoryId =
        typeof filters.listingCategoryId === 'string' && mongoose.Types.ObjectId.isValid(filters.listingCategoryId)
            ? new mongoose.Types.ObjectId(filters.listingCategoryId)
            : null;
    const normalizedBrandId =
        typeof filters.brandId === 'string' && mongoose.Types.ObjectId.isValid(filters.brandId)
            ? new mongoose.Types.ObjectId(filters.brandId)
            : null;
    const excludedBusinessId =
        typeof filters.excludeBusinessId === 'string' && mongoose.Types.ObjectId.isValid(filters.excludeBusinessId)
            ? new mongoose.Types.ObjectId(filters.excludeBusinessId)
            : null;

    const latitude = typeof filters.latitude === 'number' ? filters.latitude : Number(filters.latitude);
    const longitude = typeof filters.longitude === 'number' ? filters.longitude : Number(filters.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const radiusKmRaw = typeof filters.radiusKm === 'number' ? filters.radiusKm : Number(filters.radiusKm);
    const radiusKm = Number.isFinite(radiusKmRaw) ? Math.min(Math.max(radiusKmRaw, 1), 100) : 35;

    const serviceOnly =
        filters.serviceOnly === true ||
        filters.serviceOnly === 'true' ||
        Boolean(normalizedListingCategoryId);

    const query: Record<string, unknown> = {
        status: publishedBusinessStatusQuery,
        isDeleted: { $ne: true }
    };

    if (excludedBusinessId) {
        query._id = { $ne: excludedBusinessId };
    }

    if (normalizedLocationId && !hasCoordinates) {
        query.locationId = normalizedLocationId;
    } else if (normalizedCity && !hasCoordinates) {
        query['location.city'] = normalizedCity;
    }

    if (normalizedCategory) {
        query.businessTypes = normalizedCategory;
    }

    const parsedLimit = typeof filters.limit === 'number' ? filters.limit : Number(filters.limit || 20);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;
    const candidateLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 60);

    let candidates: Array<Record<string, any>> = [];

    if (hasCoordinates) {
        candidates = await Business.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    distanceField: 'distanceMeters',
                    spherical: true,
                    maxDistance: radiusKm * 1000,
                    query,
                    key: 'location.coordinates'
                }
            },
            { $limit: candidateLimit }
        ]);
    } else {
        let finder = Business.find(query)
            .limit(candidateLimit)
            .sort({ createdAt: -1 });

        if (normalizedCity) {
            finder = finder.collation({ locale: 'en', strength: 2 });
        }

        candidates = await finder.lean();
    }

    if (candidates.length === 0) return [];

    const candidateIds = candidates
        .map((business) => business._id)
        .filter((value): value is mongoose.Types.ObjectId => value instanceof mongoose.Types.ObjectId);

    const baseServiceMatch: Record<string, unknown> = {
        businessId: { $in: candidateIds },
        listingType: LISTING_TYPE.SERVICE,
        status: AD_STATUS.LIVE,
        isDeleted: { $ne: true }
    };

    const matchingServiceMatch: Record<string, unknown> = { ...baseServiceMatch };
    if (normalizedListingCategoryId) {
        matchingServiceMatch.categoryId = normalizedListingCategoryId;
    }
    const brandMatchedServiceMatch: Record<string, unknown> =
        normalizedBrandId && normalizedListingCategoryId
            ? {
                ...baseServiceMatch,
                categoryId: normalizedListingCategoryId,
                brandId: normalizedBrandId
            }
            : {};

    const [activeServiceCounts, matchingServiceCounts, brandMatchedServiceCounts] = await Promise.all([
        Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: baseServiceMatch },
            { $group: { _id: '$businessId', count: { $sum: 1 } } }
        ]),
        normalizedListingCategoryId || normalizedBrandId || serviceOnly
            ? Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
                { $match: matchingServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([]),
        normalizedBrandId && normalizedListingCategoryId
            ? Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
                { $match: brandMatchedServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([])
    ]);

    const activeServiceCountMap = new Map(activeServiceCounts.map((entry) => [String(entry._id), entry.count]));
    const matchingServiceCountMap = new Map(matchingServiceCounts.map((entry) => [String(entry._id), entry.count]));
    const brandMatchedServiceCountMap = new Map(brandMatchedServiceCounts.map((entry) => [String(entry._id), entry.count]));

    const filteredCandidates = candidates.filter((candidate) => {
        const businessId = String(candidate._id);
        const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
        const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;

        if (!serviceOnly) return true;
        if (normalizedListingCategoryId || normalizedBrandId) return matchingServicesCount > 0;
        return activeServicesCount > 0;
    });

    const enriched = (filteredCandidates
        .map((biz) => {
            const serialized = serializeDoc(biz) as Record<string, any>;
            if (serialized.location) {
                serialized.location = normalizeLocationResponse(serialized.location);
            }

            const businessId = String(serialized._id || serialized.id);
            const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
            const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;
            const brandMatchedServicesCount = brandMatchedServiceCountMap.get(businessId) || 0;
            const distanceKm =
                typeof biz.distanceMeters === 'number'
                    ? Number((biz.distanceMeters / 1000).toFixed(1))
                    : undefined;

            return {
                ...serialized,
                activeServicesCount,
                matchingServicesCount,
                brandMatchedServicesCount,
                ...(typeof distanceKm === 'number' ? { distanceKm } : {})
            };
        }) as Array<Record<string, any>>)
        .sort((left, right) => {
            const brandMatchedDiff = (right.brandMatchedServicesCount || 0) - (left.brandMatchedServicesCount || 0);
            if (brandMatchedDiff !== 0) return brandMatchedDiff;

            const matchingDiff = (right.matchingServicesCount || 0) - (left.matchingServicesCount || 0);
            if (matchingDiff !== 0) return matchingDiff;

            const activeDiff = (right.activeServicesCount || 0) - (left.activeServicesCount || 0);
            if (activeDiff !== 0) return activeDiff;

            const leftDistance = typeof left.distanceKm === 'number' ? left.distanceKm : Number.POSITIVE_INFINITY;
            const rightDistance = typeof right.distanceKm === 'number' ? right.distanceKm : Number.POSITIVE_INFINITY;
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;

            const verifiedDiff = Number(Boolean(right.isVerified)) - Number(Boolean(left.isVerified));
            if (verifiedDiff !== 0) return verifiedDiff;

            const trustDiff = Number(right.trustScore || 0) - Number(left.trustScore || 0);
            if (trustDiff !== 0) return trustDiff;

            return new Date(String(right.createdAt || 0)).getTime() - new Date(String(left.createdAt || 0)).getTime();
        });

    return enriched.slice(0, safeLimit);
};
