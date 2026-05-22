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
const runId = getArg('--run-id', `catalog-null-canonical-remediation-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const targetDb = getArg('--db', 'admin');

if (apply && process.env.CATALOG_NULL_REMEDIATION_ALLOW_APPLY !== 'true') {
  console.error('[catalog-null-canonical-remediation] apply blocked. Set CATALOG_NULL_REMEDIATION_ALLOW_APPLY=true for non-production rehearsals only.');
  process.exit(1);
}

const mongoUri = targetDb === 'user'
  ? process.env.MONGODB_URI
  : process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('[catalog-null-canonical-remediation] missing MongoDB URI.');
  process.exit(1);
}

const COLLECTIONS = ['brands', 'models', 'screensizes', 'servicetypes', 'spareparts', 'categories'];
const LEDGER = 'catalog_null_canonical_remediation_ledger';
const SNAPSHOTS = 'catalog_null_canonical_remediation_snapshots';
const SUMMARY = 'catalog_null_canonical_remediation_summary';
const QUARANTINE_ACTOR = 'system:catalog-null-canonical-remediation';

const idString = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const now = () => new Date();
const stableHash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const isMissing = (value) => value === null || value === undefined || String(value).trim() === '';

async function collectionExists(db, name) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

async function ensureMetaIndexes(db) {
  if (!apply) return;
  await db.collection(LEDGER).createIndex({ runId: 1, collection: 1, documentId: 1 });
  await db.collection(SNAPSHOTS).createIndex({ runId: 1, collection: 1, documentId: 1 }, { unique: true });
  await db.collection(SUMMARY).createIndex({ runId: 1, collection: 1 }, { unique: true });
}

function classify(doc) {
  const statusMissing = isMissing(doc.status);
  const canonicalMissing = isMissing(doc.canonicalName);
  const slugMissing = isMissing(doc.slug);
  const seed = doc.displayName || doc.name || doc.canonicalName || doc.slug;
  if (!canonicalMissing && !slugMissing && !statusMissing) return { type: 'normalization-safe', seed };
  if (seed && normalize(seed)) return { type: 'recoverable', seed };
  return { type: 'quarantine-required', seed: null };
}

function derivePatch(doc, seed) {
  const patch = {};
  if (isMissing(doc.canonicalName) && seed) patch.canonicalName = normalize(seed);
  if (isMissing(doc.slug) && seed) patch.slug = slugify(seed) || `catalog-${idString(doc._id)}`;
  if (isMissing(doc.status)) {
    patch.status = doc.isDeleted === true ? 'deleted' : doc.isActive === false ? 'inactive' : 'live';
  }
  return patch;
}

async function snapshot(db, collection, doc) {
  if (!apply) return;
  await db.collection(SNAPSHOTS).updateOne(
    { runId, collection, documentId: idString(doc._id) },
    {
      $setOnInsert: {
        runId,
        collection,
        documentId: idString(doc._id),
        original: doc,
        originalHash: stableHash(doc),
        timestamp: now(),
      },
    },
    { upsert: true }
  );
}

async function writeLedger(db, entry) {
  if (!apply) return;
  await db.collection(LEDGER).insertOne({
    runId,
    timestamp: now(),
    ...entry,
  });
}

async function remediateCollection(db, collection) {
  if (!(await collectionExists(db, collection))) {
    return { collection, exists: false, scanned: 0, recoverable: 0, normalizationSafe: 0, quarantineRequired: 0, repaired: 0, quarantined: 0 };
  }

  const cursor = db.collection(collection).find({
    $or: [{ canonicalName: null }, { canonicalName: '' }, { canonicalName: { $exists: false } }, { slug: null }, { slug: '' }, { slug: { $exists: false } }, { status: null }, { status: '' }, { status: { $exists: false } }],
  });

  const summary = { collection, exists: true, scanned: 0, recoverable: 0, normalizationSafe: 0, quarantineRequired: 0, repaired: 0, quarantined: 0 };
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    summary.scanned += 1;
    const oldCanonical = doc.canonicalName ?? null;
    const oldSlug = doc.slug ?? null;
    const oldStatus = doc.status ?? null;
    const classification = classify(doc);
    if (classification.type === 'normalization-safe') summary.normalizationSafe += 1;
    if (classification.type === 'recoverable') summary.recoverable += 1;
    if (classification.type === 'quarantine-required') summary.quarantineRequired += 1;

    if (classification.type === 'recoverable') {
      const patch = derivePatch(doc, classification.seed);
      if (Object.keys(patch).length > 0) {
        if (apply) {
          await snapshot(db, collection, doc);
          await db.collection(collection).updateOne({ _id: doc._id }, { $set: patch });
        }
        await writeLedger(db, {
          collection,
          documentId: idString(doc._id),
          oldCanonical,
          newCanonical: patch.canonicalName ?? oldCanonical,
          repairType: 'recoverable',
          oldSlug,
          newSlug: patch.slug ?? oldSlug,
          oldStatus,
          newStatus: patch.status ?? oldStatus,
        });
        summary.repaired += 1;
      }
      continue;
    }

    if (classification.type === 'quarantine-required') {
      if (apply) {
        await snapshot(db, collection, doc);
        await db.collection(collection).updateOne(
          { _id: doc._id },
          {
            $set: {
              quarantined: true,
              quarantineReason: 'null-canonical-unrecoverable',
              quarantineRunId: runId,
              isActive: false,
              status: 'inactive',
              quarantinedAt: now(),
              quarantinedBy: QUARANTINE_ACTOR,
            },
          }
        );
      }
      await writeLedger(db, {
        collection,
        documentId: idString(doc._id),
        oldCanonical,
        newCanonical: null,
        repairType: 'quarantine-required',
        oldSlug,
        newSlug: null,
        oldStatus,
        newStatus: 'inactive',
      });
      summary.quarantined += 1;
    }
  }

  if (apply) {
    await db.collection(SUMMARY).updateOne(
      { runId, collection },
      { $set: { ...summary, runId, timestamp: now() } },
      { upsert: true }
    );
  }

  return summary;
}

async function main() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
  const db = mongoose.connection.db;

  try {
    await ensureMetaIndexes(db);
    const summaries = [];
    for (const collection of COLLECTIONS) {
      summaries.push(await remediateCollection(db, collection));
    }

    const response = {
      runId,
      mode: apply ? 'apply' : 'dry-run',
      db: db.databaseName,
      summaries,
      totals: summaries.reduce((acc, item) => {
        acc.scanned += item.scanned;
        acc.recoverable += item.recoverable;
        acc.normalizationSafe += item.normalizationSafe;
        acc.quarantineRequired += item.quarantineRequired;
        acc.repaired += item.repaired;
        acc.quarantined += item.quarantined;
        return acc;
      }, { scanned: 0, recoverable: 0, normalizationSafe: 0, quarantineRequired: 0, repaired: 0, quarantined: 0 }),
    };
    console.log(JSON.stringify(response, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('[catalog-null-canonical-remediation] failed:', error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});

