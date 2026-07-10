#!/usr/bin/env node
'use strict';

const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/api/.env') });

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const apply = args.has('--apply');
const rollbackRunId = getArg('--rollback-run-id');
const targetDb = getArg('--db', 'admin');
const runId = getArg('--run-id', `catalog-strict-collision-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const maxIterations = Number(getArg('--max-iterations', '500'));

if (apply && process.env.CATALOG_STRICT_COLLISION_ALLOW_APPLY !== 'true') {
  console.error('[catalog-strict-collision-remediation] apply blocked. Set CATALOG_STRICT_COLLISION_ALLOW_APPLY=true for non-production rehearsals only.');
  process.exit(1);
}

const mongoUri = targetDb === 'user'
  ? process.env.MONGODB_URI
  : process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('[catalog-strict-collision-remediation] missing MongoDB URI.');
  process.exit(1);
}

const SNAPSHOTS = 'catalog_strict_collision_snapshots';
const LEDGER = 'catalog_strict_collision_remediation_ledger';
const ACTOR = 'system:catalog-strict-collision-remediation';

const REQUIRED_INDEXES = [
  { collection: 'brands', name: 'idx_brand_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 } },
  { collection: 'models', name: 'idx_model_canonicalName_brandId_unique', keys: { canonicalName: 1, brandId: 1 } },
  { collection: 'screensizes', name: 'idx_screensize_canonicalName_category_brand_unique', keys: { canonicalName: 1, categoryId: 1, brandId: 1 } },
  { collection: 'servicetypes', name: 'idx_servicetype_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 } },
  { collection: 'spareparts', name: 'idx_sparepart_canonicalName_categoryIds_unique', keys: { canonicalName: 1, categoryIds: 1 } },
];

const REF_RULES = {
  brands: [
    { collection: 'models', field: 'brandId' },
    { collection: 'spareparts', field: 'brandId' },
    { collection: 'screensizes', field: 'brandId' },
    { collection: 'ads', field: 'brandId' },
    { collection: 'catalog_requests', field: 'parentBrandId' },
    { collection: 'smartalerts', field: 'criteria.brandId' },
  ],
  models: [
    { collection: 'spareparts', field: 'modelId' },
    { collection: 'variants', field: 'modelId' },
    { collection: 'ads', field: 'modelId' },
    { collection: 'smartalerts', field: 'criteria.modelId' },
  ],
  servicetypes: [
    { collection: 'ads', field: 'serviceTypeIds', array: true },
  ],
  spareparts: [
    { collection: 'ads', field: 'sparePartId' },
    { collection: 'ads', field: 'sparePartIds', array: true },
  ],
};

const idString = (value) => {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};
const toObjectId = (value) => new ObjectId(idString(value));
const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stableHash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function collectionExists(db, name) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

async function ensureMetaIndexes(db) {
  if (!apply && !rollbackRunId) return;
  await db.collection(SNAPSHOTS).createIndex({ runId: 1, collection: 1, documentId: 1 }, { unique: true });
  await db.collection(LEDGER).createIndex({ runId: 1, collection: 1, survivorId: 1, timestamp: 1 });
}

async function snapshotDoc(db, collection, doc) {
  if (!apply || !doc) return;
  await db.collection(SNAPSHOTS).updateOne(
    { runId, collection, documentId: idString(doc._id) },
    {
      $setOnInsert: {
        runId,
        collection,
        documentId: idString(doc._id),
        originalDoc: doc,
        originalHash: stableHash(doc),
        timestamp: new Date(),
      },
    },
    { upsert: true }
  );
}

async function writeLedger(db, entry) {
  const doc = { runId, timestamp: new Date(), applied: apply, ...entry };
  if (apply) await db.collection(LEDGER).insertOne(doc);
  return doc;
}

function indexFields(indexDef) {
  return Object.keys(indexDef.keys);
}

async function strictUniqueCollisions(db, indexDef) {
  if (!(await collectionExists(db, indexDef.collection))) return [];
  const fields = indexFields(indexDef);
  const unwindStages = fields
    .filter((field) => field.endsWith('Ids'))
    .map((field) => ({
      $unwind: {
        path: `$${field}`,
        preserveNullAndEmptyArrays: true,
      },
    }));
  const groupId = Object.fromEntries(fields.map((field) => [field, `$${field}`]));
  const groups = await db.collection(indexDef.collection).aggregate([
    ...unwindStages,
    { $group: { _id: groupId, count: { $sum: 1 }, ids: { $addToSet: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ], { allowDiskUse: true }).toArray();

  return Promise.all(groups.map(async (group) => {
    const docs = await db.collection(indexDef.collection)
      .find({ _id: { $in: group.ids } })
      .toArray();
    return {
      collection: indexDef.collection,
      indexName: indexDef.name,
      indexScope: group._id,
      count: group.count,
      docs,
    };
  }));
}

async function allStrictUniqueCollisions(db) {
  const results = [];
  for (const indexDef of REQUIRED_INDEXES) {
    results.push(...await strictUniqueCollisions(db, indexDef));
  }
  return results;
}

async function referenceCountFor(db, sourceCollection, sourceId) {
  const rules = REF_RULES[sourceCollection] || [];
  const counts = {};
  let total = 0;
  for (const rule of rules) {
    if (!(await collectionExists(db, rule.collection))) continue;
    const oid = toObjectId(sourceId);
    const filter = { [rule.field]: rule.array ? { $in: [oid] } : oid };
    const count = await db.collection(rule.collection).countDocuments(filter);
    counts[`${rule.collection}.${rule.field}`] = count;
    total += count;
  }
  return { total, counts };
}

async function docsWithRefCounts(db, collection, docs) {
  const rows = [];
  for (const doc of docs) {
    rows.push({ doc, refs: await referenceCountFor(db, collection, doc._id) });
  }
  return rows;
}

function valueList(doc, field) {
  const value = doc[field];
  if (Array.isArray(value)) return value.map(idString).filter(Boolean).sort();
  const normalized = idString(value);
  return normalized ? [normalized] : ['__missing__'];
}

function fullScopeKey(doc, indexDef) {
  return indexFields(indexDef)
    .map((field) => `${field}:${valueList(doc, field).join(',')}`)
    .join('|');
}

function classifyCollision(group, indexDef) {
  const fullScopes = new Set(group.docs.map((doc) => fullScopeKey(doc, indexDef)));
  const hasMultikey = indexFields(indexDef).some((field) =>
    field.endsWith('Ids') && group.docs.some((doc) => Array.isArray(doc[field]) && doc[field].length > 1)
  );
  const hasDeprecated = group.docs.some((doc) => doc.isDeleted === true || doc.status === 'deleted' || doc.quarantined === true);
  const canonicalValues = new Set(group.docs.map((doc) => normalize(doc.canonicalName || doc.name)));
  if (hasDeprecated) return 'deprecated-record-collision';
  if (hasMultikey) return fullScopes.size === 1 ? 'exact-multikey-duplicate' : 'multikey-overlap';
  if (canonicalValues.size === 1 && fullScopes.size === 1) return 'exact-duplicate';
  if (canonicalValues.size === 1) return 'scoped-duplicate';
  return 'normalization-drift';
}

function survivorScore(row) {
  const doc = row.doc;
  return (
    row.refs.total * 1000 +
    (doc.isDeleted === true ? -100000 : 0) +
    (doc.quarantined === true ? -100000 : 0) +
    (doc.status === 'live' ? 300 : 0) +
    (doc.approvalStatus === 'approved' ? 200 : 0) +
    (doc.isActive !== false ? 100 : 0) +
    (doc.canonicalName ? 20 : 0) +
    (doc.slug ? 10 : 0)
  );
}

function chooseSurvivor(rows) {
  return [...rows].sort((a, b) => {
    const diff = survivorScore(b) - survivorScore(a);
    if (diff !== 0) return diff;
    return String(a.doc.createdAt || a.doc._id).localeCompare(String(b.doc.createdAt || b.doc._id));
  })[0];
}

async function updateManyWithSnapshots(db, collection, filter, update) {
  const docs = await db.collection(collection).find(filter).toArray();
  for (const doc of docs) await snapshotDoc(db, collection, doc);
  if (apply && docs.length > 0) await db.collection(collection).updateMany(filter, update);
  return docs.length;
}

async function migrateReferences(db, sourceCollection, sourceId, targetId) {
  const rules = REF_RULES[sourceCollection] || [];
  let affected = 0;
  for (const rule of rules) {
    if (!(await collectionExists(db, rule.collection))) continue;
    const from = toObjectId(sourceId);
    const to = toObjectId(targetId);
    const filter = { [rule.field]: rule.array ? { $in: [from] } : from };
    const update = rule.array
      ? [
          {
            $set: {
              [rule.field]: {
                $setUnion: [
                  {
                    $filter: {
                      input: { $ifNull: [`$${rule.field}`, []] },
                      as: 'entry',
                      cond: { $ne: ['$$entry', from] },
                    },
                  },
                  [to],
                ],
              },
            },
          },
        ]
      : { $set: { [rule.field]: to } };
    affected += await updateManyWithSnapshots(db, rule.collection, filter, update);
  }
  return affected;
}

function mergeArrayValues(...arrays) {
  const seen = new Map();
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const value of arr) {
      const key = idString(value);
      if (!key || seen.has(key)) continue;
      seen.set(key, value);
    }
  }
  return Array.from(seen.values());
}

function deprecatedCanonical(doc) {
  const base = normalize(doc.canonicalName || doc.name || doc.slug || 'catalog');
  return `${base}__deprecated__${idString(doc._id)}`;
}

async function remediateGroup(db, group, indexDef) {
  const rows = await docsWithRefCounts(db, group.collection, group.docs);
  const survivorRow = chooseSurvivor(rows);
  const survivor = survivorRow.doc;
  const deprecatedRows = rows.filter((row) => idString(row.doc._id) !== idString(survivor._id));
  const collisionType = classifyCollision(group, indexDef);
  const mergedIds = [];
  let referenceUpdates = 0;

  for (const row of deprecatedRows) {
    const doc = row.doc;
    mergedIds.push(idString(doc._id));
    referenceUpdates += await migrateReferences(db, group.collection, doc._id, survivor._id);

    const canonicalName = deprecatedCanonical(doc);
    const slug = `${slugify(doc.slug || doc.name || doc.canonicalName || 'catalog') || 'catalog'}-deprecated-${idString(doc._id)}`;
    await updateManyWithSnapshots(
      db,
      group.collection,
      { _id: doc._id },
      {
        $set: {
          canonicalName,
          slug,
          strictCollisionDeprecated: true,
          strictCollisionDeprecatedBy: survivor._id,
          strictCollisionRunId: runId,
          isActive: false,
          isDeleted: true,
          status: 'deleted',
          deletedAt: new Date(),
          deletedBy: ACTOR,
        },
      }
    );
  }

  const aliases = Array.from(new Set([
    ...(Array.isArray(survivor.aliases) ? survivor.aliases : []),
    ...deprecatedRows.flatMap((row) => [row.doc.name, row.doc.displayName, row.doc.canonicalName, ...(Array.isArray(row.doc.aliases) ? row.doc.aliases : [])]),
  ].filter(Boolean).map(String)));
  const survivorPatch = { aliases };
  if (group.collection === 'brands' || group.collection === 'servicetypes' || group.collection === 'spareparts') {
    const mergedCategoryIds = mergeArrayValues(survivor.categoryIds, ...deprecatedRows.map((row) => row.doc.categoryIds));
    if (mergedCategoryIds.length > 0) survivorPatch.categoryIds = mergedCategoryIds;
  }

  await updateManyWithSnapshots(db, group.collection, { _id: survivor._id }, { $set: survivorPatch });
  await writeLedger(db, {
    collection: group.collection,
    survivorId: idString(survivor._id),
    mergedIds,
    collisionType,
    indexScope: group.indexScope,
    indexName: group.indexName,
    referenceUpdates,
    survivorPolicy: 'strict-scoped-survivor-policy:v1',
    survivorScore: survivorScore(survivorRow),
    deprecatedScores: Object.fromEntries(deprecatedRows.map((row) => [idString(row.doc._id), survivorScore(row)])),
  });

  return { collection: group.collection, survivorId: idString(survivor._id), mergedIds, collisionType, indexScope: group.indexScope, referenceUpdates };
}

async function dryRunPlan(db) {
  const collisions = await allStrictUniqueCollisions(db);
  const byIndex = {};
  const samplePlans = [];
  for (const group of collisions) {
    const indexDef = REQUIRED_INDEXES.find((idx) => idx.name === group.indexName);
    const rows = await docsWithRefCounts(db, group.collection, group.docs);
    const survivorRow = chooseSurvivor(rows);
    const collisionType = classifyCollision(group, indexDef);
    byIndex[group.indexName] = (byIndex[group.indexName] || 0) + 1;
    if (samplePlans.length < 100) {
      samplePlans.push({
        collection: group.collection,
        indexName: group.indexName,
        indexScope: group.indexScope,
        collisionType,
        survivorId: idString(survivorRow.doc._id),
        mergedIds: rows.filter((row) => idString(row.doc._id) !== idString(survivorRow.doc._id)).map((row) => idString(row.doc._id)),
        refCounts: Object.fromEntries(rows.map((row) => [idString(row.doc._id), row.refs.total])),
      });
    }
  }
  return { strictUniqueCollisions: collisions.length, byIndex, samplePlans };
}

async function applyRemediation(db) {
  const actions = [];
  for (let i = 0; i < maxIterations; i += 1) {
    const collisions = await allStrictUniqueCollisions(db);
    if (collisions.length === 0) {
      return { iterations: i, strictUniqueCollisions: 0, actions };
    }
    const group = collisions[0];
    const indexDef = REQUIRED_INDEXES.find((idx) => idx.name === group.indexName);
    actions.push(await remediateGroup(db, group, indexDef));
  }
  const remaining = await allStrictUniqueCollisions(db);
  return { iterations: maxIterations, strictUniqueCollisions: remaining.length, actions, stopped: 'max-iterations' };
}

async function rollback(db) {
  const snapshots = await db.collection(SNAPSHOTS).find({ runId: rollbackRunId }).toArray();
  for (const snapshot of snapshots.reverse()) {
    await db.collection(snapshot.collection).replaceOne(
      { _id: snapshot.originalDoc._id },
      snapshot.originalDoc,
      { upsert: true }
    );
  }
  await db.collection(LEDGER).insertOne({
    runId: rollbackRunId,
    rollbackRunId: runId,
    timestamp: new Date(),
    applied: true,
    collection: '*',
    survivorId: null,
    mergedIds: [],
    collisionType: 'rollback',
    indexScope: null,
    restoredSnapshots: snapshots.length,
  });
  return { restoredSnapshots: snapshots.length };
}

async function main() {
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
  await client.connect();
  const db = client.db();

  try {
    await ensureMetaIndexes(db);
    if (rollbackRunId) {
      const result = await rollback(db);
      console.log(JSON.stringify({ runId, mode: 'rollback', rollbackRunId, db: db.databaseName, result }, null, 2));
      return;
    }

    const before = await dryRunPlan(db);
    const result = apply ? await applyRemediation(db) : before;
    const after = apply ? await dryRunPlan(db) : before;
    console.log(JSON.stringify({
      runId,
      mode: apply ? 'apply' : 'dry-run',
      db: db.databaseName,
      targetDb,
      before,
      result,
      after,
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[catalog-strict-collision-remediation] failed:', error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
