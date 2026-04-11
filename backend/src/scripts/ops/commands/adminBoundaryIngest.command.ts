/**
 * Ops Command: admin-boundary-ingest
 *
 * Ingests India state boundaries from GeoJSON into the AdminBoundary collection.
 * This enables fast polygon-based reverse geocoding (point-in-polygon) instead
 * of the slower nearest-point fallback scan currently in use.
 *
 * Data source (built-in default):
 *   https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson
 *
 * Or provide a local file path via --file=/path/to/india_states.geojson
 *
 * How it works:
 *   1. Loads GeoJSON (remote URL or local file).
 *   2. For each Feature, extracts NAME_1 (state name) and geometry.
 *   3. Finds the matching Location document (level=state, name ~= NAME_1).
 *   4. Upserts an AdminBoundary record (locationId + geometry).
 *   5. Reports matched / unmatched / upserted counts.
 *
 * Usage (dry-run — no writes):
 *   npm run ops -- admin-boundary-ingest
 *
 * Usage (apply):
 *   npm run ops -- admin-boundary-ingest --apply
 *
 * Usage with local file:
 *   npm run ops -- admin-boundary-ingest --apply --file=/path/to/states.geojson
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';

const DEFAULT_GEOJSON_URL =
    'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

// Common name aliases: GeoJSON NAME_1 → canonical state name in our DB
const STATE_NAME_ALIASES: Record<string, string> = {
    'Andaman and Nicobar': 'Andaman & Nicobar Islands',
    'Jammu and Kashmir': 'Jammu & Kashmir',
    'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli',
    'Daman and Diu': 'Daman & Diu',
    'NCT of Delhi': 'Delhi',
    'Delhi': 'Delhi',
};

interface GeoJsonFeature {
    type: 'Feature';
    properties: {
        NAME_1: string;
        [key: string]: unknown;
    };
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
}

interface GeoJsonCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
}

const resolveStateName = (rawName: string): string =>
    STATE_NAME_ALIASES[rawName] ?? rawName;

const fetchGeoJson = async (source: string): Promise<GeoJsonCollection> => {
    if (source.startsWith('http')) {
        const { default: https } = await import('https');
        const { default: http } = await import('http');
        const client = source.startsWith('https') ? https : http;

        return new Promise((resolve, reject) => {
            client.get(source, (res) => {
                let data = '';
                res.on('data', (chunk: string) => { data += chunk; });
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(e); }
                });
                res.on('error', reject);
            }).on('error', reject);
        });
    }

    const raw = fs.readFileSync(path.resolve(source), 'utf-8');
    return JSON.parse(raw) as GeoJsonCollection;
};

export const adminBoundaryIngestCommand: OpsCommand = {
    name: 'admin-boundary-ingest',
    description:
        'Ingest India state boundary polygons from GeoJSON into AdminBoundary collection for polygon-based reverse geocoding.',
    blastRadius: 'medium',

    run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
        const isDryRun = !context.flags.apply;
        const fileArg = typeof context.flags.file === 'string' ? context.flags.file : null;
        const geoSource = fileArg ?? DEFAULT_GEOJSON_URL;

        const [
            { default: AdminBoundary },
        ] = await Promise.all([
            import('../../../models/AdminBoundary'),
        ]);

        // Use native driver for Location lookup (no Mongoose model import needed)
        const db = (mongoose.connection.db) as unknown as {
            collection: (name: string) => {
                findOne: (q: object, opts?: object) => Promise<{ _id: mongoose.Types.ObjectId; name: string } | null>;
                countDocuments: (q: object) => Promise<number>;
            };
        };

        const locations = db.collection<{ _id: mongoose.Types.ObjectId; name: string }>('locations');

        context.emit('ops.command.admin-boundary-ingest.start', {
            mode: isDryRun ? 'DRY_RUN' : 'APPLY',
            source: geoSource,
        });

        // 1. Load GeoJSON
        let geoJson: GeoJsonCollection;
        try {
            geoJson = await fetchGeoJson(geoSource);
        } catch (err) {
            return {
                summary: {
                    mode: isDryRun ? 'DRY_RUN' : 'APPLY',
                    result: 'ERROR',
                    error: `Failed to load GeoJSON from ${geoSource}: ${String(err)}`,
                },
                warnings: ['Check network access or provide a local --file path.'],
                rollbackGuidance: [],
            };
        }

        if (!geoJson.features || geoJson.features.length === 0) {
            return {
                summary: { mode: isDryRun ? 'DRY_RUN' : 'APPLY', result: 'ERROR', error: 'GeoJSON has no features.' },
                warnings: [],
                rollbackGuidance: [],
            };
        }

        context.emit('ops.command.admin-boundary-ingest.loaded', {
            featureCount: geoJson.features.length,
        });

        // 2. Existing boundary count
        const existingCount = await AdminBoundary.countDocuments({ level: 'state' });

        const matched: string[] = [];
        const unmatched: string[] = [];
        let upserted = 0;

        // 3. Process each feature
        for (const feature of geoJson.features) {
            const rawName = feature.properties?.NAME_1;
            if (!rawName || !feature.geometry) {
                unmatched.push(rawName ?? '(no name)');
                continue;
            }

            const resolvedName = resolveStateName(rawName);

            // Find matching Location (state level, name match)
            const location = await (locations as any).findOne({
                level: 'state',
                $or: [
                    { name: { $regex: new RegExp(`^${resolvedName}$`, 'i') } },
                    { state: { $regex: new RegExp(`^${resolvedName}$`, 'i') } },
                ],
            });

            if (!location) {
                unmatched.push(`${rawName} (resolved: ${resolvedName})`);
                continue;
            }

            matched.push(resolvedName);

            if (!isDryRun) {
                await AdminBoundary.findOneAndUpdate(
                    { locationId: location._id, level: 'state' },
                    {
                        $set: {
                            name: resolvedName,
                            level: 'state',
                            locationId: location._id,
                            geometry: {
                                type: feature.geometry.type,
                                coordinates: feature.geometry.coordinates,
                            },
                        },
                    },
                    { upsert: true, new: true }
                );
                upserted++;
            }
        }

        const finalCount = isDryRun
            ? existingCount
            : await AdminBoundary.countDocuments({ level: 'state' });

        context.emit('ops.command.admin-boundary-ingest.summary', {
            mode: isDryRun ? 'DRY_RUN' : 'APPLY',
            featuresProcessed: geoJson.features.length,
            matched: matched.length,
            unmatched: unmatched.length,
            upserted,
            existingBoundaries: existingCount,
            finalBoundaries: finalCount,
        });

        return {
            summary: {
                mode: isDryRun ? 'DRY_RUN' : 'APPLY',
                result: isDryRun ? 'DRY_RUN_COMPLETE' : '✅ INGEST_COMPLETE',
                source: geoSource,
                featuresProcessed: geoJson.features.length,
                matched: matched.length,
                matchedStates: matched,
                unmatched: unmatched.length,
                unmatchedStates: unmatched,
                upserted: isDryRun ? '(dry-run — no writes)' : upserted,
                existingBoundaryCount: existingCount,
                finalBoundaryCount: finalCount,
            },
            warnings: unmatched.length > 0
                ? [`${unmatched.length} state(s) could not be matched to a Location in the DB. Add name aliases to STATE_NAME_ALIASES if needed.`]
                : [],
            rollbackGuidance: [
                'To rollback: db.adminboundaries.deleteMany({ level: "state" })',
                'Reverse geocoding will fall back to nearest-point scanning automatically.',
            ],
        };
    },
};
