import { Types } from 'mongoose';
import { toObjectId } from '../../../utils/idUtils';

// ─── Smart-alert match utils (P3 extract-before-split from SmartAlertService) ─
// Pure query/keyword/number helpers for alert matching. Single owner.

export type AdMatchCriteria = {
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    locationId?: unknown;
    /** Parent location ObjectId strings up the hierarchy (state, country) */
    locationParentIds?: string[];
    price?: unknown;
    keywords?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
};

export const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
};

export const buildSmartAlertQuery = (criteria: AdMatchCriteria): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [{ isActive: true }];

    const categoryId = toObjectId(criteria.categoryId);
    if (categoryId) {
        and.push({
            $or: [
                { 'criteria.categoryId': { $exists: false } },
                { 'criteria.categoryId': null },
                { 'criteria.categoryId': categoryId }
            ]
        });
    }

    const brandId = toObjectId(criteria.brandId);
    if (brandId) {
        and.push({
            $or: [
                { 'criteria.brandId': { $exists: false } },
                { 'criteria.brandId': null },
                { 'criteria.brandId': brandId }
            ]
        });
    }

    const modelId = toObjectId(criteria.modelId);
    if (modelId) {
        and.push({
            $or: [
                { 'criteria.modelId': { $exists: false } },
                { 'criteria.modelId': null },
                { 'criteria.modelId': modelId }
            ]
        });
    }

    const locationId = toObjectId(criteria.locationId);
    // PR 8 — Smart Alert path-match: include parent-level locationIds so that
    // a state-level alert fires for city-level ads (e.g. alert for Maharashtra
    // triggers on a Mumbai ad because Mumbai's locationPath includes Maharashtra).
    const parentLocationIds: Types.ObjectId[] = (criteria.locationParentIds ?? [])
        .map((id: string) => toObjectId(id))
        .filter((id): id is Types.ObjectId => id !== undefined);

    const locationCandidates = [
        ...(locationId ? [locationId] : []),
        ...parentLocationIds,
    ];

    if (locationCandidates.length > 0) {
        and.push({
            $or: [
                { 'criteria.locationId': { $exists: false } },
                { 'criteria.locationId': null },
                { 'criteria.locationId': { $in: locationCandidates } }
            ]
        });
    }

    const price =
        toFiniteNumber(criteria.price) ??
        toFiniteNumber(criteria.maxPrice) ??
        toFiniteNumber(criteria.minPrice);
    if (typeof price === 'number') {
        and.push({
            $or: [
                { 'criteria.minPrice': { $exists: false } },
                { 'criteria.minPrice': null },
                { 'criteria.minPrice': { $lte: price } }
            ]
        });
        and.push({
            $or: [
                { 'criteria.maxPrice': { $exists: false } },
                { 'criteria.maxPrice': null },
                { 'criteria.maxPrice': { $gte: price } }
            ]
        });
    }

    if (and.length === 1) {
        return and[0] || { isActive: true };
    }
    return { $and: and };
};

export const matchesAlertKeywords = (alertKeywords: unknown, adText: unknown): boolean => {
    if (typeof alertKeywords !== 'string' || alertKeywords.trim().length === 0) return true;
    if (typeof adText !== 'string' || adText.trim().length === 0) return false;

    const text = adText.toLowerCase();
    const tokens = alertKeywords
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) return true;
    return tokens.every((token) => text.includes(token));
};
