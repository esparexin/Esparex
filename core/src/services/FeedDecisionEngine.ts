import mongoose from 'mongoose';
import { env } from '../config/env';
import { getListingRepository } from '../composition/listings';
import type { ListingFilter } from '../domains/listings/ports/ListingRepositoryPort';
import { buildPublicAdFilter } from '../utils/FeedVisibilityGuard';
import logger from '../utils/logger';

export type FallbackStage = 'RADIUS' | 'CITY' | 'STATE' | 'REGIONAL' | 'NATIONAL';

export interface FeedDecisionMetadata {
    fallbackStage: FallbackStage;
    appliedRadiusKm: number;
}

// Escapes special regex characters to prevent regex injection from user input
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Complete India state/UT regional adjacency map (all 28 states + 8 UTs covered)
const REGIONAL_MAP: Record<string, string[]> = {
    // North India
    'Delhi': ['Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab'],
    'Haryana': ['Delhi', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh'],
    'Punjab': ['Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Rajasthan', 'Delhi'],
    'Rajasthan': ['Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat'],
    'Uttar Pradesh': ['Delhi', 'Haryana', 'Uttarakhand', 'Rajasthan', 'Madhya Pradesh', 'Bihar', 'Jharkhand'],
    'Uttarakhand': ['Uttar Pradesh', 'Haryana', 'Himachal Pradesh'],
    'Himachal Pradesh': ['Punjab', 'Haryana', 'Uttarakhand', 'Jammu and Kashmir'],
    'Jammu and Kashmir': ['Himachal Pradesh', 'Punjab', 'Ladakh'],
    'Ladakh': ['Jammu and Kashmir', 'Himachal Pradesh'],

    // East India
    'Bihar': ['Uttar Pradesh', 'Jharkhand', 'West Bengal'],
    'Jharkhand': ['Bihar', 'West Bengal', 'Odisha', 'Chhattisgarh', 'Uttar Pradesh'],
    'West Bengal': ['Bihar', 'Jharkhand', 'Odisha', 'Sikkim', 'Assam'],
    'Odisha': ['West Bengal', 'Jharkhand', 'Chhattisgarh', 'Andhra Pradesh'],
    'Sikkim': ['West Bengal'],
    'Assam': ['West Bengal', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura'],
    'Arunachal Pradesh': ['Assam', 'Nagaland'],
    'Nagaland': ['Assam', 'Arunachal Pradesh', 'Manipur'],
    'Manipur': ['Assam', 'Nagaland', 'Mizoram'],
    'Mizoram': ['Assam', 'Manipur', 'Tripura'],
    'Meghalaya': ['Assam'],
    'Tripura': ['Assam', 'Mizoram'],

    // Central India
    'Madhya Pradesh': ['Rajasthan', 'Uttar Pradesh', 'Chhattisgarh', 'Maharashtra', 'Gujarat'],
    'Chhattisgarh': ['Madhya Pradesh', 'Uttar Pradesh', 'Jharkhand', 'Odisha', 'Andhra Pradesh', 'Telangana', 'Maharashtra'],

    // West India
    'Gujarat': ['Rajasthan', 'Madhya Pradesh', 'Maharashtra'],
    'Maharashtra': ['Gujarat', 'Madhya Pradesh', 'Chhattisgarh', 'Telangana', 'Karnataka', 'Goa'],
    'Goa': ['Maharashtra', 'Karnataka'],

    // South India
    'Karnataka': ['Maharashtra', 'Goa', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
    'Kerala': ['Karnataka', 'Tamil Nadu'],
    'Tamil Nadu': ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Puducherry'],
    'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Odisha', 'Chhattisgarh'],
    'Telangana': ['Maharashtra', 'Chhattisgarh', 'Odisha', 'Andhra Pradesh', 'Karnataka'],
    'Puducherry': ['Tamil Nadu', 'Andhra Pradesh'],

    // Island UTs
    'Andaman and Nicobar Islands': [],
    'Lakshadweep': ['Kerala'],

    // Other UTs
    'Chandigarh': ['Punjab', 'Haryana'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Gujarat', 'Maharashtra'],
};

export class FeedDecisionEngine {
    static async getFallbackFeed(
        input: { city?: string; state?: string; lat?: number; lng?: number; locationId?: string },
        excludeIds: string[],
        limitNeeded: number,
        categoryId?: string
    ): Promise<{ ads: Record<string, unknown>[], meta: FeedDecisionMetadata }> {
        let currentStage: FallbackStage = 'RADIUS';
        let appliedRadiusKm = 10;
        const mergedAds: Record<string, unknown>[] = [];
        const seenIds = new Set(excludeIds);

        const fetchBatch = async (matchStage: ListingFilter, stageName: FallbackStage, radius: number = 0, isRadius: boolean = false) => {
            if (mergedAds.length >= limitNeeded) return;

            const visibilityFilter = buildPublicAdFilter() as unknown as Partial<ListingFilter>;
            const filter: ListingFilter = {
                ...matchStage,
                ...visibilityFilter,
                idsNotIn: Array.from(seenIds)
            };

            const limit = limitNeeded - mergedAds.length;
            
            let results;
            if (isRadius && input.lat !== undefined && input.lng !== undefined) {
                results = await getListingRepository().findWithinRadius(
                    input.lng,
                    input.lat,
                    radius,
                    filter,
                    { createdAt: -1 },
                    limit
                );
            } else {
                results = await getListingRepository().findWithLimit(
                    filter,
                    { createdAt: -1 },
                    limit
                );
            }

            for (const ad of results) {
                const idStr = String(ad.id);
                if (!seenIds.has(idStr)) {
                    seenIds.add(idStr);
                    mergedAds.push({ ...ad, _id: ad.id });
                }
            }

            if (mergedAds.length > 0 && currentStage === 'RADIUS') {
                currentStage = stageName;
                appliedRadiusKm = radius;
            }
        };

        const baseMatch: ListingFilter = {};
        if (categoryId) {
            baseMatch.categoryId = categoryId;
        }

        // Stage 1: Radius (skip — $geoNear handled upstream by AdQueryService/FeedService)
        if (input.lat && input.lng) {
            currentStage = 'RADIUS';
            appliedRadiusKm = 10;
        }

        // Stage 2: Structured location via locationId (preferred over regex — uses index)
        if (input.locationId && mongoose.Types.ObjectId.isValid(input.locationId) && mergedAds.length < limitNeeded) {
            currentStage = 'CITY';
            await fetchBatch(
                { ...baseMatch, $or: [{ locationPath: input.locationId }, { locationId: input.locationId }] },
                'CITY'
            );
        }
        // Stage 2 fallback: City string regex (anchored + escaped, uses ad_city_status_freshness_idx)
        else if (input.city && mergedAds.length < limitNeeded) {
            currentStage = 'CITY';
            const countBefore = mergedAds.length;
            await fetchBatch(
                { ...baseMatch, locationCity: input.city },
                'CITY'
            );
            if (mergedAds.length === countBefore) {
                await fetchBatch(
                    { ...baseMatch, locationCity: { $regex: `^${escapeRegex(input.city)}$`, $options: 'i' } },
                    'CITY'
                );
            }
        }

        // Stage 3: State string regex (anchored + escaped, uses ad_state_status_freshness_idx)
        if (input.state && mergedAds.length < limitNeeded) {
            currentStage = 'STATE';
            const countBefore = mergedAds.length;
            await fetchBatch(
                { ...baseMatch, locationState: input.state },
                'STATE'
            );
            if (mergedAds.length === countBefore) {
                await fetchBatch(
                    { ...baseMatch, locationState: { $regex: `^${escapeRegex(input.state)}$`, $options: 'i' } },
                    'STATE'
                );
            }
        }

        // Stage 4: Regional (neighboring states)
        if (input.state && mergedAds.length < limitNeeded) {
            const neighbors = REGIONAL_MAP[input.state] || [];
            if (neighbors.length > 0) {
                currentStage = 'REGIONAL';
                const countBefore = mergedAds.length;
                await fetchBatch(
                    { ...baseMatch, locationState: { $in: neighbors } },
                    'REGIONAL'
                );
                if (mergedAds.length === countBefore) {
                    await fetchBatch(
                        { ...baseMatch, locationState: { $in: neighbors.map(n => new RegExp(`^${escapeRegex(n)}$`, 'i')) } },
                        'REGIONAL'
                    );
                }
            }
        }

        // Stage 5: National (no location constraint)
        if (mergedAds.length < limitNeeded) {
            currentStage = 'NATIONAL';
            await fetchBatch({ ...baseMatch }, 'NATIONAL');
        }

        if (env.FEED_DEBUG) {
            logger.debug(`[FeedDecisionEngine] Fallback triggered. Stage: ${currentStage}, Recovered: ${mergedAds.length}`);
        }

        return {
            ads: mergedAds,
            meta: {
                fallbackStage: currentStage,
                appliedRadiusKm
            }
        };
    }
}
