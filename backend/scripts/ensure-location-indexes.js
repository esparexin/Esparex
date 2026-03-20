#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const shouldApply = process.argv.includes('--apply');
const isDryRun = process.argv.includes('--dry-run') || !shouldApply;

const uris = [
  process.env.ADMIN_MONGODB_URI,
  process.env.MONGODB_URI
].filter((value, index, all) => typeof value === 'string' && value.length > 0 && all.indexOf(value) === index);

const normalizeKey = (key) => JSON.stringify(key);

const collectionPlans = [
  {
    collection: 'locations',
    requiredIndexes: [
      { key: { coordinates: '2dsphere' } },
      { key: { parentId: 1 } },
      { key: { path: 1 } },
      { key: { normalizedName: 1 } },
      { key: { state: 1, isActive: 1 } },
      { key: { level: 1, isActive: 1 } },
      { key: { isActive: 1, level: 1, parentId: 1 } },
      { key: { isActive: 1, level: 1, path: 1 } },
      { key: { country: 1 } },
      { key: { isPopular: -1, priority: -1 } },
      { key: { verificationStatus: 1, createdAt: 1 } },
      { key: { isActive: 1, isPopular: -1, createdAt: -1 } },
      { key: { isActive: 1, state: 1, level: 1, isPopular: -1, createdAt: -1 } }
    ],
    searchIndexes: [
      {
        name: 'location_autocomplete',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              name: { type: 'autocomplete' },
              aliases: { type: 'autocomplete' },
              normalizedName: { type: 'autocomplete' }
            }
          }
        }
      }
    ]
  },
  {
    collection: 'adminboundaries',
    requiredIndexes: [
      { key: { geometry: '2dsphere' } },
      { key: { locationId: 1, level: 1 }, options: { unique: true } }
    ]
  },
  {
    collection: 'smartalerts',
    requiredIndexes: [
      { key: { coordinates: '2dsphere' } }
    ]
  },
  {
    collection: 'ads',
    requiredIndexes: [
      { key: { 'location.coordinates': '2dsphere' } },
      { key: { status: 1, locationPath: 1, createdAt: -1 } }
    ],
    deprecatedIndexes: [
      { key: { locationPath: 1, status: 1, createdAt: -1 } }
    ]
  }
];

const ensureTextIndex = async (collection, existing) => {
  const hasText = existing.some((idx) =>
    Object.values(idx.key || {}).some((value) => value === 'text')
  );
  if (hasText) {
    return { status: 'skipped', reason: 'existing text index' };
  }

  if (isDryRun) {
    return {
      status: 'planned',
      key: { name: 'text' },
      options: undefined
    };
  }

  const name = await collection.createIndex({ name: 'text' });
  return { status: 'created', name, key: { name: 'text' } };
};

const ensureMandatorySlugUniqueIndex = async (collection, existing) => {
  const slugIndex = existing.find((idx) => normalizeKey(idx.key) === normalizeKey({ slug: 1 }));

  if (slugIndex && slugIndex.unique) {
    return { status: 'skipped', reason: 'slug index already unique', name: slugIndex.name };
  }

  const duplicateSlugBuckets = await collection.aggregate([
    { $match: { slug: { $type: 'string', $ne: '' } } },
    { $group: { _id: { $toLower: '$slug' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ]).toArray();
  const duplicateCount = duplicateSlugBuckets[0]?.total || 0;
  const missingSlugCount = await collection.countDocuments({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }]
  });

  if (duplicateCount > 0 || missingSlugCount > 0) {
    const blockedReport = {
      status: 'blocked',
      reason: 'slug uniqueness prerequisites not met',
      duplicateCount,
      missingSlugCount
    };
    if (!isDryRun) {
      throw new Error(`slug uniqueness blocked (duplicates=${duplicateCount}, missing=${missingSlugCount})`);
    }
    return blockedReport;
  }

  const spec = {
    key: { slug: 1 },
    options: {
      unique: true
    }
  };

  if (isDryRun) {
    return {
      status: 'planned',
      dropExisting: slugIndex && !slugIndex.unique ? slugIndex.name : undefined,
      ...spec
    };
  }

  if (slugIndex && !slugIndex.unique) {
    await collection.dropIndex(slugIndex.name);
  }

  const name = await collection.createIndex(spec.key, spec.options);
  return { status: 'created', name, ...spec };
};

const ensureCollectionIndexes = async (db, plan) => {
  const exists = await db.listCollections({ name: plan.collection }).hasNext();
  if (!exists) {
    return {
      collection: plan.collection,
      skipped: true,
      reason: 'collection missing'
    };
  }

  const collection = db.collection(plan.collection);
  const before = await collection.indexes();
  const existingMap = new Map(before.map((idx) => [normalizeKey(idx.key), idx]));

  const created = [];
  const skipped = [];
  const planned = [];
  const dropped = [];

  for (const spec of (plan.requiredIndexes || [])) {
    const existing = existingMap.get(normalizeKey(spec.key));
    if (existing) {
      skipped.push({ key: spec.key, name: existing.name });
      continue;
    }

    if (isDryRun) {
      planned.push({ op: 'createIndex', key: spec.key, options: spec.options || undefined });
      continue;
    }

    const name = await collection.createIndex(spec.key, spec.options || {});
    created.push({ key: spec.key, name });
  }

  for (const deprecated of (plan.deprecatedIndexes || [])) {
    const existing = existingMap.get(normalizeKey(deprecated.key));
    if (!existing) continue;

    if (isDryRun) {
      planned.push({ op: 'dropIndex', key: deprecated.key, name: existing.name });
      continue;
    }

    await collection.dropIndex(existing.name);
    dropped.push({ key: deprecated.key, name: existing.name });
  }

  const extras = [];
  if (plan.collection === 'locations') {
    const textResult = await ensureTextIndex(collection, await collection.indexes());
    extras.push({ type: 'name_text', ...textResult });

    const slugUniqueResult = await ensureMandatorySlugUniqueIndex(collection, await collection.indexes());
    extras.push({ type: 'slug_unique', ...slugUniqueResult });
  }

  const searchIndexResults = [];
  for (const searchIndex of (plan.searchIndexes || [])) {
    if (typeof collection.listSearchIndexes !== 'function' || typeof collection.createSearchIndex !== 'function') {
      searchIndexResults.push({
        name: searchIndex.name,
        status: 'skipped',
        reason: 'search indexes unsupported by current server/driver'
      });
      continue;
    }

    const existingSearchIndexes = await collection.listSearchIndexes().toArray();
    const existingSearchIndex = existingSearchIndexes.find((idx) => idx && idx.name === searchIndex.name);
    if (existingSearchIndex) {
      searchIndexResults.push({
        name: searchIndex.name,
        status: 'skipped',
        reason: 'search index already exists'
      });
      continue;
    }

    if (isDryRun) {
      searchIndexResults.push({
        name: searchIndex.name,
        status: 'planned',
        definition: searchIndex.definition
      });
      continue;
    }

    try {
      const createdName = await collection.createSearchIndex({
        name: searchIndex.name,
        definition: searchIndex.definition
      });
      searchIndexResults.push({
        name: createdName || searchIndex.name,
        status: 'created'
      });
    } catch (error) {
      searchIndexResults.push({
        name: searchIndex.name,
        status: 'blocked',
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const after = isDryRun ? before : await collection.indexes();
  return {
    collection: plan.collection,
    beforeCount: before.length,
    afterCount: after.length,
    created,
    skipped,
    dropped,
    planned,
    extras,
    searchIndexes: searchIndexResults
  };
};

(async () => {
  if (uris.length === 0) throw new Error('ADMIN_MONGODB_URI or MONGODB_URI must be set');

  const reports = [];

  for (const uri of uris) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    const collectionReports = [];

    for (const plan of collectionPlans) {
      const report = await ensureCollectionIndexes(db, plan);
      collectionReports.push(report);
    }

    reports.push({
      database: mongoose.connection.name,
      mode: isDryRun ? 'DRY_RUN' : 'APPLY',
      collections: collectionReports
    });

    await mongoose.disconnect();
  }

  console.log(JSON.stringify(reports, null, 2));
})().catch(async (error) => {
  console.error('[ensure-location-indexes] failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // no-op
  }
  process.exit(1);
});
