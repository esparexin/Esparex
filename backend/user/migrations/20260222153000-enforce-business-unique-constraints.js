const MIGRATION_TAG = '20260222153000_enforce_business_unique_constraints';
const REPORT_COLLECTION = 'business_unique_index_audit';
const COLLECTION = 'businesses';
const ACTIVE_PARTIAL_FILTER = { isDeleted: false };

const INDEX_NAMES = {
  user: 'business_user_unique_active',
  gst: 'business_gst_unique_active_ci',
  registration: 'business_registration_unique_active_ci',
};

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const normalizeObjectIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value.toString) return value.toString();
  return '';
};

const keyMatches = (actual, expected) => {
  const actualKeys = Object.keys(actual || {});
  const expectedKeys = Object.keys(expected || {});
  if (actualKeys.length !== expectedKeys.length) return false;
  return expectedKeys.every((key) => actual[key] === expected[key]);
};

const findDuplicateGroups = (entries) =>
  entries
    .filter(([, ids]) => ids.length > 1)
    .map(([value, ids]) => ({
      value,
      ids,
      count: ids.length,
    }));

module.exports = {
  async up(db) {
    const businesses = db.collection(COLLECTION);
    const reports = db.collection(REPORT_COLLECTION);
    const startedAt = new Date();
    const collectionExists = await db
      .listCollections({ name: COLLECTION }, { nameOnly: true })
      .hasNext();

    if (collectionExists) {
      await businesses.updateMany(
        { isDeleted: { $exists: false } },
        { $set: { isDeleted: false } }
      );
      await businesses.updateMany(
        { gstNumber: { $type: 'string', $regex: '^\\s*$' } },
        { $unset: { gstNumber: '' } }
      );
      await businesses.updateMany(
        { registrationNumber: { $type: 'string', $regex: '^\\s*$' } },
        { $unset: { registrationNumber: '' } }
      );
    }

    const activeFilter = { isDeleted: false };

    const projection = {
      userId: 1,
      gstNumber: 1,
      registrationNumber: 1,
      createdAt: 1,
    };

    const userMap = new Map();
    const gstMap = new Map();
    const registrationMap = new Map();

    const cursor = collectionExists
      ? businesses.find(activeFilter, { projection }).sort({ createdAt: 1, _id: 1 })
      : [];
    let scanned = 0;

    if (collectionExists) {
      while (await cursor.hasNext()) {
        const business = await cursor.next();
        if (!business) break;
        scanned += 1;

        const id = normalizeObjectIdString(business._id);
        const userId = normalizeObjectIdString(business.userId);
        const gst = normalizeOptionalText(business.gstNumber);
        const registration = normalizeOptionalText(business.registrationNumber);

        if (userId) {
          const userEntries = userMap.get(userId) || [];
          userEntries.push(id);
          userMap.set(userId, userEntries);
        }

        if (gst) {
          const gstEntries = gstMap.get(gst) || [];
          gstEntries.push(id);
          gstMap.set(gst, gstEntries);
        }

        if (registration) {
          const registrationEntries = registrationMap.get(registration) || [];
          registrationEntries.push(id);
          registrationMap.set(registration, registrationEntries);
        }
      }
    }

    const duplicateUserGroups = findDuplicateGroups(Array.from(userMap.entries()));
    const duplicateGstGroups = findDuplicateGroups(Array.from(gstMap.entries()));
    const duplicateRegistrationGroups = findDuplicateGroups(Array.from(registrationMap.entries()));

    const duplicateSummary = {
      duplicateUsers: duplicateUserGroups.length,
      duplicateGstNumbers: duplicateGstGroups.length,
      duplicateRegistrationNumbers: duplicateRegistrationGroups.length,
    };

    await reports.updateOne(
      { migrationTag: MIGRATION_TAG },
      {
        $set: {
          migrationTag: MIGRATION_TAG,
          scanned,
          duplicateSummary,
          duplicateUserGroups,
          duplicateGstGroups,
          duplicateRegistrationGroups,
          completedAt: new Date(),
        },
        $setOnInsert: { createdAt: startedAt },
      },
      { upsert: true }
    );
    await reports.createIndex({ migrationTag: 1 }, { unique: true });

    const hasConflicts =
      duplicateUserGroups.length > 0 ||
      duplicateGstGroups.length > 0 ||
      duplicateRegistrationGroups.length > 0;

    if (hasConflicts) {
      throw new Error(
        `[migration:${MIGRATION_TAG}] duplicate active business records detected. ` +
        `Resolve conflicts in ${REPORT_COLLECTION} before rerunning migration. ` +
        `Summary: ${JSON.stringify(duplicateSummary)}`
      );
    }

    const indexes = collectionExists ? await businesses.indexes() : [];

    const dropIndexesByKey = async (expectedKey) => {
      const dropCandidates = indexes.filter(
        (index) => keyMatches(index.key, expectedKey) && !Object.values(INDEX_NAMES).includes(index.name)
      );

      for (const index of dropCandidates) {
        if (index.name && index.name !== '_id_') {
          await businesses.dropIndex(index.name);
        }
      }
    };

    await dropIndexesByKey({ userId: 1 });
    await dropIndexesByKey({ gstNumber: 1 });
    await dropIndexesByKey({ registrationNumber: 1 });

    await businesses.createIndex(
      { userId: 1 },
      {
        name: INDEX_NAMES.user,
        unique: true,
        partialFilterExpression: ACTIVE_PARTIAL_FILTER,
      }
    );

    await businesses.createIndex(
      { gstNumber: 1 },
      {
        name: INDEX_NAMES.gst,
        unique: true,
        partialFilterExpression: {
          ...ACTIVE_PARTIAL_FILTER,
          gstNumber: { $exists: true, $type: 'string' },
        },
        collation: { locale: 'en', strength: 2 },
      }
    );

    await businesses.createIndex(
      { registrationNumber: 1 },
      {
        name: INDEX_NAMES.registration,
        unique: true,
        partialFilterExpression: {
          ...ACTIVE_PARTIAL_FILTER,
          registrationNumber: { $exists: true, $type: 'string' },
        },
        collation: { locale: 'en', strength: 2 },
      }
    );

    console.info(
      `[migration:${MIGRATION_TAG}] scanned=${scanned} indexesCreated=${JSON.stringify(INDEX_NAMES)}`
    );
  },

  async down(db) {
    const businesses = db.collection(COLLECTION);
    const reports = db.collection(REPORT_COLLECTION);

    for (const indexName of Object.values(INDEX_NAMES)) {
      try {
        await businesses.dropIndex(indexName);
      } catch {
        // Ignore missing index on rollback
      }
    }

    await businesses.createIndex({ userId: 1 }, { name: 'userId_1' });
    await businesses.createIndex({ gstNumber: 1 }, { name: 'gstNumber_1' });
    await businesses.createIndex({ registrationNumber: 1 }, { name: 'registrationNumber_1' });
    await reports.deleteMany({ migrationTag: MIGRATION_TAG });
  },
};
