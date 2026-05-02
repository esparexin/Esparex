/**
 * Migration: master-data-full-repair
 *
 * Tracked migration wrapper for the Esparex master data repair pipeline.
 *
 * This migration records in the migrate-mongo changelog that the full
 * repair has been run, and executes the core idempotent structural fixes
 * directly (index creation, orphan flagging, screen-size normalization,
 * duplicate-brand detection) without requiring the standalone script.
 *
 * For a full audit report with --dry-run support, run the standalone
 * script instead:
 *
 *   node backend/scripts/master-data-full-repair.js --dry-run
 *   node backend/scripts/master-data-full-repair.js
 *
 * Reversibility:
 *   up()   — idempotent; safe to re-run.
 *   down() — records a rollback marker; data mutations are NOT reversed
 *            (use a point-in-time backup to fully restore a previous state).
 */

'use strict';

// ─── Canonical collection names ───────────────────────────────────────────────

const CANON = {
  categories:     'categories',
  brands:         'brands',
  models:         'models',
  spareparts:     'spareparts',
  sparepartTypes: 'spare_part_types',
  screensizes:    'screensizes',
};

/**
 * Legacy collection name → canonical name mappings that are safe
 * to attempt atomically (target must not already exist).
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function canonicalSize(inches) {
  return `${inches}"`;
}

function toSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Safely create an index; skip if already present; log any conflict warnings. */
async function ensureIndex(db, col, key, options) {
  const colExists = await db.listCollections({ name: col }, { nameOnly: true }).hasNext();
  if (!colExists) return;
  const existing = await db.collection(col).indexes();
  if (existing.some((idx) => idx.name === options.name)) return;
  try {
    await db.collection(col).createIndex(key, options);
    console.log(`[migration] Created index "${options.name}" on "${col}"`);
  } catch (err) {
    // E.g. conflicting index definition already present under a different name
    console.warn(`[migration] Skipped index "${options.name}": ${err.message}`);
  }
}

// ─── up() ─────────────────────────────────────────────────────────────────────

module.exports = {
  async up(db) {
    console.log('[migration] master-data-full-repair — starting …');

    // ── 1. Rename legacy collection names ────────────────────────────────────
    const colList   = await db.listCollections({}, { nameOnly: true }).toArray();
    const colNames  = new Set(colList.map((c) => c.name));

    for (const { from, to } of LEGACY_RENAMES) {
      if (!colNames.has(from)) continue;
      if (colNames.has(to)) {
        console.warn(
          `[migration] Cannot rename "${from}" → "${to}": ` +
          'canonical collection already exists — manual merge required.',
        );
        continue;
      }
      await db.renameCollection(from, to);
      console.log(`[migration] Renamed collection "${from}" → "${to}"`);
      colNames.delete(from);
      colNames.add(to);
    }

    // ── 2. Repair brand → category hierarchy (null categoryId) ───────────────
    if (colNames.has(CANON.categories) && colNames.has(CANON.brands)) {
      const categories = await db
        .collection(CANON.categories)
        .find({ isDeleted: { $ne: true }, isActive: true })
        .project({ _id: 1, name: 1, slug: 1 })
        .toArray();

      const catByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c._id]));
      const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

      const orphanBrands = await db
        .collection(CANON.brands)
        .find({
          isDeleted: { $ne: true },
          $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
        })
        .toArray();

      let repairedBrands = 0;
      let orphanedBrands = 0;
      const repairOps   = [];
      const orphanOps   = [];

      for (const brand of orphanBrands) {
        const nameLower  = (brand.name ?? '').toLowerCase().trim();
        const matchedId  =
          catByName.get(nameLower) ??
          catBySlug.get(toSlug(brand.name ?? '')) ??
          null;

        if (matchedId) {
          repairOps.push({
            updateOne: {
              filter: { _id: brand._id },
              update: { $set: { categoryId: matchedId, needsReview: false } },
            },
          });
          repairedBrands++;
        } else {
          orphanOps.push({
            updateOne: {
              filter: { _id: brand._id },
              update: { $set: { isActive: false, needsReview: true } },
            },
          });
          orphanedBrands++;
        }
      }

      if (repairOps.length) {
        await db.collection(CANON.brands).bulkWrite(repairOps, { ordered: false });
      }
      if (orphanOps.length) {
        await db.collection(CANON.brands).bulkWrite(orphanOps, { ordered: false });
      }
      console.log(
        `[migration] Brand hierarchy: repaired=${repairedBrands}, orphaned=${orphanedBrands}`,
      );
    }

    // ── 3. Merge duplicate brand names (case-insensitive, per categoryId) ────
    if (colNames.has(CANON.brands)) {
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
                $push: { id: '$_id', name: '$name', createdAt: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray();

      let mergedCount = 0;
      for (const group of duplicateGroups) {
        const sorted    = group.docs.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
        const canonical = sorted[0];
        const dupes     = sorted.slice(1);

        for (const dupe of dupes) {
          await db
            .collection(CANON.models)
            .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

          await db
            .collection(CANON.spareparts)
            .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

          await db
            .collection(CANON.screensizes)
            .updateMany({ brandId: dupe.id }, { $set: { brandId: canonical.id } });

          await db.collection(CANON.brands).updateOne(
            { _id: dupe.id },
            {
              $set: {
                isDeleted:       true,
                deletedAt:       new Date(),
                isActive:        false,
                status:          'rejected',
                rejectionReason: `Duplicate — merged into brand ${canonical.id} (${canonical.name})`,
              },
            },
          );
          mergedCount++;
        }
      }
      console.log(
        `[migration] Duplicate brands: groups=${duplicateGroups.length}, merged=${mergedCount}`,
      );
    }

    // ── 4. Repair spare parts with empty/missing categories array ──────────────
    if (colNames.has(CANON.spareparts) && colNames.has(CANON.brands)) {
      const validCatIds = new Set(
        (
          await db
            .collection(CANON.categories)
            .find({ isDeleted: { $ne: true }, isActive: true })
            .project({ _id: 1 })
            .toArray()
        ).map((c) => c._id.toString()),
      );

      const brandCatMap = new Map(
        (
          await db
            .collection(CANON.brands)
            .find({
              isDeleted:  { $ne: true },
              isActive:   true,
              categoryId: { $exists: true, $ne: null },
            })
            .project({ _id: 1, categoryId: 1 })
            .toArray()
        ).map((b) => [b._id.toString(), b.categoryId]),
      );

      const emptyParts = await db
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

      const repairOps = [];
      const orphanOps = [];

      for (const part of emptyParts) {
        const derivedCatId = part.brandId
          ? (brandCatMap.get(part.brandId.toString()) ?? null)
          : null;

        if (derivedCatId && validCatIds.has(derivedCatId.toString())) {
          repairOps.push({
            updateOne: {
              filter: { _id: part._id },
              update: { $set: { categories: [derivedCatId] } },
            },
          });
        } else {
          orphanOps.push({
            updateOne: {
              filter: { _id: part._id },
              update: { $set: { isActive: false, categories: [] } },
            },
          });
        }
      }

      // Also prune stale category references from existing parts
      const allParts = await db
        .collection(CANON.spareparts)
        .find({
          isDeleted:  { $ne: true },
          categories: { $exists: true, $not: { $size: 0 } },
        })
        .project({ _id: 1, categories: 1 })
        .toArray();

      const pruneOps = [];
      for (const part of allParts) {
        const cats      = part.categories ?? [];
        const validCats = cats.filter((id) => id && validCatIds.has(id.toString()));
        if (validCats.length === cats.length) continue;
        if (validCats.length === 0) {
          orphanOps.push({
            updateOne: {
              filter: { _id: part._id },
              update: { $set: { isActive: false, categories: [] } },
            },
          });
        } else {
          pruneOps.push({
            updateOne: {
              filter: { _id: part._id },
              update: { $set: { categories: validCats } },
            },
          });
        }
      }

      if (repairOps.length) {
        await db.collection(CANON.spareparts).bulkWrite(repairOps, { ordered: false });
      }
      if (pruneOps.length) {
        await db.collection(CANON.spareparts).bulkWrite(pruneOps, { ordered: false });
      }
      if (orphanOps.length) {
        await db.collection(CANON.spareparts).bulkWrite(orphanOps, { ordered: false });
      }
      console.log(
        `[migration] Spare parts: repaired=${repairOps.length}, ` +
        `pruned=${pruneOps.length}, orphaned=${orphanOps.length}`,
      );
    }

    // ── 5. Normalize screen size string formats ───────────────────────────────
    if (colNames.has(CANON.screensizes)) {
      const screensizes = await db
        .collection(CANON.screensizes)
        .find({ isDeleted: { $ne: true } })
        .toArray();

      const normalizeOps = [];
      for (const ss of screensizes) {
        const inches = parseInches(ss.size);
        if (inches === null) continue;
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
      }

      if (normalizeOps.length) {
        await db
          .collection(CANON.screensizes)
          .bulkWrite(normalizeOps, { ordered: false });
      }
      console.log(`[migration] Screen sizes normalized: ${normalizeOps.length}`);
    }

    // ── 6. Activate valid records that are still marked isActive:false ─────────
    if (colNames.has(CANON.categories)) {
      const validCatIds = new Set(
        (
          await db
            .collection(CANON.categories)
            .find({ isDeleted: { $ne: true }, isActive: true })
            .project({ _id: 1 })
            .toArray()
        ).map((c) => c._id.toString()),
      );

      // Brands: status=active + valid categoryId → isActive:true
      if (colNames.has(CANON.brands)) {
        const toActivate = await db
          .collection(CANON.brands)
          .find({
            isDeleted:   { $ne: true },
            isActive:    false,
            status:      'active',
            needsReview: { $ne: true },
            categoryId:  { $exists: true, $ne: null },
          })
          .project({ _id: 1, categoryId: 1 })
          .toArray();

        const activateOps = toActivate
          .filter((b) => b.categoryId && validCatIds.has(b.categoryId.toString()))
          .map((b) => ({
            updateOne: { filter: { _id: b._id }, update: { $set: { isActive: true } } },
          }));

        if (activateOps.length) {
          await db.collection(CANON.brands).bulkWrite(activateOps, { ordered: false });
          console.log(`[migration] Activated ${activateOps.length} brand(s)`);
        }
      }

      // Spare parts: status=approved + valid categories → isActive:true
      if (colNames.has(CANON.spareparts)) {
        const toActivate = await db
          .collection(CANON.spareparts)
          .find({
            isDeleted:   { $ne: true },
            isActive:    false,
            status:      'approved',
            categories:  { $exists: true, $not: { $size: 0 } },
          })
          .project({ _id: 1, categories: 1 })
          .toArray();

        const activateOps = toActivate
          .filter((p) => (p.categories ?? []).some((id) => validCatIds.has(id.toString())))
          .map((p) => ({
            updateOne: { filter: { _id: p._id }, update: { $set: { isActive: true } } },
          }));

        if (activateOps.length) {
          await db.collection(CANON.spareparts).bulkWrite(activateOps, { ordered: false });
          console.log(`[migration] Activated ${activateOps.length} spare part(s)`);
        }
      }

      // Screen sizes: valid categoryId → isActive:true
      if (colNames.has(CANON.screensizes)) {
        const toActivate = await db
          .collection(CANON.screensizes)
          .find({ isDeleted: { $ne: true }, isActive: false })
          .project({ _id: 1, categoryId: 1 })
          .toArray();

        const activateOps = toActivate
          .filter((ss) => ss.categoryId && validCatIds.has(ss.categoryId.toString()))
          .map((ss) => ({
            updateOne: { filter: { _id: ss._id }, update: { $set: { isActive: true } } },
          }));

        if (activateOps.length) {
          await db.collection(CANON.screensizes).bulkWrite(activateOps, { ordered: false });
          console.log(`[migration] Activated ${activateOps.length} screen size(s)`);
        }
      }
    }

    // ── 7. Ensure required compound indexes ──────────────────────────────────
    const indexDefs = [
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
      {
        col: CANON.screensizes,
        key: { categoryId: 1, isActive: 1 },
        options: { name: 'screensize_categoryId_active_idx', background: true },
      },
      {
        col: CANON.models,
        key: { brandId: 1, categoryId: 1 },
        options: { name: 'model_brand_category_idx', background: true },
      },
    ];

    for (const { col, key, options } of indexDefs) {
      await ensureIndex(db, col, key, options);
    }

    console.log('[migration] master-data-full-repair — complete.');
  },

  // ─── down() ─────────────────────────────────────────────────────────────────
  //
  // Data mutations in up() (hierarchy repairs, de-duplication, normalization)
  // are not automatically reversible.  To fully undo this migration, restore
  // from a point-in-time backup taken before running up().
  //
  // The indexes created in up() ARE reversible and are dropped here.
  async down(db) {
    console.log('[migration] master-data-full-repair down() — dropping repair indexes …');

    const indexesToDrop = [
      { col: CANON.brands,      name: 'brand_categoryId_idx'              },
      { col: CANON.brands,      name: 'brand_name_categoryId_text_idx'    },
      { col: CANON.spareparts,  name: 'sparepart_brandId_idx'             },
      { col: CANON.spareparts,  name: 'sparepart_categories_idx'          },
      { col: CANON.spareparts,  name: 'sparepart_categories_active_idx'   },
      { col: CANON.categories,  name: 'category_slug_unique_idx'          },
      { col: CANON.screensizes, name: 'screensize_categoryId_active_idx'  },
      { col: CANON.models,      name: 'model_brand_category_idx'          },
    ];

    for (const { col, name } of indexesToDrop) {
      const colExists = await db
        .listCollections({ name: col }, { nameOnly: true })
        .hasNext();
      if (!colExists) continue;
      const indexes = await db.collection(col).indexes();
      if (!indexes.some((idx) => idx.name === name)) continue;
      try {
        await db.collection(col).dropIndex(name);
        console.log(`[migration] Dropped index "${name}" from "${col}"`);
      } catch (err) {
        console.warn(`[migration] Could not drop index "${name}": ${err.message}`);
      }
    }

    console.log(
      '[migration] down() complete. ' +
      'NOTE: data mutations (hierarchy repairs, de-duplication, normalization) ' +
      'were NOT reversed. Restore from backup if a full rollback is required.',
    );
  },
};
