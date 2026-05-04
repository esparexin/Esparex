"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoRepairCommand = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const _shared_1 = require("@shared");
const evaluateCoordinates = (value) => {
    try {
        const point = (0, _shared_1.toGeoPoint)(value);
        let changed = true;
        let source = 'normalized';
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const raw = value;
            if (raw.type === 'Point' && Array.isArray(raw.coordinates) && raw.coordinates.length === 2) {
                source = 'geojson';
                const sameLng = Number(raw.coordinates[0]) === point.coordinates[0];
                const sameLat = Number(raw.coordinates[1]) === point.coordinates[1];
                changed = !(sameLng && sameLat);
            }
        }
        else if (Array.isArray(value)) {
            source = 'legacy_array';
        }
        return { status: 'valid', point, changed, source };
    }
    catch (error) {
        return {
            status: 'invalid',
            reason: error instanceof Error ? error.message : 'invalid_coordinates',
        };
    }
};
const getMongoUri = () => {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri)
        throw new Error('Missing MONGODB_URI (or MONGO_URI)');
    return uri;
};
exports.geoRepairCommand = {
    name: 'geo-repair',
    description: 'Normalize users.location.coordinates into strict GeoJSON Point; unset invalid payloads.',
    blastRadius: 'high',
    run: async (context) => {
        const mongoUri = getMongoUri();
        const BATCH_SIZE = 500;
        const summary = {
            mode: context.flags.apply ? 'APPLY' : 'DRY_RUN',
            scanned: 0,
            alreadyCanonical: 0,
            converted: 0,
            invalidUnset: 0,
            writeResult: {
                matchedCount: 0,
                modifiedCount: 0,
            },
        };
        const invalidSamples = [];
        const pendingOps = [];
        await mongoose_1.default.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Mongo connection established without database handle');
        }
        const users = db.collection('users');
        try {
            const cursor = users.find({ 'location.coordinates': { $exists: true } }, { projection: { _id: 1, name: 1, mobile: 1, 'location.coordinates': 1 } });
            const flush = async () => {
                if (!context.flags.apply || pendingOps.length === 0)
                    return;
                const result = await users.bulkWrite(pendingOps, { ordered: false });
                summary.writeResult.matchedCount += Number(result.matchedCount || 0);
                summary.writeResult.modifiedCount += Number(result.modifiedCount || 0);
                pendingOps.length = 0;
            };
            for await (const doc of cursor) {
                summary.scanned += 1;
                const coordinates = doc.location?.coordinates;
                const evaluation = evaluateCoordinates(coordinates);
                if (evaluation.status === 'valid') {
                    if (!evaluation.changed) {
                        summary.alreadyCanonical += 1;
                        continue;
                    }
                    summary.converted += 1;
                    pendingOps.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $set: { 'location.coordinates': evaluation.point } },
                        },
                    });
                }
                else {
                    summary.invalidUnset += 1;
                    if (invalidSamples.length < 20) {
                        invalidSamples.push({
                            _id: String(doc._id),
                            name: doc.name ?? null,
                            mobile: doc.mobile ?? null,
                            reason: evaluation.reason,
                            coordinates,
                        });
                    }
                    pendingOps.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $unset: { 'location.coordinates': '' } },
                        },
                    });
                }
                if (pendingOps.length >= BATCH_SIZE) {
                    await flush();
                }
            }
            await flush();
            context.emit('ops.command.geo-repair.summary', {
                ...summary,
                invalidSampleCount: invalidSamples.length,
            });
            return {
                summary: {
                    ...summary,
                    invalidSamples,
                },
                warnings: summary.invalidUnset > 0
                    ? ['Invalid coordinates were detected and will be unset in apply mode.']
                    : [],
                rollbackGuidance: [
                    'Restore from point-in-time backup if an apply run modified unintended documents.',
                    'Review logs/ops artifacts for modifiedCount and invalid samples before and after apply.',
                ],
            };
        }
        finally {
            await mongoose_1.default.disconnect();
        }
    },
};
//# sourceMappingURL=geoRepair.command.js.map