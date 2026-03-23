/**
 * Location Path Population Migration (idempotent)
 *
 * Populates the `path` (ancestry chain) array for Location documents
 * that have a `parentId` set but an empty/missing `path`.
 *
 * This is the prerequisite for removing the deprecated `city` and `state`
 * flat fields from the Location model (Sprint 3).
 *
 * Safe to run multiple times — only touches docs where path is empty.
 *
 * Usage:
 *   npx ts-node src/scripts/migrations/migrate_location_path_population.ts --dry-run
 *   npx ts-node src/scripts/migrations/migrate_location_path_population.ts --apply
 */

import mongoose, { Types } from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';

const MAX_DEPTH = 10; // guard against runaway recursion
const BATCH_SIZE = 500;
const isApply = process.argv.includes('--apply');

type Summary = {
    mode: 'dry-run' | 'apply';
    totalLocations: number;
    alreadyHavePath: number;
    noParent: number;          // root nodes (level=country etc.), expected to have empty path
    builtPaths: number;
    cyclesDetected: number;
    brokenParents: number;     // parentId points to non-existent location
    errors: number;
};

/* ------------------------------------------------------------------ */
/* Inline schema (no import of the full model to avoid side-effects)  */
/* ------------------------------------------------------------------ */
const LocationSchema = new mongoose.Schema(
    {
        name: String,
        level: String,
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
        path: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        city: { type: String, select: false },
        state: { type: String, select: false },
        isActive: Boolean,
        isDeleted: { type: Boolean, default: false },
    },
    { strict: false }
);

async function buildPath(
    parentId: Types.ObjectId,
    locationMap: Map<string, { parentId: Types.ObjectId | null; path: Types.ObjectId[] }>,
    summary: Summary
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

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[LocationPathMigration] Connected to DB');

    const Location = mongoose.model('Location', LocationSchema);

    const summary: Summary = {
        mode: isApply ? 'apply' : 'dry-run',
        totalLocations: 0,
        alreadyHavePath: 0,
        noParent: 0,
        builtPaths: 0,
        cyclesDetected: 0,
        brokenParents: 0,
        errors: 0,
    };

    // Load all locations into memory for fast parent lookups
    logger.info('[LocationPathMigration] Loading all locations...');
    const allLocations = await Location.find({ isDeleted: { $ne: true } })
        .select('_id parentId path')
        .lean<{ _id: Types.ObjectId; parentId: Types.ObjectId | null; path: Types.ObjectId[] }[]>();

    summary.totalLocations = allLocations.length;
    logger.info(`[LocationPathMigration] Loaded ${allLocations.length} locations`);

    const locationMap = new Map<string, { parentId: Types.ObjectId | null; path: Types.ObjectId[] }>();
    for (const loc of allLocations) {
        locationMap.set(String(loc._id), {
            parentId: loc.parentId ?? null,
            path: loc.path ?? [],
        });
    }

    // Find locations that need path population
    const needsPath = allLocations.filter((loc) => {
        const hasParent = loc.parentId != null;
        const hasPath = Array.isArray(loc.path) && loc.path.length > 0;
        return hasParent && !hasPath;
    });

    for (const loc of allLocations) {
        if (!loc.parentId) summary.noParent++;
        else if (Array.isArray(loc.path) && loc.path.length > 0) summary.alreadyHavePath++;
    }

    logger.info(`[LocationPathMigration] Need path population: ${needsPath.length} locations`);
    logger.info(`[LocationPathMigration] Already have path: ${summary.alreadyHavePath} locations`);
    logger.info(`[LocationPathMigration] No parent (root nodes): ${summary.noParent} locations`);

    if (needsPath.length === 0) {
        logger.info('[LocationPathMigration] Nothing to do — all paths are populated.');
        await mongoose.disconnect();
        logSummary(summary);
        return;
    }

    // Process in batches
    let processed = 0;
    for (let i = 0; i < needsPath.length; i += BATCH_SIZE) {
        const batch = needsPath.slice(i, i + BATCH_SIZE);
        const bulkOps: mongoose.AnyBulkWriteOperation[] = [];

        for (const loc of batch) {
            try {
                if (!loc.parentId) continue;
                const builtPath = await buildPath(loc.parentId, locationMap, summary);

                if (builtPath.length === 0) continue; // broken parent, already logged

                if (isApply) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: loc._id },
                            update: { $set: { path: builtPath } },
                        },
                    });
                }

                // Update in-memory map so subsequent builds in same batch benefit
                locationMap.set(String(loc._id), {
                    parentId: loc.parentId,
                    path: builtPath,
                });

                summary.builtPaths++;
            } catch (err) {
                logger.error('[LocationPathMigration] Error building path', { locId: String(loc._id), err });
                summary.errors++;
            }
        }

        if (isApply && bulkOps.length > 0) {
            await Location.bulkWrite(bulkOps);
            logger.info(`[LocationPathMigration] Applied batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${bulkOps.length} updates`);
        }

        processed += batch.length;
        logger.info(`[LocationPathMigration] Progress: ${processed}/${needsPath.length}`);
    }

    await mongoose.disconnect();
    logSummary(summary);
}

function logSummary(summary: Summary) {
    logger.info('[LocationPathMigration] ── SUMMARY ──────────────────────────────');
    logger.info(`  Mode:             ${summary.mode}`);
    logger.info(`  Total locations:  ${summary.totalLocations}`);
    logger.info(`  Already had path: ${summary.alreadyHavePath}`);
    logger.info(`  Root (no parent): ${summary.noParent}`);
    logger.info(`  Paths built:      ${summary.builtPaths}`);
    logger.info(`  Cycles detected:  ${summary.cyclesDetected}`);
    logger.info(`  Broken parents:   ${summary.brokenParents}`);
    logger.info(`  Errors:           ${summary.errors}`);
    logger.info('[LocationPathMigration] ────────────────────────────────────────');

    if (summary.mode === 'dry-run') {
        logger.info('[LocationPathMigration] Dry run complete. Re-run with --apply to persist changes.');
    } else {
        logger.info('[LocationPathMigration] Migration complete.');
        if (summary.cyclesDetected > 0 || summary.brokenParents > 0 || summary.errors > 0) {
            logger.warn('[LocationPathMigration] Issues detected — review warnings above before Sprint 3 field removal.');
        }
    }
}

run().catch((err) => {
    logger.error('[LocationPathMigration] Fatal error', { err });
    process.exit(1);
});
