/*
 * Exact Atlas remediation for the current India / Guntur / Macherla master-data issue.
 *
 * Dry run:
 *   mongosh "$MONGODB_URI" backend/scripts/remediate_india_guntur_hierarchy.mongosh.js
 *
 * Apply:
 *   APPLY=1 mongosh "$MONGODB_URI" backend/scripts/remediate_india_guntur_hierarchy.mongosh.js
 *
 * Intent:
 * - mark the live India country row as verified
 * - convert the Andhra Pradesh "Guntur" row from city -> district in place
 *   to preserve existing references and avoid duplicate "Guntur, Andhra Pradesh" labels
 * - reparent Macherla under that Guntur district
 * - rebuild location.path for the affected subtree
 * - backfill ad.locationPath for ads bound to the affected locationIds
 *
 * This script is hard-wired to the current live document ids discovered on 2026-04-08.
 * It fails fast if the anchor rows do not match the expected names/parents.
 */

const APPLY = ['1', 'true', 'yes'].includes(String(process?.env?.APPLY || '').toLowerCase());

const IDS = {
  INDIA_COUNTRY: ObjectId('694cb5bd579873b99d89f636'),
  ANDHRA_PRADESH: ObjectId('69ac4b49434f2782980accb0'),
  TELANGANA: ObjectId('69ac4b49434f2782980acccd'),
  GUNTUR_ANDHRA: ObjectId('69464c1614759c4fa9b94edd'),
  GUNTUR_TELANGANA: ObjectId('6948f99f14759c4fa9b9dbd0'),
  MACHERLA: ObjectId('69464c1414759c4fa9b94b64'),
};

function printSection(title) {
  print(`\n=== ${title} ===`);
}

function idString(value) {
  return value ? String(value) : null;
}

function sameId(left, right) {
  return idString(left) === idString(right);
}

function assert(condition, message, details) {
  if (condition) return;
  if (details) {
    printjson(details);
  }
  throw new Error(message);
}

function dedupeIds(ids) {
  const seen = new Set();
  const out = [];
  for (const value of ids) {
    const key = idString(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

const locations = db.getCollection('locations');
const ads = db.getCollection('ads');

function cloneDoc(doc) {
  if (!doc) return null;
  return {
    ...doc,
    path: Array.isArray(doc.path) ? [...doc.path] : doc.path,
  };
}

function fetchLocation(_id, overrides = new Map()) {
  const override = overrides.get(idString(_id));
  if (override) {
    return cloneDoc(override);
  }

  return locations.findOne(
    { _id },
    {
      _id: 1,
      name: 1,
      level: 1,
      country: 1,
      parentId: 1,
      path: 1,
      isActive: 1,
      verificationStatus: 1,
    }
  );
}

function fetchRequiredLocation(_id, expectedName, overrides = new Map()) {
  const doc = fetchLocation(_id, overrides);
  assert(doc, `Missing required location anchor ${expectedName}`, { expectedId: idString(_id) });
  return doc;
}

function buildChildrenMap(locationRefs) {
  const children = new Map();
  for (const ref of locationRefs) {
    const parentKey = idString(ref.parentId);
    if (!parentKey) continue;
    if (!children.has(parentKey)) {
      children.set(parentKey, []);
    }
    children.get(parentKey).push(ref._id);
  }
  return children;
}

function collectSubtreeIds(locationRefs, rootIds) {
  const children = buildChildrenMap(locationRefs);
  const queue = [...rootIds];
  const seen = new Set(queue.map((id) => idString(id)));

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = idString(current);
    const childIds = children.get(currentKey) || [];
    for (const childId of childIds) {
      const childKey = idString(childId);
      if (seen.has(childKey)) continue;
      seen.add(childKey);
      queue.push(childId);
    }
  }

  return Array.from(seen).map((id) => ObjectId(id));
}

function computePathFor(locationId, cache = new Map(), trail = new Set(), overrides = new Map()) {
  const key = idString(locationId);
  if (!key) {
    throw new Error('Cannot compute path for empty location id');
  }

  if (cache.has(key)) {
    return cache.get(key);
  }

  if (trail.has(key)) {
    throw new Error(`Location hierarchy cycle detected at ${key}`);
  }

  const location = fetchRequiredLocation(locationId, key, overrides);
  trail.add(key);

  let path;
  if (!location.parentId) {
    path = [location._id];
  } else {
    const parentPath = computePathFor(location.parentId, cache, trail, overrides);
    path = dedupeIds([...parentPath, location._id]);
  }

  trail.delete(key);
  cache.set(key, path);
  return path;
}

function formatLocation(doc) {
  return {
    id: idString(doc._id),
    name: doc.name,
    level: doc.level,
    country: doc.country,
    isActive: doc.isActive,
    verificationStatus: doc.verificationStatus,
    parentId: idString(doc.parentId),
    path: Array.isArray(doc.path) ? doc.path.map((entry) => idString(entry)) : [],
  };
}

function verifyAnchors() {
  const india = fetchRequiredLocation(IDS.INDIA_COUNTRY, 'India');
  const andhra = fetchRequiredLocation(IDS.ANDHRA_PRADESH, 'Andhra Pradesh');
  const telangana = fetchRequiredLocation(IDS.TELANGANA, 'Telangana');
  const gunturAndhra = fetchRequiredLocation(IDS.GUNTUR_ANDHRA, 'Guntur (Andhra Pradesh)');
  const gunturTelangana = fetchRequiredLocation(IDS.GUNTUR_TELANGANA, 'Guntur (Telangana)');
  const macherla = fetchRequiredLocation(IDS.MACHERLA, 'Macherla');

  assert(india.name === 'India' && india.level === 'country', 'India anchor does not match expected country row', formatLocation(india));
  assert(andhra.name === 'Andhra Pradesh' && andhra.level === 'state', 'Andhra Pradesh anchor does not match expected state row', formatLocation(andhra));
  assert(telangana.name === 'Telangana' && telangana.level === 'state', 'Telangana anchor does not match expected state row', formatLocation(telangana));
  assert(sameId(andhra.parentId, IDS.INDIA_COUNTRY), 'Andhra Pradesh is not linked to the expected India row', formatLocation(andhra));
  assert(sameId(telangana.parentId, IDS.INDIA_COUNTRY), 'Telangana is not linked to the expected India row', formatLocation(telangana));

  assert(
    gunturAndhra.name === 'Guntur' &&
      (gunturAndhra.level === 'city' || gunturAndhra.level === 'district') &&
      sameId(gunturAndhra.parentId, IDS.ANDHRA_PRADESH),
    'Andhra Pradesh Guntur anchor does not match expected state-linked row',
    formatLocation(gunturAndhra)
  );

  assert(
    gunturTelangana.name === 'Guntur' &&
      gunturTelangana.level === 'city' &&
      sameId(gunturTelangana.parentId, IDS.TELANGANA),
    'Telangana Guntur anchor does not match expected untouched city row',
    formatLocation(gunturTelangana)
  );

  assert(
    macherla.name === 'Macherla' &&
      macherla.level === 'city' &&
      (sameId(macherla.parentId, IDS.ANDHRA_PRADESH) || sameId(macherla.parentId, IDS.GUNTUR_ANDHRA)),
    'Macherla anchor does not match expected row',
    formatLocation(macherla)
  );

  const duplicateGunturDistrict = locations.find({
    _id: { $ne: IDS.GUNTUR_ANDHRA },
    name: 'Guntur',
    country: 'India',
    level: 'district',
    parentId: IDS.ANDHRA_PRADESH,
    isActive: true,
  }).limit(5).toArray();

  assert(
    duplicateGunturDistrict.length === 0,
    'Found an unexpected duplicate Guntur district under Andhra Pradesh; refusing automatic remediation',
    duplicateGunturDistrict.map(formatLocation)
  );

  return {
    india,
    andhra,
    telangana,
    gunturAndhra,
    gunturTelangana,
    macherla,
  };
}

function planOperations(anchorDocs) {
  const locationRefs = locations.find(
    { isDeleted: { $ne: true } },
    { _id: 1, parentId: 1 }
  ).toArray();

  const affectedLocationIds = collectSubtreeIds(locationRefs, [IDS.GUNTUR_ANDHRA, IDS.MACHERLA]);
  const affectedAds = ads.find(
    { 'location.locationId': { $in: affectedLocationIds } },
    { _id: 1, 'location.locationId': 1, locationPath: 1 }
  ).toArray();

  return {
    willVerifyIndia: anchorDocs.india.verificationStatus !== 'verified',
    willConvertGunturToDistrict: anchorDocs.gunturAndhra.level !== 'district',
    willReparentMacherla: !sameId(anchorDocs.macherla.parentId, IDS.GUNTUR_ANDHRA),
    affectedLocationIds,
    affectedAds,
  };
}

function buildPlannedLocationOverrides(anchorDocs) {
  const overrides = new Map();

  overrides.set(
    idString(IDS.INDIA_COUNTRY),
    {
      ...cloneDoc(anchorDocs.india),
      verificationStatus: 'verified',
    }
  );

  overrides.set(
    idString(IDS.GUNTUR_ANDHRA),
    {
      ...cloneDoc(anchorDocs.gunturAndhra),
      level: 'district',
      parentId: IDS.ANDHRA_PRADESH,
      country: 'India',
      isActive: true,
      verificationStatus: 'verified',
    }
  );

  overrides.set(
    idString(IDS.MACHERLA),
    {
      ...cloneDoc(anchorDocs.macherla),
      parentId: IDS.GUNTUR_ANDHRA,
      level: 'city',
      country: 'India',
      isActive: true,
      verificationStatus: 'verified',
    }
  );

  return overrides;
}

function applyCoreLocationUpdates(anchorDocs) {
  if (anchorDocs.india.verificationStatus !== 'verified') {
    locations.updateOne(
      { _id: IDS.INDIA_COUNTRY },
      { $set: { verificationStatus: 'verified' } }
    );
    print('[done] India verificationStatus set to verified');
  } else {
    print('[skip] India already verified');
  }

  const gunturSet = {
    level: 'district',
    parentId: IDS.ANDHRA_PRADESH,
    country: 'India',
    isActive: true,
    verificationStatus: 'verified',
  };
  const gunturNeedsUpdate =
    anchorDocs.gunturAndhra.level !== 'district' ||
    !sameId(anchorDocs.gunturAndhra.parentId, IDS.ANDHRA_PRADESH) ||
    anchorDocs.gunturAndhra.country !== 'India' ||
    anchorDocs.gunturAndhra.verificationStatus !== 'verified' ||
    anchorDocs.gunturAndhra.isActive !== true;

  if (gunturNeedsUpdate) {
    locations.updateOne({ _id: IDS.GUNTUR_ANDHRA }, { $set: gunturSet });
    print('[done] Andhra Pradesh Guntur converted to district in place');
  } else {
    print('[skip] Andhra Pradesh Guntur already matches target district shape');
  }

  const macherlaSet = {
    parentId: IDS.GUNTUR_ANDHRA,
    level: 'city',
    country: 'India',
    isActive: true,
    verificationStatus: 'verified',
  };
  const macherlaNeedsUpdate =
    !sameId(anchorDocs.macherla.parentId, IDS.GUNTUR_ANDHRA) ||
    anchorDocs.macherla.level !== 'city' ||
    anchorDocs.macherla.country !== 'India' ||
    anchorDocs.macherla.verificationStatus !== 'verified' ||
    anchorDocs.macherla.isActive !== true;

  if (macherlaNeedsUpdate) {
    locations.updateOne({ _id: IDS.MACHERLA }, { $set: macherlaSet });
    print('[done] Macherla reparented under Guntur district');
  } else {
    print('[skip] Macherla already linked under Guntur district');
  }
}

function refreshAffectedLocationPaths(affectedLocationIds, overrides = new Map()) {
  const cache = new Map();
  const summary = [];

  for (const locationId of affectedLocationIds) {
    const location = fetchRequiredLocation(locationId, idString(locationId), overrides);
    const nextPath = computePathFor(locationId, cache, new Set(), overrides).map((entry) => ObjectId(idString(entry)));
    const currentPath = Array.isArray(location.path) ? location.path : [];
    const samePath =
      currentPath.length === nextPath.length &&
      currentPath.every((entry, index) => sameId(entry, nextPath[index]));

    summary.push({
      id: idString(locationId),
      name: location.name,
      level: location.level,
      currentPath: currentPath.map((entry) => idString(entry)),
      nextPath: nextPath.map((entry) => idString(entry)),
      changed: !samePath,
    });

    if (APPLY && !samePath) {
      locations.updateOne({ _id: locationId }, { $set: { path: nextPath } });
    }
  }

  return summary;
}

function refreshAffectedAdPaths(affectedAds, overrides = new Map()) {
  const cache = new Map();
  const summary = [];

  for (const ad of affectedAds) {
    const locationId = ad.location?.locationId;
    if (!locationId) continue;

    const nextPath = computePathFor(locationId, cache, new Set(), overrides).map((entry) => ObjectId(idString(entry)));
    const currentPath = Array.isArray(ad.locationPath) ? ad.locationPath : [];
    const samePath =
      currentPath.length === nextPath.length &&
      currentPath.every((entry, index) => sameId(entry, nextPath[index]));

    summary.push({
      adId: idString(ad._id),
      locationId: idString(locationId),
      currentPath: currentPath.map((entry) => idString(entry)),
      nextPath: nextPath.map((entry) => idString(entry)),
      changed: !samePath,
    });

    if (APPLY && !samePath) {
      ads.updateOne({ _id: ad._id }, { $set: { locationPath: nextPath } });
    }
  }

  return summary;
}

function main() {
  printSection('Context');
  print(`Database: ${db.getName()}`);
  print(`Mode: ${APPLY ? 'APPLY' : 'DRY_RUN'}`);
  print(`Started: ${new Date().toISOString()}`);

  printSection('Prechecks');
  const anchorDocs = verifyAnchors();
  printjson({
    india: formatLocation(anchorDocs.india),
    gunturAndhra: formatLocation(anchorDocs.gunturAndhra),
    gunturTelangana: formatLocation(anchorDocs.gunturTelangana),
    macherla: formatLocation(anchorDocs.macherla),
  });

  const plan = planOperations(anchorDocs);
  printSection('Planned Changes');
  printjson({
    willVerifyIndia: plan.willVerifyIndia,
    willConvertGunturToDistrict: plan.willConvertGunturToDistrict,
    willReparentMacherla: plan.willReparentMacherla,
    affectedLocationCount: plan.affectedLocationIds.length,
    affectedAdCount: plan.affectedAds.length,
    affectedLocationIds: plan.affectedLocationIds.map((value) => idString(value)),
  });

  if (!APPLY) {
    const dryRunOverrides = buildPlannedLocationOverrides(anchorDocs);
    const locationPathSummary = refreshAffectedLocationPaths(plan.affectedLocationIds, dryRunOverrides);
    const adPathSummary = refreshAffectedAdPaths(plan.affectedAds, dryRunOverrides);

    printSection('Dry Run Path Changes');
    printjson({
      willVerifyIndia: plan.willVerifyIndia,
      willConvertGunturToDistrict: plan.willConvertGunturToDistrict,
      willReparentMacherla: plan.willReparentMacherla,
      changedLocations: locationPathSummary.filter((entry) => entry.changed),
      changedAds: adPathSummary.filter((entry) => entry.changed),
    });

    printSection('Complete');
    print('Dry run completed. Re-run with APPLY=1 to execute.');
    return;
  }

  printSection('Apply');
  applyCoreLocationUpdates(anchorDocs);

  const locationPathSummary = refreshAffectedLocationPaths(plan.affectedLocationIds);
  const adPathSummary = refreshAffectedAdPaths(plan.affectedAds);

  printSection('Applied Changes');
  printjson({
    updatedLocations: locationPathSummary.filter((entry) => entry.changed),
    updatedAds: adPathSummary.filter((entry) => entry.changed),
  });

  printSection('Complete');
  print('India / Guntur / Macherla hierarchy remediation applied successfully.');
}

main();
