#!/usr/bin/env node
const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/user/.env') });

const getArg = (name, fallback = undefined) => {
    const prefix = `${name}=`;
    const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
};

const runId = getArg('--run-id', `catalog-index-migration-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const mode = process.argv.includes('--apply')
    ? 'apply'
    : process.argv.includes('--rollback')
        ? 'rollback'
        : 'dry-run';

const userUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';
const adminUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';

const LEDGER_COLLECTION = 'catalog_index_migration_ledger';
const ROLLBACK_META_COLLECTION = 'catalog_index_migration_rollback_meta';

const REQUIRED_INDEXES = [
    { collection: 'brands', name: 'idx_brand_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 }, options: { unique: true } },
    { collection: 'models', name: 'idx_model_canonicalName_brandId_unique', keys: { canonicalName: 1, brandId: 1 }, options: { unique: true } },
    { collection: 'screensizes', name: 'idx_screensize_canonicalName_category_brand_unique', keys: { canonicalName: 1, categoryId: 1, brandId: 1 }, options: { unique: true } },
    { collection: 'servicetypes', name: 'idx_servicetype_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 }, options: { unique: true } },
    { collection: 'spareparts', name: 'idx_sparepart_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 }, options: { unique: true } },
];

const NON_TARGET_COLLECTIONS_AUDIT = ['categories', 'catalog_requests'];

const stable = (value) => JSON.stringify(value, Object.keys(value).sort());
const sameKeyPattern = (a, b) => stable(a) === stable(b);

const buildExistingIndexMap = (indexes) => {
    const byName = new Map();
    const byKey = new Map();
    for (const idx of indexes) {
        byName.set(idx.name, idx);
        byKey.set(stable(idx.key), idx);
    }
    return { byName, byKey };
};

const collectionExists = async (db, name) => {
    const found = await db.listCollections({ name }, { nameOnly: true }).toArray();
    return found.length > 0;
};

const uniqueCollisionAudit = async (db, required) => {
    const fieldNames = Object.keys(required.keys);
    const unwindStages = fieldNames
        .filter((field) => field.endsWith('Ids'))
        .map((field) => ({
            $unwind: {
                path: `$${field}`,
                preserveNullAndEmptyArrays: true,
            },
        }));
    const groupId = Object.fromEntries(fieldNames.map((field) => [field, `$${field}`]));
    const rows = await db.collection(required.collection).aggregate([
        ...unwindStages,
        {
            $group: {
                _id: groupId,
                count: { $sum: 1 },
                ids: { $push: '$_id' },
            },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
        {
            $project: {
                _id: 0,
                key: '$_id',
                count: 1,
                ids: { $slice: ['$ids', 10] },
            },
        },
    ]).toArray();

    return rows.map((row) => ({
        indexName: required.name,
        key: row.key,
        count: row.count,
        ids: row.ids.map((id) => String(id)),
    }));
};

const auditCollection = async (db, collectionName, requiredDefs) => {
    const exists = await collectionExists(db, collectionName);
    if (!exists) {
        return {
            collectionName,
            missingCollection: true,
            findings: requiredDefs.map((required) => ({ type: 'missing-collection', required })),
            duplicateIndexes: [],
            allIndexes: [],
        };
    }
    const indexes = await db.collection(collectionName).indexes();
    const { byName, byKey } = buildExistingIndexMap(indexes);

    const findings = [];
    for (const required of requiredDefs) {
        const existingByName = byName.get(required.name);
        const existingByKey = byKey.get(stable(required.keys));
        if (!existingByName && !existingByKey) {
            findings.push({ type: 'missing', required });
            continue;
        }
        const existing = existingByName || existingByKey;
        const uniqueMatch = Boolean(existing.unique) === Boolean(required.options.unique);
        if (!sameKeyPattern(existing.key, required.keys) || !uniqueMatch) {
            findings.push({
                type: 'drift',
                required,
                existing: { name: existing.name, key: existing.key, unique: Boolean(existing.unique) },
            });
            continue;
        }
        if (existing.name !== required.name) {
            findings.push({
                type: 'stale-name',
                required,
                existing: { name: existing.name, key: existing.key },
            });
            continue;
        }
        findings.push({ type: 'ok', required, existing: { name: existing.name } });
    }

    const duplicates = new Map();
    for (const idx of indexes) {
        const keySignature = stable(idx.key);
        if (!duplicates.has(keySignature)) duplicates.set(keySignature, []);
        duplicates.get(keySignature).push(idx.name);
    }
    const duplicateIndexes = Array.from(duplicates.entries())
        .filter(([, names]) => names.length > 1)
        .map(([key, names]) => ({ key, names }));

    return { collectionName, findings, duplicateIndexes, allIndexes: indexes };
};

const recordLedger = async (db, payload) => {
    await db.collection(LEDGER_COLLECTION).insertOne(payload);
};

const runDryOrApply = async (db, dbLabel, apply) => {
    const byCollection = REQUIRED_INDEXES.reduce((acc, idx) => {
        acc[idx.collection] = acc[idx.collection] || [];
        acc[idx.collection].push(idx);
        return acc;
    }, {});

    const audit = {};
    const actions = [];
    const uniqueCollisions = {};

    for (const [collectionName, requiredDefs] of Object.entries(byCollection)) {
        const report = await auditCollection(db, collectionName, requiredDefs);
        const collectionCollisions = [];
        for (const required of requiredDefs) {
            collectionCollisions.push(...await uniqueCollisionAudit(db, required));
        }
        uniqueCollisions[collectionName] = collectionCollisions;
        audit[collectionName] = {
            findings: report.findings,
            duplicateIndexes: report.duplicateIndexes,
            uniqueCollisions: collectionCollisions,
        };

        for (const finding of report.findings) {
            if (finding.type === 'missing' || finding.type === 'stale-name') {
                actions.push({
                    action: 'create-index',
                    collection: collectionName,
                    index: finding.required,
                });
            }
        }
    }

    for (const collectionName of NON_TARGET_COLLECTIONS_AUDIT) {
        const exists = await collectionExists(db, collectionName);
        if (!exists) {
            audit[collectionName] = { exists: false, indexCount: 0 };
            continue;
        }
        const indexes = await db.collection(collectionName).indexes();
        audit[collectionName] = { exists: true, indexCount: indexes.length };
    }

    const rollbackPlan = [];
    if (apply) {
        const blockingCollisions = Object.values(uniqueCollisions).flat();
        if (blockingCollisions.length > 0) {
            throw new Error(`Apply blocked by ${blockingCollisions.length} unique key collision group(s). Run dry-run for details.`);
        }
        for (const item of actions) {
            const { collection, index } = item;
            const result = await db.collection(collection).createIndex(index.keys, { ...index.options, name: index.name });
            rollbackPlan.push({ collection, indexName: result });
        }
        await db.collection(ROLLBACK_META_COLLECTION).insertOne({
            runId,
            dbLabel,
            createdIndexes: rollbackPlan,
            createdAt: new Date(),
        });
    }

    return { audit, actions, rollbackPlan };
};

const rollbackByRun = async (db, dbLabel) => {
    const rollbackRunIdArg = process.argv.find((arg) => arg.startsWith('--run-id='));
    const rollbackRunId = rollbackRunIdArg ? rollbackRunIdArg.split('=')[1] : '';
    if (!rollbackRunId) {
        throw new Error('Rollback requires --run-id=<catalog-index-migration-run-id>');
    }

    const meta = await db.collection(ROLLBACK_META_COLLECTION).findOne({ runId: rollbackRunId, dbLabel });
    if (!meta) {
        throw new Error(`No rollback metadata found for runId=${rollbackRunId} db=${dbLabel}`);
    }

    for (const idx of meta.createdIndexes || []) {
        await db.collection(idx.collection).dropIndex(idx.indexName);
    }

    await recordLedger(db, {
        runId,
        mode: 'rollback',
        rollbackOfRunId: rollbackRunId,
        dbLabel,
        droppedIndexes: meta.createdIndexes || [],
        createdAt: new Date(),
    });

    return { rollbackOfRunId: rollbackRunId, droppedIndexes: meta.createdIndexes || [] };
};

async function main() {
    const userClient = new MongoClient(userUri);
    const adminClient = new MongoClient(adminUri);
    await userClient.connect();
    await adminClient.connect();
    const userDb = userClient.db();
    const adminDb = adminClient.db();

    try {
        if (mode === 'rollback') {
            const userRollback = await rollbackByRun(userDb, 'user');
            const adminRollback = await rollbackByRun(adminDb, 'admin');
            console.log(JSON.stringify({ runId, mode, userRollback, adminRollback }, null, 2));
            return;
        }

        const apply = mode === 'apply';
        if (apply && process.env.CATALOG_INDEX_MIGRATION_ALLOW_APPLY !== 'true') {
            throw new Error('Apply blocked. Set CATALOG_INDEX_MIGRATION_ALLOW_APPLY=true in non-production rehearsal environments only.');
        }
        const userResult = await runDryOrApply(userDb, 'user', apply);
        const adminResult = await runDryOrApply(adminDb, 'admin', apply);
        const output = {
            runId,
            mode,
            safety: {
                applyEnabled: apply,
                rollbackSupported: true,
                productionApplyRecommended: false,
            },
            user: userResult,
            admin: adminResult,
        };

        await recordLedger(userDb, { runId, mode, dbLabel: 'user', output, createdAt: new Date() });
        await recordLedger(adminDb, { runId, mode, dbLabel: 'admin', output, createdAt: new Date() });
        console.log(JSON.stringify(output, null, 2));
    } finally {
        await Promise.all([userClient.close(), adminClient.close()]);
    }
}

main().catch((error) => {
    console.error('[catalog-index-migration] failed:', error && error.stack ? error.stack : String(error));
    process.exit(1);
});
