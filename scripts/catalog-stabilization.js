#!/usr/bin/env node
'use strict';

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/user/.env') });

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const apply = args.has('--apply');
const includeDuplicates = args.has('--include-duplicates');
const rollbackRunId = getArg('--rollback-run-id');
const targetDb = getArg('--db', 'admin');
const runId = getArg('--run-id', `catalog-stabilization-${new Date().toISOString().replace(/[:.]/g, '-')}`);

const mongoUri = targetDb === 'user'
  ? process.env.MONGODB_URI
  : process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('[catalog-stabilization] Missing MongoDB URI for selected db.');
  process.exit(1);
}

const ALL_CATALOG_COLLECTIONS = ['categories', 'brands', 'models', 'screensizes', 'servicetypes', 'spareparts'];
const CATALOG_COLLECTIONS = ALL_CATALOG_COLLECTIONS;
const LEDGER = 'catalog_migration_ledger';
const SNAPSHOTS = 'catalog_migration_snapshots';
const ID_MAP = 'catalog_id_mapping_ledger';
const DUPLICATE_SURVIVOR_LEDGER = 'catalog_duplicate_survivor_ledger';
const ORPHAN_REPAIR_LEDGER = 'catalog_orphan_repair_ledger';
const QUARANTINE_ACTOR = 'system:catalog-stabilization';
const ALLOWED_STATUS = new Set(['live', 'inactive', 'deleted']);
const POLLUTION_PATTERNS = [
  /<script[\s>]/i,
  /<\/?[a-z][\s\S]*>/i,
  /error type/i,
  /error message/i,
  /build output/i,
  /next\.js version/i,
  /stack trace/i,
  /console error/i,
  /at\s+[\w$.<>]+\s*\([^)]*:\d+:\d+\)/i,
  /webpack|turbopack|vite/i,
];
const PRODUCTION_READ_FILTER = {
  quarantined: { $ne: true },
  orphanQuarantined: { $ne: true },
  isDeleted: { $ne: true },
};

const REF_RULES = {
  categories: [
    { collection: 'brands', field: 'categoryIds', array: true },
    { collection: 'models', field: 'categoryIds', array: true },
    { collection: 'servicetypes', field: 'categoryIds', array: true },
    { collection: 'spareparts', field: 'categoryIds', array: true },
    { collection: 'ads', field: 'categoryId' },
    { collection: 'catalog_requests', field: 'categoryId' },
    { collection: 'smartalerts', field: 'criteria.categoryId' },
  ],
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
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};

const toObjectId = (value) => new mongoose.Types.ObjectId(idString(value));
const isObjectId = (value) => Boolean(idString(value)) && mongoose.Types.ObjectId.isValid(idString(value));
const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const slugify = (value) => normalizeName(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const hasPollution = (value) => typeof value === 'string' && POLLUTION_PATTERNS.some((pattern) => pattern.test(value));
const isMissing = (value) => value === undefined || value === null || value === '';
const hasUsableArray = (value) => Array.isArray(value) && value.length > 0;
const stableHash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function collectionExists(db, name) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

async function ensureMetaIndexes(db) {
  if (!apply && !rollbackRunId) return;
  await db.collection(LEDGER).createIndex({ runId: 1, collection: 1, sourceId: 1, repairType: 1 });
  await db.collection(SNAPSHOTS).createIndex({ runId: 1, collection: 1, sourceId: 1 }, { unique: true });
  await db.collection(ID_MAP).createIndex({ runId: 1, collection: 1, userDbId: 1, adminDbId: 1 });
  await db.collection(DUPLICATE_SURVIVOR_LEDGER).createIndex({ runId: 1, collection: 1, duplicateId: 1, survivorId: 1 });
  await db.collection(ORPHAN_REPAIR_LEDGER).createIndex({ runId: 1, collection: 1, orphanId: 1, oldReference: 1 });
}

async function snapshotDoc(db, collection, doc) {
  if (!apply || !doc) return;
  await db.collection(SNAPSHOTS).updateOne(
    { runId, collection, sourceId: idString(doc._id) },
    {
      $setOnInsert: {
        runId,
        collection,
        sourceId: idString(doc._id),
        originalDoc: doc,
        originalHash: stableHash(doc),
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

async function writeLedger(db, entry) {
  const doc = {
    runId,
    timestamp: new Date(),
    applied: apply,
    ...entry,
  };
  if (apply) await db.collection(LEDGER).insertOne(doc);
  return doc;
}

async function writeNamedLedger(db, collectionName, entry) {
  const doc = {
    runId,
    timestamp: new Date(),
    applied: apply,
    ...entry,
  };
  if (apply) await db.collection(collectionName).insertOne(doc);
  return doc;
}

async function updateWithSnapshot(db, collection, filter, update, ledger) {
  const docs = await db.collection(collection).find(filter).toArray();
  for (const doc of docs) await snapshotDoc(db, collection, doc);
  if (apply && docs.length > 0) await db.collection(collection).updateMany(filter, update);
  await writeLedger(db, {
    collection,
    sourceId: ledger.sourceId || null,
    targetId: ledger.targetId || null,
    repairType: ledger.repairType,
    affectedCount: docs.length,
    details: ledger.details || {},
  });
  return docs.length;
}

async function validIdSet(db, collectionName) {
  if (!(await collectionExists(db, collectionName))) return new Set();
  const docs = await db.collection(collectionName).find({}, { projection: { _id: 1 } }).toArray();
  return new Set(docs.map((doc) => idString(doc._id)));
}

async function quarantinePollution(db) {
  const fields = ['name', 'displayName', 'canonicalName', 'slug', 'description', 'rejectionReason'];
  const summary = {};
  for (const collection of ALL_CATALOG_COLLECTIONS) {
    if (!(await collectionExists(db, collection))) continue;
    const docs = await db.collection(collection).find(PRODUCTION_READ_FILTER).toArray();
    const polluted = docs.filter((doc) => fields.some((field) => hasPollution(doc[field])));
    summary[collection] = polluted.length;
    for (const doc of polluted) {
      const pollutedFields = fields.filter((field) => hasPollution(doc[field]));
      await updateWithSnapshot(
        db,
        collection,
        { _id: doc._id, quarantined: { $ne: true } },
        {
          $set: {
            quarantined: true,
            quarantineReason: 'catalog-text-pollution',
            quarantineFields: pollutedFields,
            quarantineRunId: runId,
            isActive: false,
            isDeleted: true,
            status: 'deleted',
            deletedAt: new Date(),
            deletedBy: QUARANTINE_ACTOR,
          },
        },
        {
          sourceId: idString(doc._id),
          repairType: 'pollution-quarantine',
          details: { pollutedFields },
        }
      );
    }
  }
  return summary;
}

function buildGovernancePatch(doc, collection, validCategories) {
  const name = doc.displayName || doc.name || doc.canonicalName || doc.slug;
  if (!name || hasPollution(name)) return null;
  const patch = {};
  if (isMissing(doc.displayName)) patch.displayName = String(name).trim();
  if (isMissing(doc.canonicalName)) patch.canonicalName = normalizeName(name);
  if (isMissing(doc.slug)) patch.slug = slugify(name) || `catalog-${idString(doc._id)}`;
  if (!ALLOWED_STATUS.has(String(doc.status))) {
    const legacyStatus = String(doc.status || '').toLowerCase();
    patch.status = doc.isDeleted === true
      ? 'deleted'
      : legacyStatus === 'pending' || legacyStatus === 'rejected' || doc.isActive === false
        ? 'inactive'
        : 'live';
  }
  if (isMissing(doc.isDeleted)) patch.isDeleted = false;
  if (!Object.prototype.hasOwnProperty.call(doc, 'deletedAt')) patch.deletedAt = null;
  if (!Object.prototype.hasOwnProperty.call(doc, 'deletedBy')) patch.deletedBy = null;

  if ((collection === 'brands' || collection === 'models' || collection === 'servicetypes' || collection === 'spareparts') && !hasUsableArray(doc.categoryIds)) {
    const candidates = [];
    if (isObjectId(doc.categoryId)) candidates.push(toObjectId(doc.categoryId));
    const validCandidates = candidates.filter((id) => validCategories.has(idString(id)));
    if (validCandidates.length > 0) {
      patch.categoryIds = validCandidates;
    } else if (collection === 'servicetypes' || collection === 'spareparts') {
      patch.needsReview = true;
      patch.isActive = false;
      patch.status = 'inactive';
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

async function backfillGovernanceFields(db) {
  const validCategories = await validIdSet(db, 'categories');
  const summary = {};
  for (const collection of CATALOG_COLLECTIONS) {
    if (!(await collectionExists(db, collection))) continue;
    const docs = await db.collection(collection).find(PRODUCTION_READ_FILTER).toArray();
    let planned = 0;
    for (const doc of docs) {
      const patch = buildGovernancePatch(doc, collection, validCategories);
      if (!patch) continue;
      planned += 1;
      await updateWithSnapshot(
        db,
        collection,
        { _id: doc._id },
        { $set: patch },
        {
          sourceId: idString(doc._id),
          repairType: 'governance-field-backfill',
          details: { fields: Object.keys(patch) },
        }
      );
    }
    summary[collection] = planned;
  }
  return summary;
}

async function classifyOrphans(db) {
  const valid = {};
  for (const collection of ALL_CATALOG_COLLECTIONS) valid[collection] = await validIdSet(db, collection);
  const findings = [];
  const rules = {
    models: [{ field: 'brandId', target: 'brands' }, { field: 'categoryIds', target: 'categories', array: true }],
    spareparts: [
      { field: 'categoryIds', target: 'categories', array: true },
      { field: 'brandId', target: 'brands', optional: true },
      { field: 'modelId', target: 'models', optional: true },
    ],
    brands: [{ field: 'categoryIds', target: 'categories', array: true }],
    servicetypes: [{ field: 'categoryIds', target: 'categories', array: true }],
    screensizes: [{ field: 'categoryId', target: 'categories' }, { field: 'brandId', target: 'brands', optional: true }],
  };

  for (const [collection, collectionRules] of Object.entries(rules)) {
    if (!(await collectionExists(db, collection))) continue;
    const docs = await db.collection(collection).find(PRODUCTION_READ_FILTER).toArray();
    for (const doc of docs) {
      for (const rule of collectionRules) {
        const rawValues = rule.array ? (Array.isArray(doc[rule.field]) ? doc[rule.field] : []) : [doc[rule.field]];
        const invalidIds = rawValues.map(idString).filter((id) => id && !valid[rule.target].has(id));
        if (invalidIds.length === 0) continue;
        const validRemaining = rawValues.map(idString).filter((id) => id && valid[rule.target].has(id));
        const classification = rule.array && validRemaining.length > 0 ? 'recoverable' : 'quarantine-required';
        findings.push({
          collection,
          sourceId: idString(doc._id),
          name: doc.name,
          field: rule.field,
          target: rule.target,
          invalidIds,
          classification,
        });
      }
    }
  }
  return findings;
}

async function repairOrphans(db) {
  const deprecatedParentRepair = await repairDeprecatedCategoryReferences(db);
  const findings = await classifyOrphans(db);
  const summary = { recoverable: 0, mergeable: 0, quarantineRequired: 0, repaired: 0, quarantined: 0 };

  for (const finding of findings) {
    if (finding.classification === 'recoverable') {
      summary.recoverable += 1;
      const invalidObjectIds = finding.invalidIds.filter(isObjectId).map(toObjectId);
      await updateWithSnapshot(
        db,
        finding.collection,
        { _id: toObjectId(finding.sourceId) },
        { $pull: { [finding.field]: { $in: invalidObjectIds } } },
        {
          sourceId: finding.sourceId,
          repairType: 'orphan-reference-pull-invalid',
          details: { ...finding, deprecatedParentRepair },
        }
      );
      for (const invalidId of finding.invalidIds) {
        await writeNamedLedger(db, ORPHAN_REPAIR_LEDGER, {
          orphanId: finding.sourceId,
          oldReference: invalidId,
          newReference: null,
          repairType: 'recoverable-pull-invalid',
          collection: finding.collection,
          field: finding.field,
        });
      }
      summary.repaired += 1;
      continue;
    }

    summary.quarantineRequired += 1;
    await updateWithSnapshot(
      db,
      finding.collection,
      { _id: toObjectId(finding.sourceId), orphanQuarantined: { $ne: true } },
      {
        $set: {
          orphanQuarantined: true,
          orphanReason: `${finding.field}->${finding.target}`,
          orphanInvalidIds: finding.invalidIds,
          needsReview: true,
          isActive: false,
          status: 'inactive',
          quarantineRunId: runId,
        },
      },
      {
        sourceId: finding.sourceId,
        repairType: 'orphan-quarantine-required',
        details: finding,
      }
    );
    for (const invalidId of finding.invalidIds) {
      await writeNamedLedger(db, ORPHAN_REPAIR_LEDGER, {
        orphanId: finding.sourceId,
        oldReference: invalidId,
        newReference: null,
        repairType: 'quarantine-required',
        collection: finding.collection,
        field: finding.field,
      });
    }
    summary.quarantined += 1;
  }

  return { deprecatedParentRepair, summary, findings };
}

async function findCanonicalSurvivor(db, collection, doc) {
  const canonicalName = normalizeName(doc.canonicalName || doc.name);
  const slug = doc.slug ? String(doc.slug).trim().toLowerCase() : null;
  const query = {
    _id: { $ne: doc._id },
    isDeleted: { $ne: true },
    quarantined: { $ne: true },
    orphanQuarantined: { $ne: true },
    status: 'live',
    $or: [
      ...(canonicalName ? [{ canonicalName }] : []),
      ...(slug ? [{ slug }] : []),
      ...(doc.name ? [{ name: doc.name }] : []),
    ],
  };
  if (query.$or.length === 0) return null;
  const candidates = await db.collection(collection).find(query).toArray();
  if (candidates.length === 0) return null;
  return chooseSurvivor(candidates);
}

async function repairDeprecatedCategoryReferences(db) {
  if (!(await collectionExists(db, 'categories'))) return { candidates: 0, repairedReferences: 0 };
  const deprecatedCategories = await db.collection('categories').find({
    isDeleted: true,
    $or: [{ canonicalName: { $type: 'string' } }, { slug: { $type: 'string' } }, { name: { $type: 'string' } }],
  }).toArray();

  let repairedReferences = 0;
  let candidates = 0;
  for (const deprecated of deprecatedCategories) {
    const survivor = await findCanonicalSurvivor(db, 'categories', deprecated);
    if (!survivor) continue;
    candidates += 1;
    const sourceId = idString(deprecated._id);
    const targetId = idString(survivor._id);
    const before = await referenceCountFor(db, 'categories', deprecated._id);
    repairedReferences += await migrateReferences(db, 'categories', deprecated._id, survivor._id);
    await writeNamedLedger(db, ORPHAN_REPAIR_LEDGER, {
      orphanId: sourceId,
      oldReference: sourceId,
      newReference: targetId,
      repairType: 'deprecated-parent',
      collection: 'categories',
      referenceCount: before.total,
      confidence: 'high',
    });
  }
  return { candidates, repairedReferences };
}

function duplicateScope(doc, collection) {
  if (collection === 'models') return `brand:${idString(doc.brandId) || 'none'}`;
  if (collection === 'brands' || collection === 'servicetypes' || collection === 'spareparts') {
    const categoryIds = Array.isArray(doc.categoryIds) ? doc.categoryIds.map(idString).filter(Boolean).sort() : [];
    return `categories:${categoryIds.join(',') || 'none'}`;
  }
  if (collection === 'screensizes') return `category:${idString(doc.categoryId) || 'none'}:brand:${idString(doc.brandId) || 'none'}`;
  return 'global';
}

async function duplicateGroups(db) {
  const groups = [];
  for (const collection of ALL_CATALOG_COLLECTIONS) {
    if (!(await collectionExists(db, collection))) continue;
    const docs = await db.collection(collection).find({ isDeleted: { $ne: true }, quarantined: { $ne: true } }).toArray();
    const byKey = new Map();
    for (const doc of docs) {
      const name = normalizeName(doc.canonicalName || doc.name);
      if (!name) continue;
      const key = `${name}|${duplicateScope(doc, collection)}`;
      const bucket = byKey.get(key) || [];
      bucket.push(doc);
      byKey.set(key, bucket);
    }
    for (const [key, bucket] of byKey.entries()) {
      if (bucket.length > 1) groups.push({ collection, key, docs: bucket });
    }
  }
  return groups;
}

function chooseSurvivor(docs) {
  return [...docs].sort((a, b) => {
    const score = (doc) =>
      (doc.status === 'live' ? 100 : 0) +
      (doc.isActive !== false ? 20 : 0) +
      (doc.canonicalName ? 10 : 0) +
      (doc.slug ? 5 : 0);
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return String(a.createdAt || a._id).localeCompare(String(b.createdAt || b._id));
  })[0];
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

function mergeArrayValues(...arrays) {
  const seen = new Map();
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const value of arr) {
      const key = idString(value) || String(value);
      if (!key || seen.has(key)) continue;
      seen.set(key, value);
    }
  }
  return Array.from(seen.values());
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
    affected += await updateWithSnapshot(db, rule.collection, filter, update, {
      sourceId,
      targetId,
      repairType: `reference-migrate:${sourceCollection}`,
      details: { field: rule.field },
    });
  }
  return affected;
}

async function repairDuplicates(db) {
  const groups = await duplicateGroups(db);
  const summary = { groups: groups.length, merged: 0, skipped: includeDuplicates ? 0 : groups.length, referenceUpdates: 0 };
  if (!includeDuplicates) return { summary, groups: groups.map((group) => ({ collection: group.collection, key: group.key, ids: group.docs.map((doc) => idString(doc._id)) })) };

  for (const group of groups) {
    const docsWithRefs = [];
    for (const doc of group.docs) {
      docsWithRefs.push({ doc, refs: await referenceCountFor(db, group.collection, doc._id) });
    }
    const survivor = [...docsWithRefs].sort((a, b) => {
      const refDiff = b.refs.total - a.refs.total;
      if (refDiff !== 0) return refDiff;
      return idString(chooseSurvivor([a.doc, b.doc])._id) === idString(a.doc._id) ? -1 : 1;
    })[0].doc;
    const deprecated = group.docs.filter((doc) => idString(doc._id) !== idString(survivor._id));
    for (const doc of deprecated) {
      const referenceCount = await referenceCountFor(db, group.collection, doc._id);
      const migratedReferences = await migrateReferences(db, group.collection, doc._id, survivor._id);
      summary.referenceUpdates += migratedReferences;
      const aliases = Array.from(new Set([...(survivor.aliases || []), ...(doc.aliases || []), doc.name, doc.displayName, doc.canonicalName].filter(Boolean).map(String)));
      const categoryIds = mergeArrayValues(survivor.categoryIds, doc.categoryIds);
      const survivorPatch = { aliases };
      if (categoryIds.length > 0) survivorPatch.categoryIds = categoryIds;
      await updateWithSnapshot(db, group.collection, { _id: survivor._id }, { $set: survivorPatch }, {
        sourceId: idString(survivor._id),
        targetId: idString(doc._id),
        repairType: 'duplicate-metadata-merge',
        details: { deprecatedId: idString(doc._id), mergedFields: Object.keys(survivorPatch) },
      });
      await updateWithSnapshot(db, group.collection, { _id: doc._id }, {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: QUARANTINE_ACTOR,
          isActive: false,
          status: 'deleted',
          duplicateOf: survivor._id,
          deprecatedBy: survivor._id,
          duplicateRepairRunId: runId,
        },
      }, {
        sourceId: idString(doc._id),
        targetId: idString(survivor._id),
        repairType: 'duplicate-soft-delete',
      });
      await writeNamedLedger(db, DUPLICATE_SURVIVOR_LEDGER, {
        duplicateId: idString(doc._id),
        survivorId: idString(survivor._id),
        collection: group.collection,
        canonicalName: doc.canonicalName || normalizeName(doc.name),
        migrationStatus: apply ? 'applied' : 'dry-run',
        referenceCount: referenceCount.total,
        referenceBreakdown: referenceCount.counts,
        migratedReferences,
      });
      summary.merged += 1;
    }
  }
  return { summary };
}

async function prepareIdMappingLedger(db) {
  const summary = {};
  for (const collection of ALL_CATALOG_COLLECTIONS) {
    if (!(await collectionExists(db, collection))) continue;
    const docs = await db.collection(collection).find({}, { projection: { _id: 1, canonicalName: 1, name: 1, status: 1 } }).toArray();
    summary[collection] = docs.length;
    if (!apply) continue;
    for (const doc of docs) {
      await db.collection(ID_MAP).updateOne(
        { runId, collection, adminDbId: idString(doc._id) },
        {
          $setOnInsert: {
            runId,
            userDbId: null,
            adminDbId: idString(doc._id),
            collection,
            canonicalName: doc.canonicalName || normalizeName(doc.name),
            migrationStatus: 'admin-catalog-not-cut-over',
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }
  return summary;
}

async function indexReadiness(db) {
  const duplicatePlan = await duplicateGroups(db);
  const orphans = await classifyOrphans(db);
  return {
    ready: duplicatePlan.length === 0 && orphans.length === 0,
    duplicateGroups: duplicatePlan.length,
    orphanFindings: orphans.length,
    requiredIndexes: {
      brands: { canonicalName: 1, categoryIds: 1 },
      models: { canonicalName: 1, brandId: 1 },
      servicetypes: { canonicalName: 1, categoryIds: 1 },
      spareparts: { canonicalName: 1, categoryIds: 1 },
    },
  };
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
    timestamp: new Date(),
    applied: true,
    collection: '*',
    sourceId: null,
    targetId: null,
    repairType: 'rollback',
    affectedCount: snapshots.length,
  });
  return { restoredSnapshots: snapshots.length };
}

async function main() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
  const db = mongoose.connection.db;
  await ensureMetaIndexes(db);

  if (rollbackRunId) {
    const result = await rollback(db);
    console.log(JSON.stringify({ mode: 'rollback', database: db.databaseName, rollbackRunId, result }, null, 2));
    return;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runId,
    database: db.databaseName,
    targetDb,
    mode: apply ? 'apply' : 'dry-run',
    includeDuplicates,
    phases: {
      pollutionQuarantine: await quarantinePollution(db),
      governanceBackfill: await backfillGovernanceFields(db),
      orphanRepair: await repairOrphans(db),
      duplicateRepair: await repairDuplicates(db),
      migrationPreparation: await prepareIdMappingLedger(db),
      indexReadiness: await indexReadiness(db),
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('[catalog-stabilization] failed:', error instanceof Error ? error.stack || error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
