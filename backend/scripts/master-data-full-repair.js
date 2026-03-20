#!/usr/bin/env node
/**
 * master-data-full-repair.js
 *
 * Esparex Master Data Repair — Full 9-Step Pipeline
 *
 * Audits and repairs the esparex_admin database to ensure:
 *   - categories, brands, models, spareparts, screensizes
 *   are clean, correctly linked, de-duplicated, and have proper indexes.
 *
 * Steps:
 *   1. Detect legacy / alternate collection names
 *   2. Rename legacy collections to canonical names
 *   3. Repair Category → Brand hierarchy (null/missing categoryId)
 *   4. Merge duplicate brand names (case-insensitive, per categoryId)
 *   5. Repair Spare Parts hierarchy (validate/repair categories[])
 *   6. Normalize screen size string formats (e.g. "32 inch" → '32"')
 *   7. Ensure required compound indexes exist
 *   8. Activate valid records; deactivate / flag orphans
 *   9. Print final integrity report
 *
 * Usage:
 *   node scripts/master-data-full-repair.js              # live write
 *   node scripts/master-data-full-repair.js --dry-run    # audit only
 *
 * Database: esparex_admin  (reads ADMIN_MONGODB_URI or MONGODB_URI env var)
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');

const DRY_RUN = process.argv.includes('--dry-run');
const adminUri =
  process.env.ADMIN_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/esparex_admin';

// ─── Canonical collection names ───────────────────────────────────────────────

const CANON = {
  categories:      'categories',
  brands:          'brands',
  models:          'models',
  spareparts:      'spareparts',
  sparepartTypes:  'spare_part_types',
  screensizes:     'screensizes',
};

/**
 * Legacy collection name → canonical name mappings.
 * These are the names that should NOT exist in the database.
 */
const LEGACY_RENAMES = [
  { from: 'category',          to: CANON.categories  },
  { from: 'Category',          to: CANON.categories  },
  { from: 'CATEGORY',          to: CANON.categories  },
  { from: 'master_categories', to: CANON.categories  },
  { from: 'brand',             to: CANON.brands      },
  { from: 'Brand',             to: CANON.brands      },
  { from: 'BRAND',             to: CANON.brands      },
  { from: 'master_brands',     to: CANON.brands      },
  { from: 'spare_parts',       to: CANON.spareparts  },
  { from: 'spareParts',        to: CANON.spareparts  },
  { from: 'SparePart',         to: CANON.spareparts  },
  { from: 'sparepart',         to: CANON.spareparts  },
  { from: 'screen_sizes',      to: CANON.screensizes },
  { from: 'screenSize',        to: CANON.screensizes },
  { from: 'ScreenSize',        to: CANON.screensizes },
  { from: 'screen_size',       to: CANON.screensizes },
];

// ─── Accumulated report ───────────────────────────────────────────────────────

const report = {
  legacyCollectionsFound:    [],
  collectionsRenamed:        [],
  brandsRepaired:            0,
  brandsOrphaned:            0,
  duplicateBrandGroupsFound: 0,
  duplicateBrandsMerged:     0,
  sparePartsRepaired:        0,
  sparePartsOrphaned:        0,
  screenSizesNormalized:     0,
  indexesEnsured:            [],
  recordsActivated:          0,
  recordsDeactivated:        0,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`[repair] ${msg}`);
const warn = (msg) => console.warn(`[repair][WARN] ${msg}`);

/**
 * Parse a raw screen size string to its numeric inches value.
 * Handles: "32 inch", "32\"", "32", "32in", "43.0 inches"
 */
function parseInches(raw) {
  if (!raw) return null;
  const s = String(raw)
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s*(inches?|in)\b/g, '')
    .trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Produce canonical size string: 32 → '32"' */
function canonicalSize(inches) {
  // Use integer representation if whole number
  const display = Number.isInteger(inches) ? inches : inches;
  return `${display}"`;
}

/** Best-effort URL slug from name string */
function toSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Execute a bulkWrite respecting the --dry-run flag.
 * Returns the count of ops that would have / did run.
 */
async function bulkWrite(collection, ops, label) {
  if (!ops.length) return 0;
  if (DRY_RUN) {
    log(`  [DRY-RUN] ${label}: would run ${ops.length} op(s)`);
    return ops.length;
  }
  const result = await collection.bulkWrite(ops, { ordered: false });
  const count = result.modifiedCount ?? 0;
  log(`  ${label}: ${count} document(s) modified`);
  return count;
}

// ─── Step 1: Detect legacy collections ───────────────────────────────────────

async function step1_detectLegacyCollections(db) {
  log('━━ Step 1 ─ Detecting legacy / alternate collection names …');

  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  );

  for (const { from, to } of LEGACY_RENAMES) {
    if (!existing.has(from)) continue;
    const count = await db.collection(from).estimatedDocumentCount();
    const info = `"${from}" found (${count} docs) — canonical name is "${to}"`;
    report.legacyCollectionsFound.push(info);
    warn(info);
  }

  if (report.legacyCollectionsFound.length === 0) {
    log('  All collection names are canonical — nothing to flag.');
  }
}

// ─── Step 2: Rename legacy collections ───────────────────────────────────────

async function step2_renameLegacyCollections(db) {
  log('━━ Step 2 ─ Renaming legacy collections to canonical names …');

  const colList = await db.listCollections({}, { nameOnly: true }).toArray();
  const existing = new Set(colList.map((c) => c.name));

  for (const { from, to } of LEGACY_RENAMES) {
    if (!existing.has(from)) continue;

    if (existing.has(to)) {
      warn(
        `Cannot rename "${from}" → "${to}": canonical collection already exists. ` +
        'Manual de-duplication required before rename.',
      );
      continue;
    }

    if (DRY_RUN) {
      log(`  [DRY-RUN] Would rename "${from}" → "${to}"`);
    } else {
      await db.renameCollection(from, to);
      log(`  Renamed "${from}" → "${to}"`);
      existing.delete(from);
      existing.add(to);
    }
    report.collectionsRenamed.push(`${from} → ${to}`);
  }

  if (report.collectionsRenamed.length === 0) {
    log('  No renames required.');
  }
}

// ─── Step 3: Repair Category → Brand hierarchy ───────────────────────────────

async function step3_repairBrandCategoryHierarchy(db) {
  log('━━ Step 3 ─ Repairing Category → Brand hierarchy …');

  // Build lookup maps from all active, non-deleted categories
  const categories = await db
    .collection(CANON.categories)
    .find({ isDeleted: { $ne: true }, isActive: true })
    .project({ _id: 1, name: 1, slug: 1 })
    .toArray();

  /** Map: lowercase trimmed name → ObjectId */
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c._id]));
  /** Map: slug → ObjectId */
  const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  // Brands with null or absent categoryId
  const orphanBrands = await db
    .collection(CANON.brands)
    .find({
      isDeleted: { $ne: true },
      $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
    })
    .toArray();

  log(`  Found ${orphanBrands.length} brand(s) with null/missing categoryId`);

  const repairOps = [];
  const orphanOps = [];

  for (const brand of orphanBrands) {
    const nameLower = (brand.name ?? '').toLowerCase().trim();
    // 1st: try exact name match against category names
    let matchedCatId = catByName.get(nameLower) ?? null;
    // 2nd: try slug match
    if (!matchedCatId) {
      matchedCatId = catBySlug.get(toSlug(brand.name ?? '')) ?? null;
    }

    if (matchedCatId) {
      repairOps.push({
        updateOne: {
          filter: { _id: brand._id },
          update: { $set: { categoryId: matchedCatId, needsReview: false } },
        },
      });
      report.brandsRepaired++;
    } else {
      orphanOps.push({
        updateOne: {
          filter: { _id: brand._id },
          update: { $set: { isActive: false, needsReview: true } },
        },
      });
      report.brandsOrphaned++;
    }
  }

  await bulkWrite(db.collection(CANON.brands), repairOps, 'brands.repairCategoryId');
  await bulkWrite(db.collection(CANON.brands), orphanOps, 'brands.flagOrphan');
  log(`  Repaired: ${report.brandsRepaired}  |  Flagged as orphan: ${report.brandsOrphaned}`);
}

// ─── Step 4: Merge duplicate brands ──────────────────────────────────────────

async function step4_mergeDuplicateBrands(db) {
  log('━━ Step 4 ─ Detecting and merging duplicate brand names …');

  // Group by { nameLower, categoryId } — find groups with > 1 document
  const duplicateGroups = await db
    .collection(CANON.brands)
    .aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          categoryId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            nameLower: { $toLower: { $trim: { input: '$name' } } },
            categoryId: '$categoryId',
          },
          docs: {
            $push: { id: '$_id', name: '$name', slug: '$slug', createdAt: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  report.duplicateBrandGroupsFound = duplicateGroups.length;
  log(`  Found ${duplicateGroups.length} duplicate group(s)`);

  for (const group of duplicateGroups) {
    // Sort ascending by createdAt (or ObjectId timestamp) → keep the oldest
    const sorted = group.docs.sort((a, b) => {
      const ta = a.createdAt
        ? new Date(a.createdAt).getTime()
        : (a.id.getTimestamp?.() ?? new Date(0)).getTime();
      const tb = b.createdAt
        ? new Date(b.createdAt).getTime()
        : (b.id.getTimestamp?.() ?? new Date(0)).getTime();
      return ta - tb;
    });

    const canonical = sorted[0];
    const dupes     = sorted.slice(1);

    log(
      `  Keeping "${canonical.name}" (${canonical.id}), ` +
      `merging ${dupes.length} duplicate(s)`,
    );

    for (const dupe of dupes) {
      if (DRY_RUN) {
        log(`  [DRY-RUN] Would merge brand ${dupe.id} → ${canonical.id}`);
        report.duplicateBrandsMerged++;
        continue;
      }

      // Reassign models that reference the duplicate brand
      await db
        .collection(CANON.models)
        .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

      // Reassign spare parts that reference the duplicate brand
      await db
        .collection(CANON.spareparts)
        .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

      // Reassign screen sizes that reference the duplicate brand
      await db
        .collection(CANON.screensizes)
        .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

      // Soft-delete the duplicate brand
      await db.collection(CANON.brands).updateOne(
        { _id: dupe.id },
        {
          $set: {
            isDeleted:        true,
            deletedAt:        new Date(),
            isActive:         false,
            status:           'rejected',
            rejectionReason:  `Duplicate — merged into brand ${canonical.id} (${canonical.name})`,
          },
        },
      );

      report.duplicateBrandsMerged++;
    }
  }

  log(`  Merged: ${report.duplicateBrandsMerged} duplicate brand(s)`);
}

// ─── Step 5: Repair spare parts hierarchy ────────────────────────────────────

async function step5_repairSparePartsHierarchy(db) {
  log('━━ Step 5 ─ Repairing spare parts hierarchy …');

  // Valid active category IDs (as strings for Set membership)
  const validCatIds = new Set(
    (
      await db
        .collection(CANON.categories)
        .find({ isDeleted: { $ne: true }, isActive: true })
        .project({ _id: 1 })
        .toArray()
    ).map((c) => c._id.toString()),
  );

  // Brand → categoryId map (active brands only)
  const brandCatMap = new Map(
    (
      await db
        .collection(CANON.brands)
        .find({ isDeleted: { $ne: true }, isActive: true, categoryId: { $exists: true, $ne: null } })
        .project({ _id: 1, categoryId: 1 })
        .toArray()
    ).map((b) => [b._id.toString(), b.categoryId]),
  );

  // ── 5a: Parts with empty/missing categories ──
  const missingCatParts = await db
    .collection(CANON.spareparts)
    .find({
      isDeleted: { $ne: true },
      $or: [
        { categories: { $exists: false } },
        { categories: null },
        { categories: { $size: 0 } },
      ],
    })
    .toArray();

  log(`  Found ${missingCatParts.length} spare part(s) with empty/missing categories`);

  const repairOps = [];
  const orphanOps = [];

  for (const part of missingCatParts) {
    let derivedCatId = null;
    if (part.brandId) {
      derivedCatId = brandCatMap.get(part.brandId.toString()) ?? null;
    }

    if (derivedCatId && validCatIds.has(derivedCatId.toString())) {
      repairOps.push({
        updateOne: {
          filter: { _id: part._id },
          update: { $set: { categories: [derivedCatId], needsReview: false } },
        },
      });
      report.sparePartsRepaired++;
    } else {
      orphanOps.push({
        updateOne: {
          filter: { _id: part._id },
          update: { $set: { isActive: false, needsReview: true } },
        },
      });
      report.sparePartsOrphaned++;
    }
  }

  // ── 5b: Parts that have categories but some refs are stale (deleted/inactive) ──
  const allActiveParts = await db
    .collection(CANON.spareparts)
    .find({
      isDeleted: { $ne: true },
      categories: { $exists: true, $not: { $size: 0 } },
    })
    .project({ _id: 1, categories: 1 })
    .toArray();

  const staleOps = [];
  for (const part of allActiveParts) {
    const cats = part.categories ?? [];
    const validCats = cats.filter((id) => id && validCatIds.has(id.toString()));

    if (validCats.length === cats.length) continue; // nothing stale

    if (validCats.length === 0) {
      // All category refs are stale → cannot auto-repair, flag
      orphanOps.push({
        updateOne: {
          filter: { _id: part._id },
          update: { $set: { isActive: false, needsReview: true, categories: [] } },
        },
      });
      report.sparePartsOrphaned++;
    } else {
      // Prune stale refs, keep valid ones
      staleOps.push({
        updateOne: {
          filter: { _id: part._id },
          update: { $set: { categories: validCats } },
        },
      });
    }
  }

  await bulkWrite(db.collection(CANON.spareparts), repairOps,  'spareparts.repairCategories');
  await bulkWrite(db.collection(CANON.spareparts), staleOps,   'spareparts.pruneStaleCategories');
  await bulkWrite(db.collection(CANON.spareparts), orphanOps,  'spareparts.flagOrphan');
  log(`  Repaired: ${report.sparePartsRepaired}  |  Flagged as orphan: ${report.sparePartsOrphaned}`);
}

// ─── Step 6: Normalize screen size strings ────────────────────────────────────

async function step6_normalizeScreenSizes(db) {
  log('━━ Step 6 ─ Normalizing screen size string formats …');

  const screensizes = await db
    .collection(CANON.screensizes)
    .find({ isDeleted: { $ne: true } })
    .toArray();

  const normalizeOps = [];

  for (const ss of screensizes) {
    const inches = parseInches(ss.size);
    if (inches === null) {
      warn(`  Cannot parse size "${ss.size}" on screensize ${ss._id} — skipping`);
      continue;
    }

    const canonical  = canonicalSize(inches);
    const needsSize  = ss.size !== canonical;
    const needsValue = ss.value == null || ss.value !== inches;
    const needsName  = !ss.name || ss.name.trim() === '';

    if (!needsSize && !needsValue && !needsName) continue;

    const $set = {};
    if (needsSize)  $set.size  = canonical;
    if (needsValue) $set.value = inches;
    if (needsName)  $set.name  = canonical;

    normalizeOps.push({
      updateOne: { filter: { _id: ss._id }, update: { $set } },
    });
    report.screenSizesNormalized++;
  }

  await bulkWrite(db.collection(CANON.screensizes), normalizeOps, 'screensizes.normalize');
  log(`  Normalized: ${report.screenSizesNormalized} screen size(s)`);
}

// ─── Step 7: Ensure required indexes ─────────────────────────────────────────

async function step7_ensureIndexes(db) {
  log('━━ Step 7 ─ Ensuring required compound indexes …');

  const desiredIndexes = [
    // brands
    {
      col: CANON.brands,
      key: { categoryId: 1 },
      options: { name: 'brand_categoryId_idx', background: true },
    },
    {
      col: CANON.brands,
      key: { name: 1, categoryId: 1 },
      options: {
        name: 'brand_name_categoryId_text_idx',
        collation: { locale: 'en', strength: 2 },
        background: true,
      },
    },
    // spareparts
    {
      col: CANON.spareparts,
      key: { brandId: 1 },
      options: { name: 'sparepart_brandId_idx', background: true },
    },
    {
      col: CANON.spareparts,
      key: { categories: 1 },
      options: { name: 'sparepart_categories_idx', background: true },
    },
    {
      col: CANON.spareparts,
      key: { categories: 1, isActive: 1 },
      options: { name: 'sparepart_categories_active_idx', background: true },
    },
    // categories
    {
      col: CANON.categories,
      key: { slug: 1 },
      options: {
        name: 'category_slug_unique_idx',
        unique: true,
        background: true,
        partialFilterExpression: { isDeleted: { $ne: true } },
      },
    },
    // screensizes
    {
      col: CANON.screensizes,
      key: { categoryId: 1, isActive: 1 },
      options: { name: 'screensize_categoryId_active_idx', background: true },
    },
    // models
    {
      col: CANON.models,
      key: { brandId: 1, categoryId: 1 },
      options: { name: 'model_brand_category_idx', background: true },
    },
  ];

  const colListRaw = await db.listCollections({}, { nameOnly: true }).toArray();
  const existingCols = new Set(colListRaw.map((c) => c.name));

  for (const { col, key, options } of desiredIndexes) {
    if (!existingCols.has(col)) {
      warn(`  Collection "${col}" does not exist — skipping index "${options.name}"`);
      continue;
    }

    const currentIndexes = await db.collection(col).indexes();
    if (currentIndexes.some((idx) => idx.name === options.name)) {
      log(`  Index "${options.name}" already exists — OK`);
      continue;
    }

    if (DRY_RUN) {
      log(`  [DRY-RUN] Would create index "${options.name}" on "${col}"`);
    } else {
      try {
        await db.collection(col).createIndex(key, options);
        log(`  Created index "${options.name}" on "${col}"`);
      } catch (err) {
        warn(`  Failed to create index "${options.name}": ${err.message}`);
      }
    }
    report.indexesEnsured.push(`${col}.${options.name}`);
  }
}

// ─── Step 8: Activate valid / deactivate orphan records ──────────────────────

async function step8_activateValidRecords(db) {
  log('━━ Step 8 ─ Activating valid records; deactivating flagged orphans …');

  const validCatIds = new Set(
    (
      await db
        .collection(CANON.categories)
        .find({ isDeleted: { $ne: true }, isActive: true })
        .project({ _id: 1 })
        .toArray()
    ).map((c) => c._id.toString()),
  );

  // ── Brands ──────────────────────────────────────────────────────────────────
  // Activate: status=active, has valid categoryId, not flagged, not yet active
  const inactiveBrands = await db
    .collection(CANON.brands)
    .find({
      isDeleted: { $ne: true },
      isActive:  false,
      status:    'active',
      needsReview: { $ne: true },
      categoryId: { $exists: true, $ne: null },
    })
    .project({ _id: 1, categoryId: 1 })
    .toArray();

  const activateBrandOps = inactiveBrands
    .filter((b) => b.categoryId && validCatIds.has(b.categoryId.toString()))
    .map((b) => ({
      updateOne: { filter: { _id: b._id }, update: { $set: { isActive: true } } },
    }));

  // Deactivate: flagged as needsReview but still marked isActive
  const activeFlaggedBrands = await db
    .collection(CANON.brands)
    .find({ isDeleted: { $ne: true }, isActive: true, needsReview: true })
    .project({ _id: 1 })
    .toArray();

  const deactivateBrandOps = activeFlaggedBrands.map((b) => ({
    updateOne: { filter: { _id: b._id }, update: { $set: { isActive: false } } },
  }));

  await bulkWrite(db.collection(CANON.brands), activateBrandOps,   'brands.activate');
  await bulkWrite(db.collection(CANON.brands), deactivateBrandOps, 'brands.deactivate');
  report.recordsActivated   += activateBrandOps.length;
  report.recordsDeactivated += deactivateBrandOps.length;

  // ── Spare Parts ─────────────────────────────────────────────────────────────
  // Activate: status=active (canonical) or status=approved (legacy), has valid categories, not flagged, not yet active
  const inactiveParts = await db
    .collection(CANON.spareparts)
    .find({
      isDeleted:   { $ne: true },
      isActive:    false,
      status:      { $in: ['active', 'approved'] }, // 'approved' accepted until migration normalises existing docs
      needsReview: { $ne: true },
      categories:  { $exists: true, $not: { $size: 0 } },
    })
    .project({ _id: 1, categories: 1 })
    .toArray();

  const activatePartOps = inactiveParts
    .filter((p) => (p.categories ?? []).some((id) => validCatIds.has(id.toString())))
    .map((p) => ({
      updateOne: { filter: { _id: p._id }, update: { $set: { isActive: true } } },
    }));

  // Deactivate: active but all category refs have gone stale
  const activeFlaggedParts = await db
    .collection(CANON.spareparts)
    .find({ isDeleted: { $ne: true }, isActive: true, needsReview: true })
    .project({ _id: 1 })
    .toArray();

  const deactivatePartOps = activeFlaggedParts.map((p) => ({
    updateOne: { filter: { _id: p._id }, update: { $set: { isActive: false } } },
  }));

  await bulkWrite(db.collection(CANON.spareparts), activatePartOps,   'spareparts.activate');
  await bulkWrite(db.collection(CANON.spareparts), deactivatePartOps, 'spareparts.deactivate');
  report.recordsActivated   += activatePartOps.length;
  report.recordsDeactivated += deactivatePartOps.length;

  // ── Screen Sizes ─────────────────────────────────────────────────────────────
  // Activate screen sizes with a valid, active categoryId
  const inactiveScreenSizes = await db
    .collection(CANON.screensizes)
    .find({ isDeleted: { $ne: true }, isActive: false })
    .project({ _id: 1, categoryId: 1 })
    .toArray();

  const activateSSizeOps = inactiveScreenSizes
    .filter((ss) => ss.categoryId && validCatIds.has(ss.categoryId.toString()))
    .map((ss) => ({
      updateOne: { filter: { _id: ss._id }, update: { $set: { isActive: true } } },
    }));

  await bulkWrite(db.collection(CANON.screensizes), activateSSizeOps, 'screensizes.activate');
  report.recordsActivated += activateSSizeOps.length;

  log(
    `  Activated: ${report.recordsActivated}  |  Deactivated: ${report.recordsDeactivated}`,
  );
}

// ─── Step 9: Final integrity report ──────────────────────────────────────────

async function step9_printReport(db) {
  log('━━ Step 9 ─ Generating final integrity report …');

  const [
    totalCats,   activeCats,
    totalBrands, activeBrands, orphanBrands,
    totalParts,  activeParts,  orphanParts,
    totalSizes,  activeSizes,
    totalModels, activeModels,
  ] = await Promise.all([
    db.collection(CANON.categories).countDocuments({ isDeleted: { $ne: true } }),
    db.collection(CANON.categories).countDocuments({ isDeleted: { $ne: true }, isActive: true }),

    db.collection(CANON.brands).countDocuments({ isDeleted: { $ne: true } }),
    db.collection(CANON.brands).countDocuments({ isDeleted: { $ne: true }, isActive: true }),
    db.collection(CANON.brands).countDocuments({ isDeleted: { $ne: true }, needsReview: true }),

    db.collection(CANON.spareparts).countDocuments({ isDeleted: { $ne: true } }),
    db.collection(CANON.spareparts).countDocuments({ isDeleted: { $ne: true }, isActive: true }),
    db.collection(CANON.spareparts).countDocuments({ isDeleted: { $ne: true }, needsReview: true }),

    db.collection(CANON.screensizes).countDocuments({ isDeleted: { $ne: true } }),
    db.collection(CANON.screensizes).countDocuments({ isDeleted: { $ne: true }, isActive: true }),

    db.collection(CANON.models).countDocuments({ isDeleted: { $ne: true } }),
    db.collection(CANON.models).countDocuments({ isDeleted: { $ne: true }, isActive: true }),
  ]);

  const hr = '═'.repeat(62);
  console.log(`\n${hr}`);
  console.log('  ESPAREX MASTER DATA REPAIR — FINAL REPORT');
  console.log(hr);
  if (DRY_RUN) {
    console.log('  ⚠  DRY-RUN MODE — no changes were written to the database');
  }
  console.log('');

  console.log('ACTIONS TAKEN:');
  console.log(`  Legacy collections detected:    ${report.legacyCollectionsFound.length}`);
  report.legacyCollectionsFound.forEach((m) => console.log(`    • ${m}`));
  console.log(`  Collections renamed:            ${report.collectionsRenamed.length}`);
  report.collectionsRenamed.forEach((m) => console.log(`    • ${m}`));
  console.log(`  Brands repaired (categoryId):   ${report.brandsRepaired}`);
  console.log(`  Brands orphaned (no category):  ${report.brandsOrphaned}`);
  console.log(`  Duplicate brand groups found:   ${report.duplicateBrandGroupsFound}`);
  console.log(`  Duplicate brands merged:        ${report.duplicateBrandsMerged}`);
  console.log(`  Spare parts repaired:           ${report.sparePartsRepaired}`);
  console.log(`  Spare parts orphaned:           ${report.sparePartsOrphaned}`);
  console.log(`  Screen sizes normalized:        ${report.screenSizesNormalized}`);
  console.log(`  Records activated:              ${report.recordsActivated}`);
  console.log(`  Records deactivated:            ${report.recordsDeactivated}`);
  console.log(`  Indexes ensured:                ${report.indexesEnsured.length}`);
  report.indexesEnsured.forEach((m) => console.log(`    • ${m}`));

  console.log('');
  console.log('FINAL COLLECTION STATE (post-repair):');
  console.log(`  categories:   ${activeCats}  active / ${totalCats}  total`);
  console.log(`  brands:       ${activeBrands}  active / ${totalBrands}  total   (${orphanBrands} flagged)`);
  console.log(`  spareparts:   ${activeParts}  active / ${totalParts}  total   (${orphanParts} flagged)`);
  console.log(`  screensizes:  ${activeSizes}  active / ${totalSizes}  total`);
  console.log(`  models:       ${activeModels}  active / ${totalModels}  total`);
  console.log('');
  console.log('EXPECTED OUTCOME:');
  console.log('  ✓  Admin Dashboard master data lists load cleanly');
  console.log('  ✓  Post Ad Category dropdown is populated');
  console.log('  ✓  Brand dropdown loads for each category');
  console.log('  ✓  Spare Parts filter is linked to valid brands/categories');
  console.log('  ✓  Screen Size picker uses canonical size strings');
  console.log(`${hr}\n`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(adminUri, { serverSelectionTimeoutMS: 20_000 });
  await client.connect();
  const db = client.db(); // connects to DB named in the URI

  log(`Connected to "${db.databaseName}"  [mode: ${DRY_RUN ? 'DRY-RUN' : 'LIVE WRITE'}]`);
  console.log('');

  try {
    await step1_detectLegacyCollections(db);
    await step2_renameLegacyCollections(db);
    await step3_repairBrandCategoryHierarchy(db);
    await step4_mergeDuplicateBrands(db);
    await step5_repairSparePartsHierarchy(db);
    await step6_normalizeScreenSizes(db);
    await step7_ensureIndexes(db);
    await step8_activateValidRecords(db);
    await step9_printReport(db);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('[repair][FATAL]', err.message);
  console.error(err.stack);
  process.exit(1);
});
