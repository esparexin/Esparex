#!/usr/bin/env node

/**
 * Location hierarchy migration
 *
 * Default: DRY RUN (no writes)
 * Apply with: --apply
 *
 * What it does:
 * 1) Ensures state anchor rows exist (level=state) using existing state values.
 * 2) Backfills Location.parentId and Location.path hierarchy.
 * 3) Backfills missing Location.slug values.
 * 4) Backfills Ad.locationPath from canonical location hierarchy.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const slugify = require('slugify');

const shouldApply = process.argv.includes('--apply');
const BATCH_SIZE = 500;

const uris = [
  process.env.ADMIN_MONGODB_URI,
  process.env.MONGODB_URI
].filter((value, index, all) => typeof value === 'string' && value.length > 0 && all.indexOf(value) === index);

const LEVEL_RANK = {
  country: 0,
  state: 1,
  city: 2,
  area: 3
};

const now = () => new Date();

const asString = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeText = (value) => (asString(value) || '').toLowerCase();

const normalizeLevel = (value, loc, byId) => {
  const level = normalizeText(value);
  if (level === 'district') {
    const parentId = toObjectIdString(loc?.parentId);
    const parent = parentId && byId ? byId.get(parentId) : null;
    const parentLevel = normalizeText(parent?.level);
    return parentLevel === 'city' ? 'area' : 'city';
  }
  if (Object.prototype.hasOwnProperty.call(LEVEL_RANK, level)) return level;
  return 'city';
};

const toObjectIdString = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) return value;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const candidate = value.toString();
    if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;
  }
  return undefined;
};

const makeSlug = (...parts) => {
  const base = parts
    .map((part) => asString(part))
    .filter(Boolean)
    .join('-');
  return slugify(base || 'location', { lower: true, strict: true, trim: true }) || 'location';
};

const keyCountry = (country) => normalizeText(country);
const keyState = (country, state) => `${normalizeText(country)}|${normalizeText(state)}`;
const keyCity = (country, state, city) =>
  `${normalizeText(country)}|${normalizeText(state)}|${normalizeText(city)}`;

const locationSortScore = (loc) => {
  const popular = loc.isPopular ? 10_000 : 0;
  const priority = Number.isFinite(Number(loc.priority)) ? Number(loc.priority) : 0;
  const createdAt = loc.createdAt ? new Date(loc.createdAt).getTime() : 0;
  return popular + priority + createdAt / 1e13;
};

const pickBest = (current, next) => {
  if (!current) return next;
  return locationSortScore(next) > locationSortScore(current) ? next : current;
};

const pathEquals = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i]) !== String(b[i])) return false;
  }
  return true;
};

const ensureStateAnchorsPlan = (workingLocations) => {
  const byId = new Map(workingLocations.map((loc) => [String(loc._id), loc]));
  const countryAnchorByKey = new Map();
  const stateAnchorByKey = new Map();
  const stateRepresentativeByKey = new Map();

  for (const loc of workingLocations) {
    const level = normalizeLevel(loc.level, loc, byId);
    if (level === 'country') {
      countryAnchorByKey.set(
        keyCountry(loc.country || loc.name || loc.city),
        pickBest(countryAnchorByKey.get(keyCountry(loc.country || loc.name || loc.city)), loc)
      );
    } else if (level === 'state') {
      const key = keyState(loc.country, loc.state || loc.name || loc.city);
      stateAnchorByKey.set(key, pickBest(stateAnchorByKey.get(key), loc));
    }

    if (level === 'city' || level === 'area' || level === 'state') {
      const stateName = asString(loc.state);
      if (!stateName) continue;
      const countryName = asString(loc.country) || 'Unknown';
      const key = keyState(countryName, stateName);
      stateRepresentativeByKey.set(key, pickBest(stateRepresentativeByKey.get(key), loc));
    }
  }

  const plannedStateAnchors = [];
  for (const [stateKey, representative] of stateRepresentativeByKey.entries()) {
    if (stateAnchorByKey.has(stateKey)) continue;

    const countryName = asString(representative.country) || 'Unknown';
    const stateName = asString(representative.state) || asString(representative.name) || asString(representative.city);
    if (!stateName) continue;

    const countryAnchor =
      countryAnchorByKey.get(keyCountry(countryName)) ||
      Array.from(countryAnchorByKey.values())[0] ||
      null;

    const nextId = new mongoose.Types.ObjectId();
    const parentId = countryAnchor?._id || null;
    const path = parentId ? [parentId, nextId] : [nextId];

    const planned = {
      _id: nextId,
      name: stateName,
      city: stateName,
      district: undefined,
      state: stateName,
      country: countryName,
      level: 'state',
      parentId,
      path,
      coordinates: representative.coordinates,
      isActive: true,
      isPopular: false,
      verificationStatus: 'verified',
      priority: 0,
      tier: 3,
      aliases: [],
      createdAt: now(),
      updatedAt: now(),
      slug: makeSlug(stateName, countryName)
    };

    plannedStateAnchors.push(planned);
    stateAnchorByKey.set(stateKey, planned);
  }

  return plannedStateAnchors;
};

const buildAnchorMaps = (locations) => {
  const byId = new Map();
  const countryMap = new Map();
  const stateMap = new Map();
  const cityMap = new Map();

  for (const loc of locations) {
    const id = String(loc._id);
    byId.set(id, loc);
  }

  for (const loc of locations) {
    const level = normalizeLevel(loc.level, loc, byId);

    if (level === 'country') {
      const key = keyCountry(loc.country || loc.name || loc.city);
      countryMap.set(key, pickBest(countryMap.get(key), loc));
    } else if (level === 'state') {
      const key = keyState(loc.country, loc.state || loc.name || loc.city);
      stateMap.set(key, pickBest(stateMap.get(key), loc));
    } else if (level === 'city') {
      const key = keyCity(loc.country, loc.state, loc.city || loc.name);
      cityMap.set(key, pickBest(cityMap.get(key), loc));
    }
  }

  return { byId, countryMap, stateMap, cityMap };
};

const decideParentId = (loc, maps) => {
  const level = normalizeLevel(loc.level, loc, maps.byId);
  if (level === 'country') return null;

  if (level === 'state') {
    const countryAnchor = maps.countryMap.get(keyCountry(loc.country || loc.state || loc.name || loc.city));
    return countryAnchor ? String(countryAnchor._id) : null;
  }

  if (level === 'city') {
    const stateAnchor = maps.stateMap.get(keyState(loc.country, loc.state));
    return stateAnchor ? String(stateAnchor._id) : null;
  }

  if (level === 'area') {
    const cityAnchor = maps.cityMap.get(keyCity(loc.country, loc.state, loc.city));
    return cityAnchor ? String(cityAnchor._id) : null;
  }

  return null;
};

const computePathMap = (locations, parentMap) => {
  const byId = new Map(locations.map((loc) => [String(loc._id), loc]));
  const memo = new Map();

  const resolvePath = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return [id];
    stack.add(id);

    const parentId = parentMap.get(id) || null;
    if (!parentId) {
      memo.set(id, [id]);
      stack.delete(id);
      return [id];
    }

    const parentExists = byId.has(parentId);
    if (!parentExists) {
      memo.set(id, [id]);
      stack.delete(id);
      return [id];
    }

    const parentPath = resolvePath(parentId, stack);
    const result = [...parentPath, id];
    const deduped = Array.from(new Set(result));
    memo.set(id, deduped);
    stack.delete(id);
    return deduped;
  };

  for (const loc of locations) {
    resolvePath(String(loc._id));
  }

  return memo;
};

const buildMissingSlugMap = (locations) => {
  const used = new Set(
    locations
      .map((loc) => asString(loc.slug))
      .filter(Boolean)
      .map((slug) => slug.toLowerCase())
  );
  const map = new Map();

  const sorted = [...locations].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  for (const loc of sorted) {
    if (asString(loc.slug)) continue;

    const base = makeSlug(loc.name || loc.city, loc.state, loc.country);
    let candidate = base;
    const suffix = String(loc._id).slice(-6).toLowerCase();
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base}-${suffix}`;
    }
    used.add(candidate.toLowerCase());
    map.set(String(loc._id), candidate);
  }

  return map;
};

const migrateDatabase = async (dbName) => {
  const db = mongoose.connection.db;
  const locations = db.collection('locations');
  const ads = db.collection('ads');

  const existingLocations = await locations.find(
    {},
    {
      projection: {
        _id: 1,
        name: 1,
        slug: 1,
        city: 1,
        district: 1,
        state: 1,
        country: 1,
        level: 1,
        parentId: 1,
        path: 1,
        coordinates: 1,
        isActive: 1,
        isPopular: 1,
        priority: 1,
        createdAt: 1
      }
    }
  ).toArray();

  const plannedStateAnchors = ensureStateAnchorsPlan(existingLocations);
  const workingLocations = [...existingLocations, ...plannedStateAnchors];
  const maps = buildAnchorMaps(workingLocations);

  const desiredParentMap = new Map();
  for (const loc of workingLocations) {
    desiredParentMap.set(String(loc._id), decideParentId(loc, maps));
  }

  const desiredPathMap = computePathMap(workingLocations, desiredParentMap);
  const missingSlugMap = buildMissingSlugMap(workingLocations);

  const locationUpdates = [];
  for (const loc of existingLocations) {
    const id = String(loc._id);
    const desiredLevel = normalizeLevel(loc.level, loc, maps.byId);
    const desiredParentId = desiredParentMap.get(id) || null;
    const desiredPath = (desiredPathMap.get(id) || [id]).map((entry) => new mongoose.Types.ObjectId(entry));
    const currentParentId = toObjectIdString(loc.parentId) || null;
    const currentPath = Array.isArray(loc.path)
      ? loc.path.map((entry) => toObjectIdString(entry)).filter(Boolean)
      : [];
    const desiredPathStrings = desiredPath.map((entry) => String(entry));
    const currentPathStrings = currentPath.map((entry) => String(entry));

    const updateSet = {};
    if (normalizeText(loc.level) !== desiredLevel) {
      updateSet.level = desiredLevel;
    }
    if (currentParentId !== desiredParentId) {
      updateSet.parentId = desiredParentId ? new mongoose.Types.ObjectId(desiredParentId) : null;
    }
    if (!pathEquals(currentPathStrings, desiredPathStrings)) {
      updateSet.path = desiredPath;
    }
    if (!asString(loc.slug)) {
      const nextSlug = missingSlugMap.get(id);
      if (nextSlug) {
        updateSet.slug = nextSlug;
      }
    }

    if (Object.keys(updateSet).length > 0) {
      locationUpdates.push({
        updateOne: {
          filter: { _id: loc._id },
          update: { $set: updateSet }
        }
      });
    }
  }

  const pathByLocationId = new Map();
  for (const loc of workingLocations) {
    const id = String(loc._id);
    const path = (desiredPathMap.get(id) || [id]).map((entry) => String(entry));
    pathByLocationId.set(id, path);
  }

  let adsScanned = 0;
  let adPathUpdatesPlanned = 0;
  let adPathUpdatesApplied = 0;
  const adBulkOps = [];

  const adCursor = ads.find(
    { 'location.locationId': { $exists: true, $ne: null } },
    { projection: { _id: 1, location: 1, locationPath: 1 } }
  );

  while (await adCursor.hasNext()) {
    const ad = await adCursor.next();
    adsScanned += 1;
    const locationId = toObjectIdString(ad?.location?.locationId);
    if (!locationId) continue;

    const desiredPathStrings = pathByLocationId.get(locationId) || [locationId];
    const desiredPath = desiredPathStrings
      .filter((entry) => mongoose.Types.ObjectId.isValid(entry))
      .map((entry) => new mongoose.Types.ObjectId(entry));
    if (desiredPath.length === 0) continue;

    const currentPathStrings = Array.isArray(ad.locationPath)
      ? ad.locationPath
          .map((entry) => toObjectIdString(entry))
          .filter(Boolean)
      : [];
    if (pathEquals(currentPathStrings, desiredPathStrings)) continue;

    adPathUpdatesPlanned += 1;
    adBulkOps.push({
      updateOne: {
        filter: { _id: ad._id },
        update: { $set: { locationPath: desiredPath } }
      }
    });

    if (adBulkOps.length >= BATCH_SIZE && shouldApply) {
      const writeResult = await ads.bulkWrite(adBulkOps, { ordered: false });
      adPathUpdatesApplied += writeResult.modifiedCount || 0;
      adBulkOps.length = 0;
    }
  }

  if (shouldApply && adBulkOps.length > 0) {
    const writeResult = await ads.bulkWrite(adBulkOps, { ordered: false });
    adPathUpdatesApplied += writeResult.modifiedCount || 0;
  }

  let createdStateAnchors = 0;
  if (shouldApply && plannedStateAnchors.length > 0) {
    const insertResult = await locations.insertMany(plannedStateAnchors, { ordered: false });
    createdStateAnchors = Array.isArray(insertResult) ? insertResult.length : plannedStateAnchors.length;
  }

  let locationModified = 0;
  if (shouldApply && locationUpdates.length > 0) {
    for (let i = 0; i < locationUpdates.length; i += BATCH_SIZE) {
      const chunk = locationUpdates.slice(i, i + BATCH_SIZE);
      const writeResult = await locations.bulkWrite(chunk, { ordered: false });
      locationModified += writeResult.modifiedCount || 0;
    }
  }

  return {
    database: dbName,
    mode: shouldApply ? 'APPLY' : 'DRY_RUN',
    locationTotals: {
      existing: existingLocations.length,
      plannedStateAnchors: plannedStateAnchors.length,
      createdStateAnchors: shouldApply ? createdStateAnchors : 0,
      plannedUpdates: locationUpdates.length,
      modified: shouldApply ? locationModified : 0
    },
    adTotals: {
      scanned: adsScanned,
      plannedLocationPathUpdates: adPathUpdatesPlanned,
      modifiedLocationPath: shouldApply ? adPathUpdatesApplied : 0
    }
  };
};

const run = async () => {
  if (uris.length === 0) {
    throw new Error('ADMIN_MONGODB_URI or MONGODB_URI must be set');
  }

  console.log(`[location-hierarchy-migration] Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  const reports = [];

  for (const uri of uris) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    const report = await migrateDatabase(mongoose.connection.name);
    reports.push(report);
    await mongoose.disconnect();
  }

  console.log(JSON.stringify(reports, null, 2));
};

run().catch(async (error) => {
  console.error('[location-hierarchy-migration] failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // no-op
  }
  process.exit(1);
});
