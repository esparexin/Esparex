import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { buildPublicAdFilter } from '../utils/FeedVisibilityGuard';
import logger from '../utils/logger';

export type FallbackStage = 'RADIUS' | 'CITY' | 'STATE' | 'REGIONAL' | 'NATIONAL';

export interface FeedDecisionMetadata {
    fallbackStage: FallbackStage;
    appliedRadiusKm: number;
}

const REGIONAL_MAP: Record<string, string[]> = {
    'Uttar Pradesh': ['Delhi', 'Haryana', 'Uttarakhand', 'Rajasthan', 'Madhya Pradesh'],
    'Maharashtra': ['Gujarat', 'Madhya Pradesh', 'Chhattisgarh', 'Telangana', 'Karnataka', 'Goa'],
    'Karnataka': ['Maharashtra', 'Goa', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
    'Delhi': ['Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab'],
    // Add default fallbacks for missing mappings explicitly
};

export class FeedDecisionEngine {
    static async getFallbackFeed(
        input: { city?: string; state?: string; lat?: number; lng?: number },
        excludeIds: string[],
        limitNeeded: number,
        categoryId?: string
    ): Promise<{ ads: any[], meta: FeedDecisionMetadata }> {
        let currentStage: FallbackStage = 'RADIUS';
        let appliedRadiusKm = 10;
        const mergedAds: any[] = [];
        const seenIds = new Set(excludeIds);

        const fetchBatch = async (matchStage: any, stageName: FallbackStage, radius: number = 0) => {
            if (mergedAds.length >= limitNeeded) return;
            
            const visibilityFilter = buildPublicAdFilter();
            const pipeline: mongoose.PipelineStage[] = [
                { $match: { ...visibilityFilter, ...matchStage, _id: { $nin: Array.from(seenIds).map(id => new mongoose.Types.ObjectId(id)) } } },
                { $sort: { createdAt: -1 } as any },
                { $limit: limitNeeded - mergedAds.length },
                { $project: { _id: 1, title: 1, price: 1, images: 1, createdAt: 1, isSpotlight: 1, 'location.state': 1, 'location.city': 1 } }
            ];

            const results = await Ad.aggregate(pipeline);
            for (const ad of results) {
                const idStr = String(ad._id);
                if (!seenIds.has(idStr)) {
                    seenIds.add(idStr);
                    mergedAds.push(ad);
                }
            }

            if (mergedAds.length > 0 && currentStage === 'RADIUS') { // Just to track the highest stage that yielded anything
                currentStage = stageName;
                appliedRadiusKm = radius;
            }
        };

        const baseMatch: any = {};
        if (categoryId) {
            baseMatch.categoryId = mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : categoryId;
        }

        // Stage 1: Radius (If coordinates exist, though GeoNear is usually Stage 1. We skip if no coords)
        if (input.lat && input.lng) {
            currentStage = 'RADIUS';
            appliedRadiusKm = 10;
            // Native GeoNear would be used here, but for fallback simulation we assume initial query handled explicit radius.
        }

        // Stage 2: City Scope
        if (input.city && mergedAds.length < limitNeeded) {
            currentStage = 'CITY';
            await fetchBatch({ ...baseMatch, 'location.city': new RegExp(`^${input.city}$`, 'i') }, 'CITY');
        }

        // Stage 3: State Scope
        if (input.state && mergedAds.length < limitNeeded) {
            currentStage = 'STATE';
            await fetchBatch({ ...baseMatch, 'location.state': new RegExp(`^${input.state}$`, 'i') }, 'STATE');
        }

        // Stage 4: Regional Scope (Neighboring states)
        if (input.state && mergedAds.length < limitNeeded) {
            const neighbors = REGIONAL_MAP[input.state] || [];
            if (neighbors.length > 0) {
                currentStage = 'REGIONAL';
                await fetchBatch({ ...baseMatch, 'location.state': { $in: neighbors.map(n => new RegExp(`^${n}$`, 'i')) } }, 'REGIONAL');
            }
        }

        // Stage 5: National Scope
        if (mergedAds.length < limitNeeded) {
            currentStage = 'NATIONAL';
            await fetchBatch({ ...baseMatch }, 'NATIONAL');
        }

        if (process.env.FEED_DEBUG === 'true') {
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
