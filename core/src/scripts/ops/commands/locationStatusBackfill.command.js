"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationStatusBackfillCommand = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const commandUtils_1 = require("./commandUtils");
const LEGACY_PUBLIC_LOCATION_QUERY = {
    isActive: true,
    $or: [{ verificationStatus: { $exists: false } }, { verificationStatus: null }],
};
exports.locationStatusBackfillCommand = {
    name: 'location-status-backfill',
    description: 'Backfill missing verificationStatus on active legacy canonical locations to verified.',
    blastRadius: 'high',
    run: async (context) => {
        const db = await (0, commandUtils_1.connectOpsDb)();
        const locations = db.collection('locations');
        try {
            const [missingBefore, missingByLevelBefore, sampleDocs] = await Promise.all([
                locations.countDocuments(LEGACY_PUBLIC_LOCATION_QUERY),
                locations
                    .aggregate([
                    { $match: LEGACY_PUBLIC_LOCATION_QUERY },
                    { $group: { _id: '$level', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } },
                ])
                    .toArray(),
                locations
                    .find(LEGACY_PUBLIC_LOCATION_QUERY, {
                    projection: { _id: 1, name: 1, level: 1, verificationStatus: 1, isActive: 1 },
                })
                    .limit(20)
                    .toArray(),
            ]);
            const summary = {
                mode: context.flags.apply ? 'APPLY' : 'DRY_RUN',
                missingBefore,
                missingByLevelBefore,
                matchedCount: 0,
                modifiedCount: 0,
                missingAfter: missingBefore,
                missingByLevelAfter: missingByLevelBefore,
                sampleDocs: sampleDocs.map((doc) => ({
                    _id: String(doc._id),
                    name: doc.name ?? null,
                    level: doc.level ?? null,
                    verificationStatus: doc.verificationStatus ?? null,
                    isActive: doc.isActive ?? null,
                })),
            };
            if (context.flags.apply && missingBefore > 0) {
                const result = await locations.updateMany(LEGACY_PUBLIC_LOCATION_QUERY, { $set: { verificationStatus: 'verified' } });
                summary.matchedCount = Number(result.matchedCount || 0);
                summary.modifiedCount = Number(result.modifiedCount || 0);
                const [missingAfter, missingByLevelAfter] = await Promise.all([
                    locations.countDocuments(LEGACY_PUBLIC_LOCATION_QUERY),
                    locations
                        .aggregate([
                        { $match: LEGACY_PUBLIC_LOCATION_QUERY },
                        { $group: { _id: '$level', count: { $sum: 1 } } },
                        { $sort: { _id: 1 } },
                    ])
                        .toArray(),
                ]);
                summary.missingAfter = missingAfter;
                summary.missingByLevelAfter = missingByLevelAfter;
            }
            else if (!context.flags.apply) {
                summary.matchedCount = missingBefore;
                summary.modifiedCount = missingBefore;
                summary.missingAfter = 0;
                summary.missingByLevelAfter = [];
            }
            context.emit('ops.command.location-status-backfill.summary', {
                mode: summary.mode,
                missingBefore: summary.missingBefore,
                matchedCount: summary.matchedCount,
                modifiedCount: summary.modifiedCount,
                missingAfter: summary.missingAfter,
            });
            return {
                summary,
                warnings: missingBefore > 0
                    ? ['This command promotes legacy active locations without status to verified. Review dry-run output before apply.']
                    : [],
                rollbackGuidance: [
                    'Use point-in-time recovery if apply mode verified unintended location rows.',
                    'Re-run location-coverage-audit after apply and confirm missingVerificationTotal is zero.',
                ],
            };
        }
        finally {
            await mongoose_1.default.disconnect();
        }
    },
};
//# sourceMappingURL=locationStatusBackfill.command.js.map