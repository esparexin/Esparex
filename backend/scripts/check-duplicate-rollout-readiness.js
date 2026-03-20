#!/usr/bin/env node

const STRICT_ENV_FLAG = 'ENABLE_STRICT_DUPLICATE_INDEX';
const DEFAULT_MIGRATION_TAG = '20260219193000_backfill_duplicate_fingerprint_and_image_hashes';
const REPORT_COLLECTION = 'duplicate_fingerprint_backfill_reports';
const CONFLICT_COLLECTION = 'duplicate_fingerprint_conflicts';
const STRICT_INDEX_NAME = 'duplicateFingerprint_1';

const strictEnabled = process.env[STRICT_ENV_FLAG] === 'true';
const migrationTag = process.env.DUPLICATE_ROLLOUT_MIGRATION_TAG || DEFAULT_MIGRATION_TAG;
const mongoUri = process.env.MONGODB_URI;

const parseDbName = (uri) => {
    try {
        const parsed = new URL(uri);
        const fromPath = parsed.pathname.replace(/^\//, '');
        if (fromPath) return fromPath;
    } catch {
        return '';
    }
    return '';
};

const resolveDatabaseName = () =>
    process.env.MONGODB_DB_NAME ||
    parseDbName(mongoUri || '') ||
    'esparex_user';

const emitSummary = (summary) => {
    console.info(`[duplicate-rollout] ${JSON.stringify(summary)}`);
};

const fail = (message, summary) => {
    emitSummary({ ...summary, status: 'failed', message });
    process.exit(1);
};

const main = async () => {
    const { MongoClient } = await import('mongodb');

    if (!strictEnabled) {
        emitSummary({
            status: 'skipped',
            strictEnabled: false,
            migrationTag,
            message: `${STRICT_ENV_FLAG} is not true`,
        });
        return;
    }

    if (!mongoUri) {
        fail(`${STRICT_ENV_FLAG}=true requires MONGODB_URI for rollout readiness check`, {
            strictEnabled: true,
            migrationTag,
        });
        return;
    }

    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const dbName = resolveDatabaseName();
        const db = client.db(dbName);

        const reports = db.collection(REPORT_COLLECTION);
        const conflicts = db.collection(CONFLICT_COLLECTION);
        const ads = db.collection('ads');

        const [report, unresolvedConflicts, strictIndexExists] = await Promise.all([
            reports.findOne({ migrationTag }),
            conflicts.countDocuments({ migrationTag }),
            ads.indexExists(STRICT_INDEX_NAME),
        ]);

        const conflictCount = Number(report?.conflictCount || 0);
        const strictIndexCreated = report?.strictIndexCreated === true;

        const ready =
            Boolean(report) &&
            conflictCount === 0 &&
            unresolvedConflicts === 0 &&
            strictIndexCreated &&
            strictIndexExists;

        const summary = {
            strictEnabled: true,
            migrationTag,
            dbName,
            reportFound: Boolean(report),
            conflictCount,
            unresolvedConflicts,
            strictIndexCreated,
            strictIndexExists,
        };

        if (!ready) {
            fail(
                'Strict duplicate rollout guard failed. Resolve conflicts and rerun migration before enabling strict mode.',
                summary
            );
            return;
        }

        emitSummary({ ...summary, status: 'ok' });
    } finally {
        await client.close();
    }
};

main().catch((error) => {
    fail('Duplicate rollout readiness check crashed', {
        strictEnabled,
        migrationTag,
        error: error instanceof Error ? error.message : String(error),
    });
});
