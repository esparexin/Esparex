import { getUserConnection } from '../config/db';
import logger from '../utils/logger';

const STRICT_ENV_FLAG = 'ENABLE_STRICT_DUPLICATE_INDEX';
const DEFAULT_MIGRATION_TAG = '20260219193000_backfill_duplicate_fingerprint_and_image_hashes';
const REPORT_COLLECTION = 'duplicate_fingerprint_backfill_reports';
const CONFLICT_COLLECTION = 'duplicate_fingerprint_conflicts';
const STRICT_INDEX_NAME = 'duplicateFingerprint_1';

type BackfillReport = {
    migrationTag: string;
    conflictCount?: number;
    strictIndexCreated?: boolean;
};

const isStrictIndexEnabled = (): boolean =>
    process.env[STRICT_ENV_FLAG] === 'true';

const getMigrationTag = (): string =>
    process.env.DUPLICATE_ROLLOUT_MIGRATION_TAG || DEFAULT_MIGRATION_TAG;

export const assertDuplicateRolloutReadiness = async (): Promise<void> => {
    if (!isStrictIndexEnabled()) {
        return;
    }

    const migrationTag = getMigrationTag();
    const db = getUserConnection().db;

    if (!db) {
        throw new Error(
            `[duplicate-rollout] Strict duplicate index mode is enabled, but user database is unavailable.`
        );
    }

    const reports = db.collection<BackfillReport>(REPORT_COLLECTION);
    const conflicts = db.collection(CONFLICT_COLLECTION);
    const ads = db.collection('ads');

    const [report, unresolvedConflicts, strictIndexExists] = await Promise.all([
        reports.findOne({ migrationTag }),
        conflicts.countDocuments({ migrationTag }),
        ads.indexExists(STRICT_INDEX_NAME),
    ]);

    const conflictCount = Number(report?.conflictCount || 0);
    const strictIndexCreated = report?.strictIndexCreated === true;

    const isReady =
        Boolean(report) &&
        conflictCount === 0 &&
        unresolvedConflicts === 0 &&
        strictIndexCreated &&
        strictIndexExists;

    if (!isReady) {
        throw new Error(
            `[duplicate-rollout] ${STRICT_ENV_FLAG}=true requires rollout readiness. ` +
            `migrationTag=${migrationTag}, reportFound=${Boolean(report)}, ` +
            `conflictCount=${conflictCount}, unresolvedConflicts=${unresolvedConflicts}, ` +
            `strictIndexCreated=${strictIndexCreated}, strictIndexExists=${strictIndexExists}.`
        );
    }

    logger.info('Duplicate rollout readiness check passed', {
        migrationTag,
        conflictCount,
        unresolvedConflicts,
        strictIndexCreated,
        strictIndexExists,
    });
};
