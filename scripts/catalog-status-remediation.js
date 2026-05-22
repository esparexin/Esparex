#!/usr/bin/env node
'use strict';

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/user/.env') });

const argv = process.argv.slice(2);
const args = new Set(argv);
const getArg = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const apply = args.has('--apply');
const runId = getArg('--run-id', `catalog-status-remediation-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const targetDb = getArg('--db', 'admin');
const uri = targetDb === 'user'
  ? process.env.MONGODB_URI
  : process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (apply && process.env.CATALOG_STATUS_REMEDIATION_ALLOW_APPLY !== 'true') {
  console.error('[catalog-status-remediation] apply blocked. Set CATALOG_STATUS_REMEDIATION_ALLOW_APPLY=true for non-production rehearsals only.');
  process.exit(1);
}
if (!uri) {
  console.error('[catalog-status-remediation] missing MongoDB URI.');
  process.exit(1);
}

const COLLECTIONS = ['categories', 'brands', 'models', 'screensizes', 'servicetypes', 'spareparts'];
const ALLOWED = new Set(['live', 'inactive', 'deleted']);
const SNAPSHOTS = 'catalog_status_remediation_snapshots';
const LEDGER = 'catalog_status_remediation_ledger';

const idString = (value) => {
  if (!value) return '';
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};
const stableHash = (value) => crypto.createHash('sha256').update(JSON.stringify(value, Object.keys(value).sort())).digest('hex');
const deriveStatus = (doc) => {
  if (doc.isDeleted === true || doc.deletedAt) return 'deleted';
  if (doc.isActive === false) return 'inactive';
  return 'live';
};

async function collectionExists(db, name) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
  const db = mongoose.connection.db;
  if (apply) {
    await db.collection(SNAPSHOTS).createIndex({ runId: 1, collection: 1, documentId: 1 }, { unique: true });
    await db.collection(LEDGER).createIndex({ runId: 1, collection: 1, documentId: 1 });
  }

  const summaries = [];
  for (const collection of COLLECTIONS) {
    if (!(await collectionExists(db, collection))) {
      summaries.push({ collection, exists: false, invalid: 0, repaired: 0, samples: [] });
      continue;
    }
    const rows = await db.collection(collection).find({
      quarantined: { $ne: true },
      orphanQuarantined: { $ne: true },
      isDeleted: { $ne: true },
      status: { $nin: Array.from(ALLOWED) },
    }).toArray();
    const summary = { collection, exists: true, invalid: rows.length, repaired: 0, samples: [] };
    for (const doc of rows) {
      const newStatus = deriveStatus(doc);
      summary.samples.push({
        documentId: idString(doc._id),
        name: doc.name,
        oldStatus: doc.status,
        newStatus,
        isActive: doc.isActive,
        approvalStatus: doc.approvalStatus,
      });
      if (apply) {
        await db.collection(SNAPSHOTS).updateOne(
          { runId, collection, documentId: idString(doc._id) },
          {
            $setOnInsert: {
              runId,
              collection,
              documentId: idString(doc._id),
              original: doc,
              originalHash: stableHash(doc),
              timestamp: new Date(),
            },
          },
          { upsert: true }
        );
        await db.collection(collection).updateOne(
          { _id: doc._id },
          { $set: { status: newStatus, statusRemediationRunId: runId, statusRemediatedAt: new Date() } }
        );
        await db.collection(LEDGER).insertOne({
          runId,
          collection,
          documentId: idString(doc._id),
          oldStatus: doc.status,
          newStatus,
          timestamp: new Date(),
        });
        summary.repaired += 1;
      }
    }
    summary.samples = summary.samples.slice(0, 20);
    summaries.push(summary);
  }

  console.log(JSON.stringify({
    runId,
    mode: apply ? 'apply' : 'dry-run',
    db: db.databaseName,
    targetDb,
    summaries,
    totals: summaries.reduce((acc, item) => {
      acc.invalid += item.invalid || 0;
      acc.repaired += item.repaired || 0;
      return acc;
    }, { invalid: 0, repaired: 0 }),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('[catalog-status-remediation] failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
