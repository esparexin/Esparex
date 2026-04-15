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
 * Or provide a local file path as an extra arg:
 *   npm run ops -- admin-boundary-ingest --apply /path/to/india_states.geojson
 *
 * How it works:
 *   1. Loads GeoJSON (remote URL or local file from first extra arg).
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
 * Usage with local file (first positional arg after flags):
 *   npm run ops -- admin-boundary-ingest --apply /path/to/states.geojson
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';
import { connectOpsDb } from './commandUtils';
import { closeDB } from '../../../config/db';

const DEFAULT_GEOJSON_URL =
    'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson';

// Common name aliases: GeoJSON NAME_1 → canonical state name in our DB
const STATE_NAME_ALIASES: Record<string, string> = {
    'Orissa': 'Odisha',
    'Uttaranchal': 'Uttarakhand',
    'Andaman & Nicobar': 'Andaman and Nicobar',
    'Andaman and Nicobar Islands': 'Andaman and Nicobar',
    'Andaman and Nicobar': 'Andaman and Nicobar',
    'Jammu & Kashmir': 'Jammu and Kashmir',
    'Jammu and Kashmir': 'Jammu and Kashmir',
    'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'NCT of Delhi': 'Delhi',
    'Delhi': 'Delhi',
    'Assam': 'Assam',
    'Chandigarh': 'Chandigarh',
    'Puducherry': 'Puducherry',
    'Pondicherry': 'Puducherry',
    'Telangana': 'Telangana',
};

interface GeoJsonFeature {
    type: 'Feature';
    properties: {
        NAME_1?: string;  // geohacker format
        ST_NM?: string;   // datameet format
        State?: string;   // alternative key
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

interface LocationDoc {
    _id: mongoose.Types.ObjectId;
    name: string;
    level?: string;
    state?: string;
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
                    try { resolve(JSON.parse(data) as GeoJsonCollection); }
                    catch (e) { reject(e instanceof Error ? e : new Error(String(e))); }
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
        // Extra positional arg: first arg that doesn't start with '--'
        const fileArg = context.args.find((a) => !a.startsWith('--')) ?? null;
        const geoSource = fileArg ?? DEFAULT_GEOJSON_URL;

        // Connect to MongoDB (ops runner does not bootstrap a connection)
        const db = await connectOpsDb();

        try {
            const [{ default: AdminBoundary }] = await Promise.all([
                import('../../../models/AdminBoundary'),
            ]);

            if (!db) throw new Error('DB handle not available');

        const locations = db.collection('locations');

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
                warnings: ['Check network access or provide a local file path as the first positional arg.'],
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
            // Support both geohacker (NAME_1) and datameet (ST_NM/State) property formats
            const rawName = feature.properties?.ST_NM ?? feature.properties?.State ?? feature.properties?.NAME_1;
            if (!rawName || !feature.geometry) {
                unmatched.push(rawName ?? '(no name)');
                continue;
            }

            const resolvedName = resolveStateName(rawName);

            // Find matching Location (state level, name match)
            const location = await locations.findOne({
                level: 'state',
                $or: [
                    { name: { $regex: new RegExp(`^${resolvedName}$`, 'i') } },
                    { state: { $regex: new RegExp(`^${resolvedName}$`, 'i') } },
                ],
            }) as LocationDoc | null;

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
                            level: 'state' as const,
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
    } finally {
        await closeDB();
    }
},
};
