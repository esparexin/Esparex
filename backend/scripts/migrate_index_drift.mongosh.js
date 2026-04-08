/*
 * One-shot production index migration for schema drift.
 *
 * Dry run:
 *   mongosh "$MONGODB_URI" backend/scripts/migrate_index_drift.mongosh.js
 *
 * Apply:
 *   APPLY=1 mongosh "$MONGODB_URI" backend/scripts/migrate_index_drift.mongosh.js
 *
 * Scope:
 * - creates missing chat/report/transaction indexes
 * - prechecks duplicate keys for unique report/conversation indexes
 * - replaces the legacy locations unique index only when the new key is safe
 * - creates the admin locations hint index used by adminLocationController
 */

const APPLY = ['1', 'true', 'yes'].includes(String(process?.env?.APPLY || '').toLowerCase());
const ACTIVE_REPORT_STATUSES = ['open', 'pending', 'reviewed'];

const LEGACY_LOCATION_UNIQUE_SPEC = {
  key: { name: 1, city: 1, state: 1, country: 1, level: 1 },
  options: {
    name: 'idx_location_unique_identity',
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
};

const CURRENT_LOCATION_UNIQUE_SPEC = {
  key: { name: 1, country: 1, level: 1, parentId: 1 },
  options: {
    name: 'idx_location_unique_identity',
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
};

const INDEX_SPECS = [
  {
    collection: 'conversations',
    key: { adId: 1, buyerId: 1 },
    options: { name: 'idx_conversation_ad_buyer_unique_idx', unique: true },
  },
  {
    collection: 'conversations',
    key: { sellerId: 1, lastMessageAt: -1 },
    options: { name: 'idx_conversation_seller_inbox_idx' },
  },
  {
    collection: 'conversations',
    key: { buyerId: 1, lastMessageAt: -1 },
    options: { name: 'idx_conversation_buyer_inbox_idx' },
  },
  {
    collection: 'conversations',
    key: { isBlocked: 1, updatedAt: -1 },
    options: { name: 'idx_conversation_blocked_moderation_idx' },
  },
  {
    collection: 'conversations',
    key: { isAdClosed: 1, updatedAt: -1 },
    options: { name: 'idx_conversation_adclosed_idx' },
  },
  {
    collection: 'chatmessages',
    key: { conversationId: 1, createdAt: -1 },
    options: { name: 'idx_chatmessage_conv_date_idx' },
  },
  {
    collection: 'chatmessages',
    key: { conversationId: 1, receiverId: 1, readAt: 1 },
    options: { name: 'idx_chatmessage_read_receipt_idx' },
  },
  {
    collection: 'chatmessages',
    key: { riskScore: -1, createdAt: -1 },
    options: { name: 'idx_chatmessage_risk_score_idx' },
  },
  {
    collection: 'chatreports',
    key: { status: 1, createdAt: -1 },
    options: { name: 'idx_chatreport_status_date_idx' },
  },
  {
    collection: 'chatreports',
    key: { conversationId: 1 },
    options: { name: 'idx_chatreport_conv_idx' },
  },
  {
    collection: 'chatreports',
    key: { conversationId: 1, reporterId: 1 },
    options: { name: 'idx_chatreport_conv_reporter_idx' },
  },
  {
    collection: 'chatreports',
    key: { reportedUserId: 1, status: 1 },
    options: { name: 'idx_chatreport_reporteduser_status_idx' },
  },
  {
    collection: 'reports',
    key: { targetType: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_report_targetType_status_createdAt_idx' },
  },
  {
    collection: 'reports',
    key: { targetId: 1, targetType: 1, status: 1 },
    options: { name: 'idx_report_targetId_targetType_status_idx' },
  },
  {
    collection: 'reports',
    key: { adId: 1, reportedBy: 1 },
    options: {
      name: 'idx_report_adId_reporter_dedup_idx',
      unique: true,
      partialFilterExpression: {
        status: { $in: ACTIVE_REPORT_STATUSES },
        adId: { $exists: true },
        reportedBy: { $exists: true },
      },
    },
  },
  {
    collection: 'reports',
    key: { targetType: 1, targetId: 1, reporterId: 1 },
    options: {
      name: 'idx_report_target_reporter_dedup_idx',
      unique: true,
      partialFilterExpression: {
        status: { $in: ACTIVE_REPORT_STATUSES },
        targetType: { $exists: true },
        targetId: { $exists: true },
        reporterId: { $exists: true },
      },
    },
  },
  {
    collection: 'transactions',
    key: { userId: 1, createdAt: -1 },
    options: { name: 'idx_transaction_userId_createdAt_desc' },
  },
  {
    collection: 'transactions',
    key: { userId: 1, planId: 1, status: 1, applied: 1, createdAt: -1 },
    options: { name: 'idx_transaction_pending_reuse_lookup' },
  },
  {
    collection: 'locations',
    key: { isActive: 1, createdAt: -1 },
    options: { name: 'idx_location_active_createdAt' },
  },
];

function normalizeForCompare(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = normalizeForCompare(value[key]);
    }
    return output;
  }
  return value;
}

function isEqual(a, b) {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

function extractIndexOptions(index) {
  const out = {};
  if (index.unique) out.unique = true;
  if (index.sparse) out.sparse = true;
  if (Object.prototype.hasOwnProperty.call(index, 'expireAfterSeconds')) {
    out.expireAfterSeconds = index.expireAfterSeconds;
  }
  if (Object.prototype.hasOwnProperty.call(index, 'partialFilterExpression')) {
    out.partialFilterExpression = index.partialFilterExpression;
  }
  if (Object.prototype.hasOwnProperty.call(index, 'collation')) {
    out.collation = index.collation;
  }
  return out;
}

function getCollection(name) {
  return db.getCollection(name);
}

function getIndexes(collectionName) {
  return getCollection(collectionName).getIndexes();
}

function findIndexByName(indexes, name) {
  return indexes.find((index) => index.name === name) || null;
}

function findEquivalentIndex(indexes, spec) {
  return indexes.find((index) => (
    isEqual(index.key, spec.key) &&
    isEqual(extractIndexOptions(index), extractIndexOptions(spec.options || {}))
  )) || null;
}

function renderSpec(spec) {
  return JSON.stringify({
    key: spec.key,
    options: spec.options || {},
  });
}

function ensureIndex(spec) {
  const collection = getCollection(spec.collection);
  const indexes = getIndexes(spec.collection);
  const namedIndex = findIndexByName(indexes, spec.options.name);

  if (namedIndex) {
    const namedSpecMatches = isEqual(namedIndex.key, spec.key) &&
      isEqual(extractIndexOptions(namedIndex), extractIndexOptions(spec.options));
    if (namedSpecMatches) {
      print(`[skip] ${spec.collection}.${spec.options.name} already matches`);
      return;
    }
    throw new Error(
      `Index name conflict on ${spec.collection}.${spec.options.name}. Existing=${renderSpec({ key: namedIndex.key, options: extractIndexOptions(namedIndex) })} expected=${renderSpec(spec)}`
    );
  }

  const equivalent = findEquivalentIndex(indexes, spec);
  if (equivalent) {
    print(`[skip] ${spec.collection}.${spec.options.name} equivalent index already exists as ${equivalent.name}`);
    return;
  }

  if (!APPLY) {
    print(`[plan] create ${spec.collection}.${spec.options.name} ${JSON.stringify(spec.key)}`);
    return;
  }

  collection.createIndex(spec.key, spec.options);
  print(`[done] created ${spec.collection}.${spec.options.name}`);
}

function aggregateToArray(collectionName, pipeline) {
  return getCollection(collectionName).aggregate(pipeline, { allowDiskUse: true }).toArray();
}

function printSection(title) {
  print(`\n=== ${title} ===`);
}

function precheckConversationDuplicates() {
  const duplicates = aggregateToArray('conversations', [
    {
      $group: {
        _id: { adId: '$adId', buyerId: '$buyerId' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
        '_id.adId': { $ne: null },
        '_id.buyerId': { $ne: null },
      },
    },
    {
      $project: {
        _id: 0,
        adId: { $toString: '$_id.adId' },
        buyerId: { $toString: '$_id.buyerId' },
        count: 1,
        sampleIds: {
          $slice: [
            {
              $map: {
                input: '$ids',
                as: 'id',
                in: { $toString: '$$id' },
              },
            },
            5,
          ],
        },
      },
    },
    { $limit: 20 },
  ]);

  if (duplicates.length > 0) {
    print('[fail] Duplicate conversations found for unique key { adId, buyerId }');
    printjson(duplicates);
    throw new Error('Conversation unique index precheck failed');
  }

  print('[pass] No duplicate conversations for { adId, buyerId }');
}

function precheckReportDuplicates() {
  const adReporterDuplicates = aggregateToArray('reports', [
    {
      $match: {
        status: { $in: ACTIVE_REPORT_STATUSES },
        adId: { $exists: true, $ne: null },
        reportedBy: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: { adId: '$adId', reportedBy: '$reportedBy' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
    {
      $project: {
        _id: 0,
        adId: { $toString: '$_id.adId' },
        reportedBy: { $toString: '$_id.reportedBy' },
        count: 1,
        sampleIds: {
          $slice: [
            {
              $map: {
                input: '$ids',
                as: 'id',
                in: { $toString: '$$id' },
              },
            },
            5,
          ],
        },
      },
    },
    { $limit: 20 },
  ]);

  const targetReporterDuplicates = aggregateToArray('reports', [
    {
      $match: {
        status: { $in: ACTIVE_REPORT_STATUSES },
        targetType: { $exists: true, $ne: null },
        targetId: { $exists: true, $ne: null },
        reporterId: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: {
          targetType: '$targetType',
          targetId: '$targetId',
          reporterId: '$reporterId',
        },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
    {
      $project: {
        _id: 0,
        targetType: '$_id.targetType',
        targetId: { $toString: '$_id.targetId' },
        reporterId: { $toString: '$_id.reporterId' },
        count: 1,
        sampleIds: {
          $slice: [
            {
              $map: {
                input: '$ids',
                as: 'id',
                in: { $toString: '$$id' },
              },
            },
            5,
          ],
        },
      },
    },
    { $limit: 20 },
  ]);

  if (adReporterDuplicates.length > 0 || targetReporterDuplicates.length > 0) {
    print('[fail] Duplicate active reports found for upcoming unique indexes');
    if (adReporterDuplicates.length > 0) {
      print('Duplicate { adId, reportedBy } groups:');
      printjson(adReporterDuplicates);
    }
    if (targetReporterDuplicates.length > 0) {
      print('Duplicate { targetType, targetId, reporterId } groups:');
      printjson(targetReporterDuplicates);
    }
    throw new Error('Report unique index precheck failed');
  }

  print('[pass] No duplicate active reports for the new unique keys');
}

function collectLocationUniqueDuplicates() {
  return aggregateToArray('locations', [
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          name: '$name',
          country: '$country',
          level: '$level',
          parentId: '$parentId',
        },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
    {
      $project: {
        _id: 0,
        name: '$_id.name',
        country: '$_id.country',
        level: '$_id.level',
        parentId: {
          $cond: [
            { $ifNull: ['$_id.parentId', false] },
            { $toString: '$_id.parentId' },
            null,
          ],
        },
        count: 1,
        sampleIds: {
          $slice: [
            {
              $map: {
                input: '$ids',
                as: 'id',
                in: { $toString: '$$id' },
              },
            },
            5,
          ],
        },
      },
    },
    { $limit: 20 },
  ]);
}

function reconcileLocationUniqueIndex() {
  const collectionName = 'locations';
  const collection = getCollection(collectionName);
  const indexes = getIndexes(collectionName);
  const namedIndex = findIndexByName(indexes, CURRENT_LOCATION_UNIQUE_SPEC.options.name);
  const equivalentCurrent = findEquivalentIndex(indexes, CURRENT_LOCATION_UNIQUE_SPEC);

  if (equivalentCurrent && equivalentCurrent.name !== CURRENT_LOCATION_UNIQUE_SPEC.options.name) {
    print(`[skip] locations unique identity already exists as ${equivalentCurrent.name}`);
    return;
  }

  if (!namedIndex) {
    const duplicates = collectLocationUniqueDuplicates();
    if (duplicates.length > 0) {
      print('[fail] Cannot create current locations unique index; duplicates exist for { name, country, level, parentId }');
      printjson(duplicates);
      throw new Error('Location unique index precheck failed');
    }

    if (!APPLY) {
      print(`[plan] create locations.${CURRENT_LOCATION_UNIQUE_SPEC.options.name} ${JSON.stringify(CURRENT_LOCATION_UNIQUE_SPEC.key)}`);
      return;
    }
    collection.createIndex(CURRENT_LOCATION_UNIQUE_SPEC.key, CURRENT_LOCATION_UNIQUE_SPEC.options);
    print(`[done] created locations.${CURRENT_LOCATION_UNIQUE_SPEC.options.name}`);
    return;
  }

  const isCurrent = isEqual(namedIndex.key, CURRENT_LOCATION_UNIQUE_SPEC.key) &&
    isEqual(extractIndexOptions(namedIndex), extractIndexOptions(CURRENT_LOCATION_UNIQUE_SPEC.options));
  if (isCurrent) {
    print('[skip] locations unique identity already matches current schema');
    return;
  }

  const isLegacy = isEqual(namedIndex.key, LEGACY_LOCATION_UNIQUE_SPEC.key) &&
    isEqual(extractIndexOptions(namedIndex), extractIndexOptions(LEGACY_LOCATION_UNIQUE_SPEC.options));
  if (!isLegacy) {
    throw new Error(
      `locations.${CURRENT_LOCATION_UNIQUE_SPEC.options.name} exists with an unexpected shape: ${renderSpec({ key: namedIndex.key, options: extractIndexOptions(namedIndex) })}`
    );
  }

  const duplicates = collectLocationUniqueDuplicates();

  if (duplicates.length > 0) {
    print('[fail] Cannot replace legacy locations unique index; duplicates exist for the new { name, country, level, parentId } key');
    printjson(duplicates);
    throw new Error('Location unique index precheck failed');
  }

  if (!APPLY) {
    print('[plan] replace legacy locations unique index with the current parentId-based key');
    return;
  }

  collection.dropIndex(CURRENT_LOCATION_UNIQUE_SPEC.options.name);
  collection.createIndex(CURRENT_LOCATION_UNIQUE_SPEC.key, CURRENT_LOCATION_UNIQUE_SPEC.options);
  print('[done] replaced legacy locations unique index with the current parentId-based key');
}

function main() {
  printSection('Context');
  print(`Database: ${db.getName()}`);
  print(`Mode: ${APPLY ? 'APPLY' : 'DRY_RUN'}`);
  print(`Started: ${new Date().toISOString()}`);

  printSection('Prechecks');
  precheckConversationDuplicates();
  precheckReportDuplicates();
  reconcileLocationUniqueIndex();

  printSection('Index Migration');
  for (const spec of INDEX_SPECS) {
    ensureIndex(spec);
  }

  printSection('Complete');
  if (!APPLY) {
    print('Dry run completed. Re-run with APPLY=1 to execute.');
    return;
  }
  print('Index migration completed successfully.');
}

main();
