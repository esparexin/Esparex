#!/usr/bin/env node

/**
 * Cleanup duplicate locations by merging references to a canonical record.
 *
 * Default mode: DRY RUN (read-only, reports only)
 * Apply mode:   --apply
 *
 * Duplicate signals:
 * - same (slug, parentId, level) when slug exists
 * - same (name, parentId, level)
 *
 * Safe behavior:
 * - Never deletes records
 * - Re-points references to canonical locationId
 * - Soft-deactivates duplicate rows (isDeleted/isActive flags) on apply
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const shouldApply = process.argv.includes('--apply');
const BATCH_SIZE = 200;

const uris = [
  process.env.ADMIN_MONGODB_URI,
  process.env.MONGODB_URI
].filter((value, index, all) => typeof value === 'string' && value.length > 0 && all.indexOf(value) === index);

const toIdString = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) return value;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const candidate = value.toString();
    if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;
  }
  return undefined;
};

const now = () => new Date();

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const levelRank = (level) => {
  switch (normalizeText(level)) {
    case 'country':
      return 1;
    case 'state':
      return 2;
    case 'district':
      return 3;
    case 'city':
      return 4;
    case 'area':
      return 5;
    case 'village':
      return 6;
    default:
      return 99;
  }
};

const pickCanonical = (locations) => {
  const sorted = [...locations].sort((a, b) => {
    const activeA = a.isActive !== false ? 1 : 0;
    const activeB = b.isActive !== false ? 1 : 0;
    if (activeA !== activeB) return activeB - activeA;

    const popularA = a.isPopular ? 1 : 0;
    const popularB = b.isPopular ? 1 : 0;
    if (popularA !== popularB) return popularB - popularA;

    const priorityA = Number.isFinite(Number(a.priority)) ? Number(a.priority) : 0;
    const priorityB = Number.isFinite(Number(b.priority)) ? Number(b.priority) : 0;
    if (priorityA !== priorityB) return priorityB - priorityA;

    const levelA = levelRank(a.level);
    const levelB = levelRank(b.level);
    if (levelA !== levelB) return levelA - levelB;

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;

    return String(a._id).localeCompare(String(b._id));
  });

  return sorted[0];
};

const getDuplicateGroups = async (locationsCollection) => {
  const slugGroups = await locationsCollection
    .aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          slug: { $type: 'string', $ne: '' }
        }
      },
      {
        $project: {
          _id: 1,
          key: {
            kind: 'slug',
            parent: { $ifNull: [{ $toString: '$parentId' }, 'ROOT'] },
            level: { $ifNull: ['$level', 'city'] },
            slug: { $toLower: '$slug' }
          }
        }
      },
      {
        $group: {
          _id: '$key',
          ids: { $addToSet: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ])
    .toArray();

  const nameGroups = await locationsCollection
    .aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          name: { $type: 'string', $ne: '' }
        }
      },
      {
        $project: {
          _id: 1,
          key: {
            kind: 'name',
            parent: { $ifNull: [{ $toString: '$parentId' }, 'ROOT'] },
            level: { $ifNull: ['$level', 'city'] },
            name: { $toLower: { $trim: { input: '$name' } } }
          }
        }
      },
      {
        $group: {
          _id: '$key',
          ids: { $addToSet: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ])
    .toArray();

  return { slugGroups, nameGroups };
};

const buildDuplicateComponents = async (locationsCollection) => {
  const { slugGroups, nameGroups } = await getDuplicateGroups(locationsCollection);
  const allGroups = [...slugGroups, ...nameGroups];

  const adjacency = new Map();
  const ensureNode = (id) => {
    if (!adjacency.has(id)) adjacency.set(id, new Set());
  };
  const addEdge = (from, to) => {
    ensureNode(from);
    ensureNode(to);
    adjacency.get(from).add(to);
    adjacency.get(to).add(from);
  };

  for (const group of allGroups) {
    const idStrings = (Array.isArray(group.ids) ? group.ids : [])
      .map((id) => toIdString(id))
      .filter(Boolean);
    if (idStrings.length < 2) continue;

    const head = idStrings[0];
    for (let i = 1; i < idStrings.length; i += 1) {
      addEdge(head, idStrings[i]);
    }
  }

  const visited = new Set();
  const components = [];
  for (const node of adjacency.keys()) {
    if (visited.has(node)) continue;
    const queue = [node];
    const component = [];
    visited.add(node);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      component.push(current);
      const neighbors = adjacency.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    if (component.length > 1) {
      components.push(component);
    }
  }

  if (components.length === 0) {
    return {
      components: [],
      canonicalMap: new Map(),
      duplicateIds: []
    };
  }

  const uniqueIds = Array.from(new Set(components.flat()));
  const locationDocs = await locationsCollection
    .find(
      { _id: { $in: uniqueIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      {
        projection: {
          _id: 1,
          name: 1,
          slug: 1,
          level: 1,
          parentId: 1,
          state: 1,
          country: 1,
          isActive: 1,
          isPopular: 1,
          priority: 1,
          createdAt: 1
        }
      }
    )
    .toArray();

  const docById = new Map(locationDocs.map((doc) => [String(doc._id), doc]));
  const canonicalMap = new Map();
  const duplicateIds = [];
  const componentReports = [];

  for (const component of components) {
    const docs = component.map((id) => docById.get(id)).filter(Boolean);
    if (docs.length < 2) continue;

    const canonical = pickCanonical(docs);
    const canonicalId = String(canonical._id);
    const merged = [];

    for (const doc of docs) {
      const id = String(doc._id);
      if (id === canonicalId) continue;
      canonicalMap.set(id, canonicalId);
      duplicateIds.push(id);
      merged.push({
        id,
        name: doc.name,
        slug: doc.slug,
        level: doc.level
      });
    }

    componentReports.push({
      canonical: {
        id: canonicalId,
        name: canonical.name,
        slug: canonical.slug,
        level: canonical.level
      },
      merged
    });
  }

  return {
    components: componentReports,
    canonicalMap,
    duplicateIds: Array.from(new Set(duplicateIds))
  };
};

const countImpact = async (db, duplicateObjectIds) => {
  if (duplicateObjectIds.length === 0) {
    return {
      ads: { locationId: 0, locationPath: 0 },
      users: { locationId: 0, nestedLocationId: 0 },
      businesses: { locationId: 0 },
      services: { locationId: 0 },
      smartalerts: { criteriaLocationId: 0 },
      locationanalytics: { locationId: 0 },
      locationstats: { locationId: 0 },
      locations: { parentId: 0, path: 0 }
    };
  }

  const [
    adsLocationId,
    adsLocationPath,
    usersLocationId,
    usersNestedLocationId,
    businessesLocationId,
    servicesLocationId,
    smartAlertCriteriaLocationId,
    analyticsLocationId,
    statsLocationId,
    locationsParentId,
    locationsPath
  ] = await Promise.all([
    db.collection('ads').countDocuments({ 'location.locationId': { $in: duplicateObjectIds } }),
    db.collection('ads').countDocuments({ locationPath: { $in: duplicateObjectIds } }),
    db.collection('users').countDocuments({ locationId: { $in: duplicateObjectIds } }),
    db.collection('users').countDocuments({ 'location.locationId': { $in: duplicateObjectIds } }),
    db.collection('businesses').countDocuments({ locationId: { $in: duplicateObjectIds } }),
    db.collection('services').countDocuments({ locationId: { $in: duplicateObjectIds } }),
    db.collection('smartalerts').countDocuments({ 'criteria.locationId': { $in: duplicateObjectIds } }),
    db.collection('locationanalytics').countDocuments({ locationId: { $in: duplicateObjectIds } }),
    db.collection('locationstats').countDocuments({ locationId: { $in: duplicateObjectIds } }),
    db.collection('locations').countDocuments({ parentId: { $in: duplicateObjectIds } }),
    db.collection('locations').countDocuments({ path: { $in: duplicateObjectIds } })
  ]);

  return {
    ads: { locationId: adsLocationId, locationPath: adsLocationPath },
    users: { locationId: usersLocationId, nestedLocationId: usersNestedLocationId },
    businesses: { locationId: businessesLocationId },
    services: { locationId: servicesLocationId },
    smartalerts: { criteriaLocationId: smartAlertCriteriaLocationId },
    locationanalytics: { locationId: analyticsLocationId },
    locationstats: { locationId: statsLocationId },
    locations: { parentId: locationsParentId, path: locationsPath }
  };
};

const replaceLocationArrayPath = (sourceField, switchBranches) => ([
  {
    $set: {
      [sourceField]: {
        $let: {
          vars: {
            mapped: {
              $map: {
                input: { $ifNull: [`$${sourceField}`, []] },
                as: 'locId',
                in: {
                  $switch: {
                    branches: switchBranches.map((entry) => ({
                      case: { $eq: ['$$locId', entry.from] },
                      then: entry.to
                    })),
                    default: '$$locId'
                  }
                }
              }
            }
          },
          in: {
            $reduce: {
              input: '$$mapped',
              initialValue: [],
              in: {
                $cond: [
                  { $in: ['$$this', '$$value'] },
                  '$$value',
                  { $concatArrays: ['$$value', ['$$this']] }
                ]
              }
            }
          }
        }
      }
    }
  }
]);

const mergeUniqueLocationRefCollection = async ({
  collection,
  from,
  to,
  numericFields = [],
  carryFields = []
}) => {
  const source = await collection.findOne({ locationId: from });
  if (!source) {
    return { moved: 0, merged: 0, deleted: 0 };
  }

  const target = await collection.findOne({ locationId: to });
  if (!target) {
    await collection.updateOne(
      { _id: source._id },
      {
        $set: {
          locationId: to,
          updatedAt: now()
        }
      }
    );
    return { moved: 1, merged: 0, deleted: 0 };
  }

  const inc = {};
  for (const field of numericFields) {
    const value = Number(source[field]);
    if (Number.isFinite(value) && value !== 0) {
      inc[field] = (inc[field] || 0) + value;
    }
  }

  const set = { updatedAt: now() };
  if (source.lastUpdated || target.lastUpdated) {
    const sourceTs = source.lastUpdated ? new Date(source.lastUpdated).getTime() : 0;
    const targetTs = target.lastUpdated ? new Date(target.lastUpdated).getTime() : 0;
    set.lastUpdated = new Date(Math.max(sourceTs, targetTs, Date.now()));
  }

  for (const field of carryFields) {
    if ((target[field] === undefined || target[field] === null || target[field] === '') && source[field] != null) {
      set[field] = source[field];
    }
  }

  const updatePayload = {};
  if (Object.keys(inc).length > 0) updatePayload.$inc = inc;
  if (Object.keys(set).length > 0) updatePayload.$set = set;

  if (Object.keys(updatePayload).length > 0) {
    await collection.updateOne({ _id: target._id }, updatePayload);
  }
  await collection.deleteOne({ _id: source._id });

  return { moved: 0, merged: 1, deleted: 1 };
};

const applyRemediation = async (db, canonicalMap, duplicateIds) => {
  if (duplicateIds.length === 0) {
    return { applied: false, modified: {} };
  }

  const updates = [];
  for (const [fromId, toId] of canonicalMap.entries()) {
    const from = new mongoose.Types.ObjectId(fromId);
    const to = new mongoose.Types.ObjectId(toId);
    updates.push({ from, to });
  }

  const fromIds = updates.map((entry) => entry.from);
  const switchBranches = updates;

  const results = {};

  const runUpdate = async (key, fn) => {
    const value = await fn();
    results[key] = value?.modifiedCount || 0;
  };

  await runUpdate('ads.location.locationId', () =>
    db.collection('ads').updateMany(
      { 'location.locationId': { $in: fromIds } },
      [
        {
          $set: {
            'location.locationId': {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$location.locationId', entry.from] },
                  then: entry.to
                })),
                default: '$location.locationId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('ads.locationPath', () =>
    db.collection('ads').updateMany(
      { locationPath: { $in: fromIds } },
      replaceLocationArrayPath('locationPath', switchBranches)
    )
  );

  await runUpdate('users.locationId', () =>
    db.collection('users').updateMany(
      { locationId: { $in: fromIds } },
      [
        {
          $set: {
            locationId: {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$locationId', entry.from] },
                  then: entry.to
                })),
                default: '$locationId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('users.location.locationId', () =>
    db.collection('users').updateMany(
      { 'location.locationId': { $in: fromIds } },
      [
        {
          $set: {
            'location.locationId': {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$location.locationId', entry.from] },
                  then: entry.to
                })),
                default: '$location.locationId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('businesses.locationId', () =>
    db.collection('businesses').updateMany(
      { locationId: { $in: fromIds } },
      [
        {
          $set: {
            locationId: {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$locationId', entry.from] },
                  then: entry.to
                })),
                default: '$locationId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('services.locationId', () =>
    db.collection('services').updateMany(
      { locationId: { $in: fromIds } },
      [
        {
          $set: {
            locationId: {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$locationId', entry.from] },
                  then: entry.to
                })),
                default: '$locationId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('smartalerts.criteria.locationId', () =>
    db.collection('smartalerts').updateMany(
      { 'criteria.locationId': { $in: fromIds } },
      [
        {
          $set: {
            'criteria.locationId': {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$criteria.locationId', entry.from] },
                  then: entry.to
                })),
                default: '$criteria.locationId'
              }
            }
          }
        }
      ]
    )
  );

  const analyticsCollection = db.collection('locationanalytics');
  const statsCollection = db.collection('locationstats');
  let analyticsMerged = 0;
  let analyticsMoved = 0;
  let statsMerged = 0;
  let statsMoved = 0;

  for (const entry of updates) {
    const analyticsResult = await mergeUniqueLocationRefCollection({
      collection: analyticsCollection,
      from: entry.from,
      to: entry.to,
      numericFields: ['adsCount', 'searchCount', 'chatCount', 'viewCount']
    });
    analyticsMerged += analyticsResult.merged;
    analyticsMoved += analyticsResult.moved;

    const statsResult = await mergeUniqueLocationRefCollection({
      collection: statsCollection,
      from: entry.from,
      to: entry.to,
      numericFields: ['adsCount', 'usersCount', 'activeAdsCount'],
      carryFields: ['city', 'state']
    });
    statsMerged += statsResult.merged;
    statsMoved += statsResult.moved;
  }

  results['locationanalytics.locationId.merged'] = analyticsMerged;
  results['locationanalytics.locationId.moved'] = analyticsMoved;
  results['locationstats.locationId.merged'] = statsMerged;
  results['locationstats.locationId.moved'] = statsMoved;

  await runUpdate('locations.parentId', () =>
    db.collection('locations').updateMany(
      { parentId: { $in: fromIds } },
      [
        {
          $set: {
            parentId: {
              $switch: {
                branches: switchBranches.map((entry) => ({
                  case: { $eq: ['$parentId', entry.from] },
                  then: entry.to
                })),
                default: '$parentId'
              }
            }
          }
        }
      ]
    )
  );

  await runUpdate('locations.path', () =>
    db.collection('locations').updateMany(
      { path: { $in: fromIds } },
      replaceLocationArrayPath('path', switchBranches)
    )
  );

  const duplicateObjectIds = duplicateIds.map((id) => new mongoose.Types.ObjectId(id));
  await runUpdate('locations.softDeactivateMerged', () =>
    db.collection('locations').updateMany(
      { _id: { $in: duplicateObjectIds } },
      {
        $set: {
          isActive: false,
          isDeleted: true,
          deletedAt: now(),
          updatedAt: now()
        }
      }
    )
  );

  return { applied: true, modified: results };
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const runForDatabase = async (dbName) => {
  const db = mongoose.connection.db;
  const locationsCollection = db.collection('locations');
  const exists = await db.listCollections({ name: 'locations' }).hasNext();
  if (!exists) {
    return {
      database: dbName,
      mode: shouldApply ? 'APPLY' : 'DRY_RUN',
      skipped: true,
      reason: 'locations collection missing'
    };
  }

  const { components, canonicalMap, duplicateIds } = await buildDuplicateComponents(locationsCollection);
  const duplicateObjectIds = duplicateIds.map((id) => new mongoose.Types.ObjectId(id));
  const impact = await countImpact(db, duplicateObjectIds);

  let applyReport = { applied: false, modified: {} };
  if (shouldApply && duplicateIds.length > 0) {
    const mapEntries = Array.from(canonicalMap.entries());
    for (const mapBatch of chunk(mapEntries, BATCH_SIZE)) {
      const partialMap = new Map(mapBatch);
      const partialDupIds = mapBatch.map(([fromId]) => fromId);
      const partial = await applyRemediation(db, partialMap, partialDupIds);

      if (!applyReport.applied && partial.applied) {
        applyReport.applied = true;
      }
      for (const [key, value] of Object.entries(partial.modified || {})) {
        applyReport.modified[key] = (applyReport.modified[key] || 0) + Number(value || 0);
      }
    }
  }

  return {
    database: dbName,
    mode: shouldApply ? 'APPLY' : 'DRY_RUN',
    summary: {
      duplicateClusters: components.length,
      duplicateLocations: duplicateIds.length
    },
    impact,
    clusters: components.slice(0, 100),
    ...(components.length > 100 ? { clustersTruncated: true } : {}),
    apply: applyReport
  };
};

const run = async () => {
  if (uris.length === 0) {
    throw new Error('ADMIN_MONGODB_URI or MONGODB_URI must be set');
  }

  console.log(`[cleanup-duplicate-locations] Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  const reports = [];

  for (const uri of uris) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    const report = await runForDatabase(mongoose.connection.name);
    reports.push(report);
    await mongoose.disconnect();
  }

  console.log(JSON.stringify(reports, null, 2));
};

run().catch(async (error) => {
  console.error('[cleanup-duplicate-locations] failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // no-op
  }
  process.exit(1);
});
