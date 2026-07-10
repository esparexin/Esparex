#!/usr/bin/env node
'use strict';

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/api/.env') });

const argv = process.argv.slice(2);
const args = new Set(argv);
const getArg = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const apply = args.has('--apply');
const rollbackRunId = getArg('--rollback-run-id');
const runId = getArg('--run-id', `catalog-parity-convergence-${new Date().toISOString().replace(/[:.]/g, '-')}`);

if (apply && process.env.CATALOG_PARITY_CONVERGENCE_ALLOW_APPLY !== 'true') {
  console.error('[catalog-parity-convergence] apply blocked. Set CATALOG_PARITY_CONVERGENCE_ALLOW_APPLY=true for non-production rehearsals only.');
  process.exit(1);
}

const userUri = process.env.MONGODB_URI;
const adminUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (!userUri || !adminUri) {
  console.error('[catalog-parity-convergence] missing MongoDB URI.');
  process.exit(1);
}

const COLLECTIONS = ['categories', 'brands', 'models', 'screensizes', 'servicetypes', 'spareparts'];
const SNAPSHOTS = 'catalog_parity_convergence_snapshots';
const LEDGER = 'catalog_parity_convergence_ledger';
const ACTOR = 'system:catalog-parity-convergence';

const idString = (value) => {
  if (!value) return '';
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};

const stableSerialize = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId)) {
    const record = value;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value instanceof mongoose.Types.ObjectId ? value.toString() : value);
};

const stableHash = (value) => crypto.createHash('sha256').update(stableSerialize(value)).digest('hex');
const safeString = (value) => String(value ?? '').trim().toLowerCase();
const toIdList = (value) => {
  if (Array.isArray(value)) return value.map(idString).filter(Boolean).sort();
  const normalized = idString(value);
  return normalized ? [normalized] : [];
};

const shadowSignature = (doc) => ({
  canonicalName: safeString(doc.canonicalName ?? doc.name ?? doc.displayName),
  slug: safeString(doc.slug),
  status: safeString(doc.status),
  approvalStatus: safeString(doc.approvalStatus),
  isActive: Boolean(doc.isActive),
  isDeleted: Boolean(doc.isDeleted),
  categoryIds: toIdList(doc.categoryIds ?? doc.categoryId),
  brandId: idString(doc.brandId),
  modelId: idString(doc.modelId),
});

const publicQuery = {
  $and: [
    { isDeleted: { $ne: true } },
    { deletedAt: null },
    { isActive: { $ne: false } },
    { approvalStatus: 'approved' },
  ],
};

const normalizeDocForAdmin = (doc) => {
  const clone = { ...doc };
  delete clone.__v;
  clone.adminConvergenceSource = 'esparex_user';
  clone.adminConvergenceRunId = runId;
  clone.adminConvergedAt = new Date();
  return clone;
};

const diffDocs = (userDoc, adminDoc) => {
  if (!adminDoc) return { type: 'missing-record', critical: true };
  const userSig = shadowSignature(userDoc);
  const adminSig = shadowSignature(adminDoc);
  if (stableHash(userSig) === stableHash(adminSig)) return null;
  return {
    type: 'signature-drift',
    critical: true,
    userSignature: userSig,
    adminSignature: adminSig,
  };
};

async function connect(uri, name) {
  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 20000,
    maxPoolSize: 10,
  }).asPromise();
  if (!conn.db) throw new Error(`missing db for ${name}`);
  return conn;
}

async function collectionExists(db, name) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

async function ensureMetaIndexes(adminDb) {
  if (!apply) return;
  await adminDb.collection(SNAPSHOTS).createIndex({ runId: 1, collection: 1, documentId: 1 }, { unique: true });
  await adminDb.collection(LEDGER).createIndex({ runId: 1, collection: 1, documentId: 1 });
}

async function snapshot(adminDb, collection, doc, reason) {
  if (!apply || !doc) return;
  await adminDb.collection(SNAPSHOTS).updateOne(
    { runId, collection, documentId: idString(doc._id) },
    {
      $setOnInsert: {
        runId,
        collection,
        documentId: idString(doc._id),
        reason,
        original: doc,
        originalHash: stableHash(doc),
        timestamp: new Date(),
      },
    },
    { upsert: true }
  );
}

async function ledger(adminDb, entry) {
  if (!apply) return;
  await adminDb.collection(LEDGER).insertOne({
    runId,
    timestamp: new Date(),
    ...entry,
  });
}

async function rollback(adminDb) {
  const cursor = adminDb.collection(SNAPSHOTS).find({ runId: rollbackRunId });
  let restored = 0;
  while (await cursor.hasNext()) {
    const snapshotDoc = await cursor.next();
    if (!snapshotDoc?.collection || !snapshotDoc?.original?._id) continue;
    await adminDb.collection(snapshotDoc.collection).replaceOne(
      { _id: snapshotDoc.original._id },
      snapshotDoc.original,
      { upsert: true }
    );
    restored += 1;
  }
  return { rollbackRunId, restored };
}

async function reconcileCollection(userDb, adminDb, collection) {
  const exists = {
    user: await collectionExists(userDb, collection),
    admin: await collectionExists(adminDb, collection),
  };
  if (!exists.user) return { collection, exists, skipped: true };

  const userRows = await userDb.collection(collection).find(publicQuery).toArray();
  const adminRows = exists.admin ? await adminDb.collection(collection).find(publicQuery).toArray() : [];
  const adminById = new Map(adminRows.map((doc) => [idString(doc._id), doc]));
  const userIds = new Set(userRows.map((doc) => idString(doc._id)));

  const summary = {
    collection,
    exists,
    userPublicCount: userRows.length,
    adminPublicCount: adminRows.length,
    missingRecords: 0,
    signatureDrift: 0,
    staleAdminRecords: 0,
    reconciled: 0,
    quarantined: 0,
    criticalParityMismatches: 0,
    sampleMismatches: [],
  };

  for (const adminDoc of adminRows) {
    const documentId = idString(adminDoc._id);
    if (userIds.has(documentId)) continue;
    summary.staleAdminRecords += 1;
    summary.criticalParityMismatches += 1;
    if (summary.sampleMismatches.length < 20) {
      summary.sampleMismatches.push({
        documentId,
        type: 'stale-record',
        critical: true,
        adminSignature: shadowSignature(adminDoc),
      });
    }
    if (apply) {
      await snapshot(adminDb, collection, adminDoc, 'stale-record');
      await adminDb.collection(collection).updateOne(
        { _id: adminDoc._id },
        {
          $set: {
            isActive: false,
            isDeleted: true,
            status: 'deleted',
            parityQuarantined: true,
            parityQuarantineReason: 'admin-public-record-not-present-in-user-runtime-catalog',
            parityQuarantineRunId: runId,
            parityQuarantinedAt: new Date(),
            parityQuarantinedBy: ACTOR,
          },
        }
      );
      await ledger(adminDb, {
        collection,
        documentId,
        action: 'quarantine-admin-stale',
        mismatchType: 'stale-record',
        oldHash: stableHash(shadowSignature(adminDoc)),
        newHash: null,
      });
      summary.quarantined += 1;
    }
  }

  for (const userDoc of userRows) {
    const documentId = idString(userDoc._id);
    const adminDoc = adminById.get(documentId);
    const diff = diffDocs(userDoc, adminDoc);
    if (!diff) continue;

    if (diff.type === 'missing-record') summary.missingRecords += 1;
    if (diff.type === 'signature-drift') summary.signatureDrift += 1;
    summary.criticalParityMismatches += 1;
    if (summary.sampleMismatches.length < 20) {
      summary.sampleMismatches.push({ documentId, ...diff });
    }

    if (apply) {
      await snapshot(adminDb, collection, adminDoc, diff.type);
      await adminDb.collection(collection).replaceOne(
        { _id: userDoc._id },
        normalizeDocForAdmin(userDoc),
        { upsert: true }
      );
      await ledger(adminDb, {
        collection,
        documentId,
        action: adminDoc ? 'replace-from-user' : 'insert-from-user',
        mismatchType: diff.type,
        oldHash: adminDoc ? stableHash(shadowSignature(adminDoc)) : null,
        newHash: stableHash(shadowSignature(userDoc)),
      });
      summary.reconciled += 1;
    }
  }

  return summary;
}

async function main() {
  const adminConn = await connect(adminUri, 'admin');
  try {
    if (rollbackRunId) {
      const result = await rollback(adminConn.db);
      console.log(JSON.stringify({ mode: 'rollback', ...result }, null, 2));
      return;
    }

    const userConn = await connect(userUri, 'user');
    try {
      await ensureMetaIndexes(adminConn.db);
      const collections = [];
      for (const collection of COLLECTIONS) {
        collections.push(await reconcileCollection(userConn.db, adminConn.db, collection));
      }
      const totals = collections.reduce((acc, item) => {
        acc.userPublicCount += item.userPublicCount || 0;
        acc.adminPublicCount += item.adminPublicCount || 0;
        acc.missingRecords += item.missingRecords || 0;
        acc.signatureDrift += item.signatureDrift || 0;
        acc.staleAdminRecords += item.staleAdminRecords || 0;
        acc.reconciled += item.reconciled || 0;
        acc.quarantined += item.quarantined || 0;
        acc.criticalParityMismatches += item.criticalParityMismatches || 0;
        return acc;
      }, {
        userPublicCount: 0,
        adminPublicCount: 0,
        missingRecords: 0,
        signatureDrift: 0,
        staleAdminRecords: 0,
        reconciled: 0,
        quarantined: 0,
        criticalParityMismatches: 0,
      });

      console.log(JSON.stringify({
        runId,
        mode: apply ? 'apply' : 'dry-run',
        userDb: userConn.db.databaseName,
        adminDb: adminConn.db.databaseName,
        collections,
        totals,
      }, null, 2));
    } finally {
      await userConn.close();
    }
  } finally {
    await adminConn.close();
  }
}

main().catch((error) => {
  console.error('[catalog-parity-convergence] failed:', error);
  process.exit(1);
});
