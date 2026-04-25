import {
    mongoose,
    buildPublicAdFilter
} from './_shared/adServiceBase';
import type { UnknownRecord } from './_shared/adServiceBase';

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
    pipeline.push({ $match: visibilityMatch as UnknownRecord });

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
                    { $match: { ...visibilityMatch, ...effectiveSpotlightMatch } as UnknownRecord },
                    { $limit: limit * 2 }
                ],
                boosted: [
                    {
                        $match: {
                            _id: { $in: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as UnknownRecord
                    },
                    { $limit: limit * 2 }
                ],
                organic: [
                    {
                        $match: {
                            _id: { $nin: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as UnknownRecord
                    },
                    { $limit: limit * 2 }
                ]
            }
        }
    );

    return pipeline;
};
