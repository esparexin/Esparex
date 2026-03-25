/**
 * Location Path Population Migration (idempotent) — CLI wrapper
 *
 * Populates the `path` (ancestry chain) array for Location documents
 * that have a `parentId` set but an empty/missing `path`.
 *
 * This script is a thin CLI entry-point. The migration logic lives in:
 *   src/scripts/migrations/migrate_location_path_population_job.ts
 *
 * Usage:
 *   npx ts-node src/scripts/migrations/migrate_location_path_population.ts --dry-run
 *   npx ts-node src/scripts/migrations/migrate_location_path_population.ts --apply
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { runLocationPathMigrationJob } from './migrate_location_path_population_job';

const isApply = process.argv.includes('--apply');

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[LocationPathMigration] Connected to DB');

    const summary = await runLocationPathMigrationJob({ apply: isApply });

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

    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('[LocationPathMigration] Fatal error', { err });
    process.exit(1);
});
