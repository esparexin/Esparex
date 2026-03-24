/**
 * Callable version of the location path population migration.
 * Used by the admin API endpoint (POST /admin/system/locations/migrate-paths).
 * The standalone CLI script (migrate_location_path_population.ts) uses this internally too.
 */

import mongoose, { Types } from 'mongoose';
import { getUserConnection } from '../../config/db';
import logger from '../../utils/logger';

const MAX_DEPTH = 10;
const BATCH_SIZE = 500;

export type PathMigrationResult = {
    mode: 'dry-run' | 'apply';
    totalLocations: number;
    alreadyHavePath: number;
    noParent: number;
    builtPaths: number;
    cyclesDetected: number;
    brokenParents: number;
    errors: number;
};

type LocationDoc = {
    _id: Types.ObjectId;
    parentId: Types.ObjectId | null;
    path: Types.ObjectId[];
};

async function buildPath(
    parentId: Types.ObjectId,
    locationMap: Map<string, { parentId: Types.ObjectId | null }>,
    summary: PathMigrationResult
): Promise<Types.ObjectId[]> {
    const chain: Types.ObjectId[] = [];
    const visited = new Set<string>();
    let current: Types.ObjectId | null = parentId;

    while (current && chain.length < MAX_DEPTH) {
        const key = String(current);
        if (visited.has(key)) {
            logger.warn('[LocationPathMigration] Cycle detected', { atId: key });
            summary.cyclesDetected++;
            break;
        }
        visited.add(key);

        const parent = locationMap.get(key);
        if (!parent) {
            logger.warn('[LocationPathMigration] Broken parentId reference', { missingId: key });
            summary.brokenParents++;
            break;
        }
        chain.unshift(current);
        current = parent.parentId;
    }

    return chain;
}

export async function runLocationPathMigrationJob(
    opts: { apply: boolean } = { apply: false }
): Promise<PathMigrationResult> {
    const conn = getUserConnection();
    const Location = conn.models.Location as mongoose.Model<LocationDoc> ??
        conn.model<LocationDoc>('Location', new mongoose.Schema(
            { parentId: { type: mongoose.Schema.Types.ObjectId, default: null }, path: [mongoose.Schema.Types.ObjectId] },
            { strict: false }
        ));

    const summary: PathMigrationResult = {
        mode: opts.apply ? 'apply' : 'dry-run',
        totalLocations: 0,
        alreadyHavePath: 0,
        noParent: 0,
        builtPaths: 0,
        cyclesDetected: 0,
        brokenParents: 0,
        errors: 0,
    };

    const allLocations = await Location.find({ isDeleted: { $ne: true } })
        .select('_id parentId path')
        .lean<LocationDoc[]>();

    summary.totalLocations = allLocations.length;

    const locationMap = new Map<string, { parentId: Types.ObjectId | null }>();
    for (const loc of allLocations) {
        locationMap.set(String(loc._id), { parentId: loc.parentId ?? null });
    }

    const needsPath = allLocations.filter((loc) => {
        if (!loc.parentId) { summary.noParent++; return false; }
        if (Array.isArray(loc.path) && loc.path.length > 0) { summary.alreadyHavePath++; return false; }
        return true;
    });

    for (let i = 0; i < needsPath.length; i += BATCH_SIZE) {
        const batch = needsPath.slice(i, i + BATCH_SIZE);
        const bulkOps: mongoose.AnyBulkWriteOperation[] = [];

        for (const loc of batch) {
            try {
                if (!loc.parentId) continue;
                const builtPath = await buildPath(loc.parentId, locationMap, summary);
                if (builtPath.length === 0) continue;

                if (opts.apply) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: loc._id },
                            update: { $set: { path: builtPath } },
                        },
                    });
                }
                summary.builtPaths++;
            } catch (err) {
                logger.error('[LocationPathMigration] Error building path', { locId: String(loc._id), err });
                summary.errors++;
            }
        }

        if (opts.apply && bulkOps.length > 0) {
            await Location.bulkWrite(bulkOps);
        }
    }

    logger.info('[LocationPathMigration] Complete', summary);
    return summary;
}
