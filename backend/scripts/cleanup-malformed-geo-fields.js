#!/usr/bin/env node

/**
 * One-time cleanup for malformed GeoJSON fields that can break 2dsphere index extraction.
 *
 * Targets:
 * - users.location.coordinates
 * - ads.location.coordinates
 * - businesses.location.coordinates
 * - locations.coordinates
 * - smartalerts.coordinates
 * - smartalerts.criteria.coordinates
 *
 * Usage:
 *   node scripts/cleanup-malformed-geo-fields.js          # dry run (default)
 *   node scripts/cleanup-malformed-geo-fields.js --apply  # write changes
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const shouldApply = process.argv.includes('--apply');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('[geo-cleanup] Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const getByPath = (obj, path) => {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (!isObject(current) || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
};

const isValidGeoPoint = (value) => {
  if (!isObject(value)) return false;
  if (value.type !== 'Point') return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;

  const [lng, lat] = value.coordinates;
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng === 0 && lat === 0) return false;
  return true;
};

const targets = [
  { collection: 'users', path: 'location.coordinates' },
  { collection: 'ads', path: 'location.coordinates' },
  { collection: 'businesses', path: 'location.coordinates' },
  { collection: 'locations', path: 'coordinates' },
  { collection: 'smartalerts', path: 'coordinates' },
  { collection: 'smartalerts', path: 'criteria.coordinates' },
];

const run = async () => {
  console.log(`[geo-cleanup] Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });

  const db = mongoose.connection.db;
  const grouped = new Map();

  for (const target of targets) {
    const key = target.collection;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(target.path);
  }

  const summary = [];

  for (const [collectionName, paths] of grouped.entries()) {
    const collection = db.collection(collectionName);

    const orExists = paths.map((path) => ({ [path]: { $exists: true } }));
    const candidates = await collection
      .find({ $or: orExists }, { projection: { _id: 1, ...Object.fromEntries(paths.map((p) => [p, 1])) } })
      .toArray();

    const ops = [];
    const invalidByPath = Object.fromEntries(paths.map((p) => [p, 0]));

    for (const doc of candidates) {
      const unsetPayload = {};

      for (const path of paths) {
        const value = getByPath(doc, path);
        if (value === undefined) continue;

        if (!isValidGeoPoint(value)) {
          invalidByPath[path] += 1;
          unsetPayload[path] = '';
        }
      }

      if (Object.keys(unsetPayload).length > 0) {
        ops.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $unset: unsetPayload },
          },
        });
      }
    }

    let modifiedCount = 0;
    if (shouldApply && ops.length > 0) {
      const result = await collection.bulkWrite(ops, { ordered: false });
      modifiedCount = result.modifiedCount || 0;
    }

    summary.push({
      collection: collectionName,
      scanned: candidates.length,
      invalidByPath,
      docsToFix: ops.length,
      modifiedCount,
    });
  }

  console.log('\n[geo-cleanup] Summary');
  for (const row of summary) {
    console.log(`- ${row.collection}: scanned=${row.scanned}, docsToFix=${row.docsToFix}, modified=${row.modifiedCount}`);
    for (const [path, count] of Object.entries(row.invalidByPath)) {
      console.log(`    ${path}: invalid=${count}`);
    }
  }

  const totalToFix = summary.reduce((acc, item) => acc + item.docsToFix, 0);
  const totalModified = summary.reduce((acc, item) => acc + item.modifiedCount, 0);

  console.log(`\n[geo-cleanup] Total docs to fix: ${totalToFix}`);
  if (shouldApply) {
    console.log(`[geo-cleanup] Total docs modified: ${totalModified}`);
  } else {
    console.log('[geo-cleanup] DRY RUN complete. No DB changes were made.');
    console.log('[geo-cleanup] Re-run with --apply to execute updates.');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[geo-cleanup] Failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // no-op
  }
  process.exit(1);
});
