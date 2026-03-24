import mongoose from 'mongoose';
import { sanitizePersistedImageUrls } from '../../utils/s3';

export type SortStage = Record<string, 1 | -1 | { $meta: 'textScore' }>;

export const normalizeAdImagesForResponse = <T extends Record<string, unknown>>(ad: T): T => {
    const rawImages = Array.isArray(ad.images) ? ad.images : [];
    const images = sanitizePersistedImageUrls(
        rawImages.filter((image): image is string => typeof image === 'string'),
        { fallbackToPlaceholder: false, allowPlaceholder: false }
    );

    return {
        ...ad,
        images
    };
};

export const extractLocationIdFromAd = (ad: Record<string, unknown>): string | null => {
    const locationValue = ad.location;
    if (!locationValue || typeof locationValue !== 'object') return null;
    const location = locationValue as Record<string, unknown>;
    const locationId = location.locationId;
    if (typeof locationId === 'string' && mongoose.Types.ObjectId.isValid(locationId)) {
        return locationId;
    }
    if (
        locationId &&
        typeof locationId === 'object' &&
        typeof (locationId as { toString?: () => string }).toString === 'function'
    ) {
        const candidate = (locationId as { toString: () => string }).toString();
        if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;
    }
    return null;
};

export const buildAdSortStage = (filters: { sortBy?: string }): SortStage => {
    const sort: SortStage = {};

    if (filters.sortBy === 'distance') {
        sort.distance = 1;
        sort.createdAt = -1;
    } else if (filters.sortBy === 'newest') {
        sort.createdAt = -1;
    } else if (filters.sortBy === 'price-low') {
        sort.price = 1;
    } else if (filters.sortBy === 'price-high') {
        sort.price = -1;
    } else if (filters.sortBy === 'trending') {
        sort.rankScore = -1;
    } else {
        sort.listingQualityScore = -1;
        sort.createdAt = -1;
    }

    return sort;
};
