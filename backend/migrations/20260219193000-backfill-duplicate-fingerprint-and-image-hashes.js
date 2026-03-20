const LIVE_STATUSES = ['active', 'pending'];
const MIGRATION_TAG = '20260219193000_backfill_duplicate_fingerprint_and_image_hashes';
const CONFLICT_COLLECTION = 'duplicate_fingerprint_conflicts';
const REPORT_COLLECTION = 'duplicate_fingerprint_backfill_reports';
const BATCH_SIZE = 500;

const normalizeObjectIdString = (value) => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value.toString) {
    const converted = value.toString();
    if (typeof converted === 'string' && converted !== '[object Object]' && converted.trim().length > 0) {
      return converted.trim();
    }
  }
  return undefined;
};

const normalizeImageHashes = (images, createHash) => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => typeof img === 'string' && img.trim().length > 0)
    .map((img) => img.trim().toLowerCase().replace(/#.*$/, ''))
    .map((normalized) => createHash('sha256').update(normalized).digest('hex'));
};

const buildDuplicateFingerprint = (ad, createHash) => {
  const sellerId = normalizeObjectIdString(ad.sellerId);
  const categoryId = normalizeObjectIdString(ad.categoryId);
  const locationId = normalizeObjectIdString(ad?.location?.locationId);
  if (!sellerId || !categoryId || !locationId) return undefined;

  const brandId = normalizeObjectIdString(ad.brandId) || 'none';
  const modelId = normalizeObjectIdString(ad.modelId) || 'none';
  const basis = [sellerId, categoryId, brandId, modelId, locationId].join('|');

  return createHash('sha256').update(basis).digest('hex');
};

const arrayEquals = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const enqueue = async (ops, collection, op) => {
  ops.push(op);
  if (ops.length >= BATCH_SIZE) {
    await collection.bulkWrite(ops, { ordered: false });
    ops.length = 0;
  }
};

const isEquivalentIndexConflict = (error) => {
  if (!error || typeof error !== 'object') return false;
  const message = typeof error.message === 'string' ? error.message : '';
  return (
    error.codeName === 'IndexOptionsConflict' ||
    /index already exists with a different name/i.test(message)
  );
};

const ensureIndex = async (collection, keys, options) => {
  try {
    await collection.createIndex(keys, options);
  } catch (error) {
    if (isEquivalentIndexConflict(error)) {
      return;
    }
    throw error;
  }
};

module.exports = {
  async up(db) {
    const { createHash } = await import('crypto');
    const ads = db.collection('ads');
    const conflicts = db.collection(CONFLICT_COLLECTION);
    const reports = db.collection(REPORT_COLLECTION);
    const strictIndexRequested = process.env.ENABLE_STRICT_DUPLICATE_INDEX === 'true';
    const resolutionPolicy = {
      strategy: 'first_seen_wins',
      canonicalSelectionOrder: ['createdAt ASC', '_id ASC'],
      duplicateAction: 'mark_duplicate_and_link',
      minDuplicateScore: 60,
      strictIndexGate: 'ENABLE_STRICT_DUPLICATE_INDEX=true and zero unresolved conflicts',
    };

    const liveFilter = {
      status: { $in: LIVE_STATUSES },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

    const projection = {
      sellerId: 1,
      categoryId: 1,
      brandId: 1,
      modelId: 1,
      location: 1,
      images: 1,
      imageHashes: 1,
      duplicateFingerprint: 1,
      duplicateOf: 1,
      isDuplicateFlag: 1,
      duplicateScore: 1,
      status: 1,
      createdAt: 1,
    };

    const fingerprintOwnerMap = new Map();
    const adOps = [];
    const conflictOps = [];

    let scanned = 0;
    let updated = 0;
    let conflictCount = 0;
    let strictIndexCreated = false;

    const cursor = ads.find(liveFilter, { projection }).sort({ createdAt: 1, _id: 1 });

    while (await cursor.hasNext()) {
      const ad = await cursor.next();
      if (!ad) break;
      scanned += 1;

      const imageHashes = normalizeImageHashes(ad.images, createHash);
      const fingerprint = buildDuplicateFingerprint(ad, createHash);
      const setUpdate = {};
      const unsetUpdate = {};

      if (!arrayEquals(ad.imageHashes || [], imageHashes)) {
        setUpdate.imageHashes = imageHashes;
      }

      if (fingerprint) {
        const ownerAdId = fingerprintOwnerMap.get(fingerprint);

        if (!ownerAdId) {
          fingerprintOwnerMap.set(fingerprint, ad._id);
          if (ad.duplicateFingerprint !== fingerprint) {
            setUpdate.duplicateFingerprint = fingerprint;
          }
        } else {
          conflictCount += 1;
          unsetUpdate.duplicateFingerprint = '';
          setUpdate.duplicateOf = ownerAdId;
          setUpdate.isDuplicateFlag = true;
          setUpdate.duplicateScore = Math.max(Number(ad.duplicateScore || 0), 60);

          await enqueue(conflictOps, conflicts, {
            updateOne: {
              filter: {
                migrationTag: MIGRATION_TAG,
                adId: ad._id,
                canonicalAdId: ownerAdId,
              },
              update: {
                $set: {
                  migrationTag: MIGRATION_TAG,
                  fingerprint,
                  adId: ad._id,
                  canonicalAdId: ownerAdId,
                  sellerId: ad.sellerId,
                  status: ad.status,
                  createdAt: ad.createdAt,
                  resolvedByMigration: true,
                  resolutionPolicy,
                  updatedAt: new Date(),
                },
                $setOnInsert: {
                  insertedAt: new Date(),
                },
              },
              upsert: true,
            },
          });
        }
      } else if (ad.duplicateFingerprint !== undefined) {
        unsetUpdate.duplicateFingerprint = '';
      }

      if (Object.keys(setUpdate).length > 0 || Object.keys(unsetUpdate).length > 0) {
        updated += 1;
        await enqueue(adOps, ads, {
          updateOne: {
            filter: { _id: ad._id },
            update: {
              ...(Object.keys(setUpdate).length > 0 ? { $set: setUpdate } : {}),
              ...(Object.keys(unsetUpdate).length > 0 ? { $unset: unsetUpdate } : {}),
            },
          },
        });
      }
    }

    if (adOps.length > 0) {
      await ads.bulkWrite(adOps, { ordered: false });
    }
    if (conflictOps.length > 0) {
      await conflicts.bulkWrite(conflictOps, { ordered: false });
    }

    await ensureIndex(conflicts, { migrationTag: 1, adId: 1, canonicalAdId: 1 }, { unique: true });
    await ensureIndex(conflicts, { fingerprint: 1, updatedAt: -1 });

    await ensureIndex(
      ads,
      { sellerId: 1, status: 1, categoryId: 1, brandId: 1, modelId: 1, 'location.locationId': 1, createdAt: -1 },
      { name: 'seller_status_category_brand_model_location_createdAt' }
    );

    await ensureIndex(ads, { duplicateFingerprint: 1 }, { name: 'duplicateFingerprint_lookup_1' });
    if (strictIndexRequested && conflictCount === 0) {
      await ensureIndex(
        ads,
        { duplicateFingerprint: 1 },
        {
          name: 'duplicateFingerprint_1',
          unique: true,
          partialFilterExpression: {
            status: { $in: LIVE_STATUSES },
            duplicateFingerprint: { $exists: true },
            $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
          },
        }
      );
      strictIndexCreated = true;
    }

    await reports.updateOne(
      { migrationTag: MIGRATION_TAG },
      {
        $set: {
          migrationTag: MIGRATION_TAG,
          scanned,
          updated,
          conflictCount,
          strictIndexRequested,
          strictIndexCreated,
          resolutionPolicy,
          completedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    await ensureIndex(reports, { migrationTag: 1 }, { unique: true });

    console.info(
      `[migration:${MIGRATION_TAG}] scanned=${scanned} updated=${updated} conflicts=${conflictCount} strictIndexRequested=${strictIndexRequested} strictIndexCreated=${strictIndexCreated}`
    );
    if (strictIndexRequested && conflictCount > 0) {
      console.warn(
        `[migration:${MIGRATION_TAG}] strict unique index skipped because conflicts remain; review ${CONFLICT_COLLECTION} and ${REPORT_COLLECTION} before enabling strict mode`
      );
    }
  },

  async down(db) {
    const ads = db.collection('ads');
    const conflicts = db.collection(CONFLICT_COLLECTION);
    const reports = db.collection(REPORT_COLLECTION);

    try {
      await ads.dropIndex('duplicateFingerprint_1');
    } catch {
      // ignore index-missing rollback
    }

    try {
      await ads.dropIndex('seller_status_category_brand_model_location_createdAt');
    } catch {
      // ignore index-missing rollback
    }

    try {
      await ads.dropIndex('duplicateFingerprint_lookup_1');
    } catch {
      // ignore index-missing rollback
    }

    await conflicts.deleteMany({ migrationTag: MIGRATION_TAG });
    await reports.deleteMany({ migrationTag: MIGRATION_TAG });
  },
};
