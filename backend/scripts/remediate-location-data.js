#!/usr/bin/env node

/**
 * One-time location remediation script.
 *
 * Default mode is DRY RUN (no writes).
 * Use --apply to execute updates.
 *
 * Usage:
 *   node scripts/remediate-location-data.js
 *   node scripts/remediate-location-data.js --apply
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const shouldApply = process.argv.includes('--apply');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('[location-remediation] Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const isGeoJSONPoint = (value) => {
  if (!isObject(value)) return false;
  if (value.type !== 'Point') return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
  const [lng, lat] = value.coordinates;
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return false;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  if (lng === 0 && lat === 0) return false;
  return true;
};

const extractLegacyLatLng = (location) => {
  if (!isObject(location)) return null;
  const directLat = location.lat;
  const directLng = location.lng;
  if (isFiniteNumber(directLat) && isFiniteNumber(directLng)) {
    return { lat: directLat, lng: directLng };
  }

  if (!isObject(location.coordinates)) return null;
  const nestedLat = location.coordinates.lat;
  const nestedLng = location.coordinates.lng;
  if (isFiniteNumber(nestedLat) && isFiniteNumber(nestedLng)) {
    return { lat: nestedLat, lng: nestedLng };
  }

  return null;
};

const buildGeoPoint = ({ lat, lng }) => ({
  type: 'Point',
  coordinates: [Number(lng), Number(lat)],
});

const createUserAction = (userDoc) => {
  const location = userDoc.location;
  const legacy = extractLegacyLatLng(location);
  const hasGeoPoint = isObject(location) && isGeoJSONPoint(location.coordinates);

  if (legacy) {
    const nextPoint = buildGeoPoint(legacy);
    if (!isGeoJSONPoint(nextPoint)) {
      return {
        type: 'skip_invalid_legacy',
        reason: 'Legacy lat/lng was present but failed GeoJSON validation',
      };
    }
    return {
      type: 'convert_legacy',
      update: {
        $set: {
          location: {
            ...(isObject(location) ? location : {}),
            coordinates: nextPoint,
          },
        },
      },
      details: { legacy, nextPoint },
    };
  }

  if (!location || !hasGeoPoint) {
    return {
      type: 'set_location_null',
      update: { $set: { location: null } },
      details: { previousLocation: location ?? null },
    };
  }

  return {
    type: 'noop',
  };
};

const formatUserLabel = (doc) => {
  const name =
    (typeof doc.name === 'string' && doc.name.trim()) ||
    (typeof doc.businessName === 'string' && doc.businessName.trim()) ||
    '';
  const mobile = typeof doc.mobile === 'string' ? doc.mobile : '';
  return [name, mobile].filter(Boolean).join(' | ') || String(doc._id);
};

const run = async () => {
  console.log(`[location-remediation] Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const businesses = db.collection('businesses');

  const userCandidates = await users
    .find(
      {
        $or: [
          { location: { $exists: false } },
          { location: null },
          { 'location.coordinates': { $exists: false } },
          { 'location.coordinates.lat': { $type: 'number' } },
          { 'location.coordinates.lng': { $type: 'number' } },
          { 'location.lat': { $type: 'number' } },
          { 'location.lng': { $type: 'number' } },
        ],
      },
      { projection: { _id: 1, name: 1, businessName: 1, mobile: 1, location: 1 } }
    )
    .toArray();

  const plannedOps = [];
  const convertedLegacyUsers = [];
  const nullifiedUsers = [];
  const skippedUsers = [];

  for (const userDoc of userCandidates) {
    const action = createUserAction(userDoc);
    const label = formatUserLabel(userDoc);

    if (action.type === 'convert_legacy') {
      convertedLegacyUsers.push({
        _id: userDoc._id,
        user: label,
        from: action.details.legacy,
        to: action.details.nextPoint,
      });
      plannedOps.push({
        updateOne: {
          filter: { _id: userDoc._id },
          update: action.update,
        },
      });
      continue;
    }

    if (action.type === 'set_location_null') {
      nullifiedUsers.push({
        _id: userDoc._id,
        user: label,
      });
      plannedOps.push({
        updateOne: {
          filter: { _id: userDoc._id },
          update: action.update,
        },
      });
      continue;
    }

    if (action.type === 'skip_invalid_legacy') {
      skippedUsers.push({
        _id: userDoc._id,
        user: label,
        reason: action.reason,
      });
    }
  }

  const businessesMissingLocation = await businesses
    .find(
      { $or: [{ location: { $exists: false } }, { location: null }] },
      { projection: { _id: 1, name: 1, businessName: 1 } }
    )
    .toArray();

  console.log('\n[location-remediation] User remediation plan');
  console.log(`- Total user candidates: ${userCandidates.length}`);
  console.log(`- Legacy lat/lng -> GeoJSON: ${convertedLegacyUsers.length}`);
  console.log(`- Set location = null: ${nullifiedUsers.length}`);
  console.log(`- Skipped invalid legacy rows: ${skippedUsers.length}`);

  if (convertedLegacyUsers.length > 0) {
    console.log('\n[location-remediation] Legacy conversions');
    convertedLegacyUsers.forEach((entry) => {
      console.log(
        `  - ${entry._id} | ${entry.user} | (${entry.from.lng}, ${entry.from.lat}) -> ${JSON.stringify(
          entry.to
        )}`
      );
    });
  }

  if (nullifiedUsers.length > 0) {
    console.log('\n[location-remediation] Users to set location=null');
    nullifiedUsers.forEach((entry) => {
      console.log(`  - ${entry._id} | ${entry.user}`);
    });
  }

  if (skippedUsers.length > 0) {
    console.log('\n[location-remediation] Skipped users');
    skippedUsers.forEach((entry) => {
      console.log(`  - ${entry._id} | ${entry.user} | ${entry.reason}`);
    });
  }

  console.log('\n[location-remediation] Businesses missing location');
  console.log(`- Count: ${businessesMissingLocation.length}`);
  businessesMissingLocation.forEach((biz) => {
    const displayName =
      (typeof biz.name === 'string' && biz.name.trim()) ||
      (typeof biz.businessName === 'string' && biz.businessName.trim()) ||
      '(Unnamed Business)';
    console.log(`  - ${biz._id} | ${displayName}`);
  });

  if (!shouldApply) {
    console.log('\n[location-remediation] DRY RUN complete. No DB changes were made.');
    await mongoose.disconnect();
    return;
  }

  if (plannedOps.length === 0) {
    console.log('\n[location-remediation] APPLY mode: no user updates required.');
    await mongoose.disconnect();
    return;
  }

  const writeResult = await users.bulkWrite(plannedOps, { ordered: false });
  console.log('\n[location-remediation] APPLY result');
  console.log(
    JSON.stringify(
      {
        matchedCount: writeResult.matchedCount,
        modifiedCount: writeResult.modifiedCount,
        upsertedCount: writeResult.upsertedCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[location-remediation] failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
