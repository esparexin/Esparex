"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHomeFeedPipeline = void 0;
const adServiceBase_1 = require("./_shared/adServiceBase");
const buildHomeFeedPipeline = (matchStage, boostedIds, limit, geoStage, cursor) => {
    const pipeline = [];
    const now = new Date();
    const effectiveSpotlightMatch = {
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now }
    };
    const nonSpotlightFallbackMatch = {
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
    const visibilityMatch = { ...(matchStage || {}), ...(0, adServiceBase_1.buildPublicAdFilter)() };
    pipeline.push({ $match: visibilityMatch });
    if (cursor?.id && adServiceBase_1.mongoose.Types.ObjectId.isValid(cursor.id)) {
        pipeline.push({
            $match: {
                $or: [
                    { createdAt: { $lt: cursor.createdAt } },
                    {
                        createdAt: cursor.createdAt,
                        _id: { $lt: new adServiceBase_1.mongoose.Types.ObjectId(cursor.id) }
                    }
                ]
            }
        });
    }
    else if (cursor) {
        pipeline.push({
            $match: {
                createdAt: { $lt: cursor.createdAt }
            }
        });
    }
    pipeline.push({ $sort: { createdAt: -1, _id: -1 } }, {
        $facet: {
            spotlight: [
                { $match: { ...visibilityMatch, ...effectiveSpotlightMatch } },
                { $limit: limit * 2 }
            ],
            boosted: [
                {
                    $match: {
                        _id: { $in: boostedIds },
                        ...visibilityMatch,
                        ...nonSpotlightFallbackMatch
                    }
                },
                { $limit: limit * 2 }
            ],
            organic: [
                {
                    $match: {
                        _id: { $nin: boostedIds },
                        ...visibilityMatch,
                        ...nonSpotlightFallbackMatch
                    }
                },
                { $limit: limit * 2 }
            ]
        }
    });
    return pipeline;
};
exports.buildHomeFeedPipeline = buildHomeFeedPipeline;
//# sourceMappingURL=AdFeedService.js.map