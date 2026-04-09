/**
 * CatalogHierarchyService
 *
 * Ensures the Category → Brand → Model → SparePart → ScreenSize hierarchy
 * is valid and internally consistent.
 *
 * Provides:
 *   - Runtime integrity checks (read-only, used by admin diagnostic endpoints)
 *   - Lightweight repair helpers (write, used by admin repair triggers)
 *
 * This service is the SSOT for hierarchy validation logic.
 * Do NOT duplicate these checks inside individual controllers.
 */

import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import type {
    HierarchyTreeBrandNode,
    HierarchyTreeCategoryNode,
    HierarchyTreeModelNode,
    HierarchyTreeResponse,
} from '../../../../shared/types/CatalogHierarchy';
import type { AnyBulkWriteOperation } from 'mongoose';
import mongoose from 'mongoose';
import Category from '../../models/Category';
import Brand, { IBrand } from '../../models/Brand';
import Model from '../../models/Model';
import SparePartModel, { ISparePart } from '../../models/SparePart';
import ScreenSize, { IScreenSize } from '../../models/ScreenSize';
import { getActiveCategoryIds } from './CatalogValidationService';

type WithId = { _id: unknown };

const buildActivateOps = <T extends WithId>(
    docs: T[],
    predicate: (doc: T) => boolean
): AnyBulkWriteOperation[] =>
    docs
        .filter(predicate)
        .map((doc) => ({ updateOne: { filter: { _id: doc._id }, update: { $set: { isActive: true } } } }));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HierarchyIssue {
    collection: string;
    docId: string;
    issue: string;
}

export interface HierarchyReport {
    scannedAt: Date;
    brands:     { total: number; orphaned: number };
    models:     { total: number; orphaned: number };
    spareParts: { total: number; orphaned: number; staleCategories: number };
    screenSizes:{ total: number; orphaned: number };
    issues: HierarchyIssue[];
}

export interface RepairSummary {
    brandsRepaired:       number;
    brandsOrphaned:       number;
    sparePartsRepaired:   number;
    sparePartsOrphaned:   number;
    screenSizesDeactivated: number;
}

// ─── Read-only hierarchy scan ─────────────────────────────────────────────────

/**
 * Scan the full catalog hierarchy and return a structured integrity report.
 * Does NOT write to the database.
 */
export async function scanHierarchyIntegrity(): Promise<HierarchyReport> {
    const issues: HierarchyIssue[] = [];
    const validCatIds = new Set(await getActiveCategoryIds());

    // ── Brands ──────────────────────────────────────────────────────────────
    const allBrands = await Brand.find({ isDeleted: { $ne: true } })
        .select('_id categoryIds')
        .lean();

    let orphanedBrands = 0;
    for (const brand of allBrands) {
        const cats = (brand.categoryIds ?? []).map(String);
        const hasValidCat = cats.some((id) => validCatIds.has(id));

        if (cats.length === 0 || !hasValidCat) {
            orphanedBrands++;
            issues.push({
                collection: 'brands',
                docId: String(brand._id),
                issue: cats.length === 0
                    ? 'categoryIds array is empty'
                    : 'all category references are stale',
            });
        }
    }

    // ── Models ───────────────────────────────────────────────────────────────
    const validBrandIds = new Set(
        (await Brand.find({ isDeleted: { $ne: true }, isActive: true })
            .select('_id').lean()).map((b) => String(b._id)),
    );

    const allModels = await Model.find({ isDeleted: { $ne: true } })
        .select('_id brandId')
        .lean();

    let orphanedModels = 0;
    for (const model of allModels) {
        const brandId = model.brandId ? String(model.brandId) : null;
        if (!brandId || !validBrandIds.has(brandId)) {
            orphanedModels++;
            issues.push({
                collection: 'models',
                docId: String(model._id),
                issue: brandId
                    ? `brandId "${brandId}" is missing or inactive`
                    : 'brandId is null or missing',
            });
        }
    }

    // ── Spare Parts ──────────────────────────────────────────────────────────
    const allParts = await SparePartModel.find({ isDeleted: { $ne: true } })
        .select('_id categoryIds')
        .lean();

    let orphanedParts = 0;
    let staleCategoryParts = 0;

    for (const part of allParts) {
        const cats: string[] = ((part as any).categoryIds ?? []).map(String);
        if (cats.length === 0) {
            orphanedParts++;
            issues.push({ collection: 'spareparts', docId: String(part._id), issue: 'categoryIds array is empty' });
            continue;
        }
        const validCats = cats.filter((id) => validCatIds.has(id));
        if (validCats.length === 0) {
            orphanedParts++;
            issues.push({ collection: 'spareparts', docId: String(part._id), issue: 'all category references are stale' });
        } else if (validCats.length < cats.length) {
            staleCategoryParts++;
            issues.push({
                collection: 'spareparts',
                docId: String(part._id),
                issue: `${cats.length - validCats.length} stale category reference(s)`,
            });
        }
    }

    // ── Screen Sizes ─────────────────────────────────────────────────────────
    const allSizes = await ScreenSize.find({ isDeleted: { $ne: true } })
        .select('_id categoryId')
        .lean();

    let orphanedSizes = 0;
    for (const ss of allSizes) {
        const catId = ss.categoryId ? String(ss.categoryId) : null;
        if (!catId || !validCatIds.has(catId)) {
            orphanedSizes++;
            issues.push({
                collection: 'screensizes',
                docId: String(ss._id),
                issue: catId
                    ? `categoryId "${catId}" is missing or inactive`
                    : 'categoryId is null or missing',
            });
        }
    }

    return {
        scannedAt: new Date(),
        brands:     { total: allBrands.length,   orphaned: orphanedBrands },
        models:     { total: allModels.length,   orphaned: orphanedModels },
        spareParts: { total: allParts.length,    orphaned: orphanedParts, staleCategories: staleCategoryParts },
        screenSizes:{ total: allSizes.length,    orphaned: orphanedSizes },
        issues,
    };
}

export async function getHierarchyTree(): Promise<HierarchyTreeResponse> {
    const [categories, brands, models] = await Promise.all([
        Category.find({ isDeleted: { $ne: true } })
            .select('_id name slug listingType hasScreenSizes isActive')
            .sort({ name: 1 })
            .lean(),
        Brand.find({ isDeleted: { $ne: true } })
            .select('_id name categoryIds isActive status')
            .sort({ name: 1 })
            .lean(),
        Model.find({ isDeleted: { $ne: true } })
            .select('_id name brandId categoryId categoryIds isActive status')
            .sort({ name: 1 })
            .lean(),
    ]);

    const modelsByBrand = new Map<string, typeof models>();
    models.forEach((model) => {
        const brandId = model.brandId ? String(model.brandId) : '';
        if (!brandId) return;
        const existing = modelsByBrand.get(brandId) ?? [];
        existing.push(model);
        modelsByBrand.set(brandId, existing);
    });

    const categoriesTree = categories.map((category) => {
        const categoryId = String(category._id);
        const categoryBrands = brands
            .filter((brand) => ((brand.categoryIds ?? []) as unknown[]).some((id) => String(id) === categoryId))
            .map((brand) => {
                const brandModels = (modelsByBrand.get(String(brand._id)) ?? []).filter((model) => {
                    const mappedCategoryIds = ((model.categoryIds ?? []) as unknown[]).map((id) => String(id));
                    return mappedCategoryIds.includes(categoryId);
                });

                return {
                    id: String(brand._id),
                    name: brand.name,
                    isActive: Boolean(brand.isActive),
                    status: typeof brand.status === 'string' ? brand.status : undefined,
                    models: brandModels.map((model) => ({
                        id: String(model._id),
                        name: model.name,
                        isActive: Boolean(model.isActive),
                        status: typeof model.status === 'string' ? model.status : undefined,
                    })),
                };
            });

        return {
            id: categoryId,
            name: category.name,
            slug: category.slug,
            listingType: Array.isArray(category.listingType) ? category.listingType : [],
            hasScreenSizes: Boolean(category.hasScreenSizes),
            isActive: Boolean(category.isActive),
            brands: categoryBrands,
        };
    });

    return {
        summary: {
            categories: categories.length,
            brands: brands.length,
            models: models.length,
        },
        categories: categoriesTree,
    };
}

// ─── Write — lightweight repair ───────────────────────────────────────────────

/**
 * Repair the hierarchy in-place:
 *   1. Brands with null/missing categoryId → try name-match, else flag
 *   2. SpareParts with empty categoryIds[] → derive from brand, else flag
 *   3. SpareParts with stale category refs → prune to valid refs
 *   4. ScreenSizes with missing/inactive categoryId → deactivate
 *
 * Returns a summary of what was changed.
 * All writes use bulkWrite for atomicity.
 */
export async function repairHierarchy(): Promise<RepairSummary> {
    const summary: RepairSummary = {
        brandsRepaired: 0,
        brandsOrphaned: 0,
        sparePartsRepaired: 0,
        sparePartsOrphaned: 0,
        screenSizesDeactivated: 0,
    };

    const validCatIds = new Set(await getActiveCategoryIds());

    // ── 1. Brands: repair null categoryId ────────────────────────────────────
    const categories = await Category.find({ isDeleted: { $ne: true }, isActive: true })
        .select('_id name slug')
        .lean();

    const catByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c._id]));
    const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

    const orphanBrands = await Brand.find({
        isDeleted: { $ne: true },
        $or: [
            { categoryIds: null },
            { categoryIds: { $exists: false } },
            { categoryIds: { $size: 0 } }
        ],
    }).lean();

    const brandRepairOps: AnyBulkWriteOperation<IBrand>[] = [];
    const brandOrphanOps: AnyBulkWriteOperation<IBrand>[] = [];

    for (const brand of orphanBrands) {
        const nameLower = (brand.name ?? '').toLowerCase().trim();
        const matchedCatId =
            catByName.get(nameLower) ??
            catBySlug.get(nameLower.replace(/[^a-z0-9]+/g, '-')) ??
            null;

        if (matchedCatId) {
            brandRepairOps.push({
                updateOne: {
                    filter: { _id: brand._id },
                    update: { $set: { categoryIds: [matchedCatId], needsReview: false } },
                },
            });
            summary.brandsRepaired++;
        } else {
            brandOrphanOps.push({
                updateOne: {
                    filter: { _id: brand._id },
                    update: { $set: { isActive: false, needsReview: true } },
                },
            });
            summary.brandsOrphaned++;
        }
    }

    if (brandRepairOps.length) await Brand.bulkWrite(brandRepairOps, { ordered: false });
    if (brandOrphanOps.length) await Brand.bulkWrite(brandOrphanOps, { ordered: false });

    // ── 2. SpareParts: repair / prune categoryIds[] ────────────────────────────
    const brandCatMap = new Map(
        (await Brand.find({
            isDeleted: { $ne: true },
            isActive: true,
            categoryIds: { $exists: true, $not: { $size: 0 } },
        }).select('_id categoryIds').lean())
            .map((b) => [String(b._id), b.categoryIds?.[0] || null]),
    );

    const emptyParts = await SparePartModel.find({
        isDeleted: { $ne: true },
        $or: [
            { categoryIds: { $exists: false } },
            { categoryIds: null },
            { categoryIds: { $size: 0 } },
        ],
    }).lean();

    const partRepairOps: AnyBulkWriteOperation<ISparePart>[] = [];
    const partOrphanOps: AnyBulkWriteOperation<ISparePart>[] = [];

    for (const part of emptyParts) {
        const derivedCatId = part.brandId
            ? (brandCatMap.get(String(part.brandId)) ?? null)
            : null;

        if (derivedCatId && validCatIds.has(String(derivedCatId))) {
            partRepairOps.push({
                updateOne: {
                    filter: { _id: part._id },
                    update: { $set: { categoryIds: [derivedCatId] } },
                },
            });
            summary.sparePartsRepaired++;
        } else {
            partOrphanOps.push({
                updateOne: {
                    filter: { _id: part._id },
                    update: { $set: { isActive: false, categoryIds: [] } },
                },
            });
            summary.sparePartsOrphaned++;
        }
    }

    // Prune stale category refs from parts that have some valid + some invalid
    const allActiveParts = await SparePartModel.find({
        isDeleted: { $ne: true },
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const pruneOps: AnyBulkWriteOperation<ISparePart>[] = [];
    for (const part of allActiveParts) {
        const cats = ((part as any).categoryIds ?? []).map(String);
        const validCats = cats.filter((id: string) => validCatIds.has(id));
        if (validCats.length === cats.length) continue;
        if (validCats.length === 0) {
            partOrphanOps.push({
                updateOne: {
                    filter: { _id: part._id },
                    update: { $set: { isActive: false, categoryIds: [] } },
                },
            });
            summary.sparePartsOrphaned++;
        } else {
            pruneOps.push({
                updateOne: { filter: { _id: part._id }, update: { $set: { categoryIds: validCats.map((id: string) => new mongoose.Types.ObjectId(id)) } } },
            });
        }
    }

    if (partRepairOps.length) await SparePartModel.bulkWrite(partRepairOps, { ordered: false });
    if (partOrphanOps.length) await SparePartModel.bulkWrite(partOrphanOps, { ordered: false });
    if (pruneOps.length) await SparePartModel.bulkWrite(pruneOps, { ordered: false });

    // ── 3. ScreenSizes: deactivate orphans ────────────────────────────────────
    const orphanSizes = await ScreenSize.find({
        isDeleted: { $ne: true },
        $or: [
            { categoryId: null },
            { categoryId: { $exists: false } },
        ],
    }).lean();

    const staleSizes = await ScreenSize.find({ isDeleted: { $ne: true } })
        .select('_id categoryId').lean();

    const sizeDeactivateOps: AnyBulkWriteOperation<IScreenSize>[] = [];
    for (const ss of staleSizes) {
        const catId = ss.categoryId ? String(ss.categoryId) : null;
        if (!catId || !validCatIds.has(catId)) {
            sizeDeactivateOps.push({
                updateOne: {
                    filter: { _id: ss._id },
                    update: { $set: { isActive: false } },
                },
            });
            summary.screenSizesDeactivated++;
        }
    }

    // Suppress the orphanSizes array if already covered by staleSizes loop
    void orphanSizes;

    if (sizeDeactivateOps.length) await ScreenSize.bulkWrite(sizeDeactivateOps, { ordered: false });

    return summary;
}

// ─── Activate valid records ───────────────────────────────────────────────────

/**
 * Activate any record that has a valid hierarchy but was previously
 * deactivated (e.g. after a status migration or repair run).
 *
 * Returns the number of records activated per collection.
 */
export async function activateValidRecords(): Promise<{
    brands: number;
    spareParts: number;
    screenSizes: number;
}> {
    const validCatIds = new Set(await getActiveCategoryIds());

    // Brands: status=active + valid categoryId + not flagged
    const inactiveBrands = await Brand.find({
        isDeleted: { $ne: true },
        isActive: false,
        status: CATALOG_STATUS.ACTIVE,
        needsReview: { $ne: true },
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const activateBrandOps = buildActivateOps(
        inactiveBrands,
        (b) => ((b as any).categoryIds ?? []).some((id: any) => validCatIds.has(String(id)))
    );

    if (activateBrandOps.length) await Brand.bulkWrite(activateBrandOps, { ordered: false });

    // SpareParts: inactive + valid categoryIds
    const inactiveParts = await SparePartModel.find({
        isDeleted: { $ne: true },
        isActive: false,
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const activatePartOps = buildActivateOps(
        inactiveParts,
        (p) => ((p as any).categoryIds ?? []).some((id: any) => validCatIds.has(String(id)))
    );

    if (activatePartOps.length) await SparePartModel.bulkWrite(activatePartOps, { ordered: false });

    // ScreenSizes: valid categoryId + inactive
    const inactiveSizes = await ScreenSize.find({
        isDeleted: { $ne: true },
        isActive: false,
    }).select('_id categoryId').lean();

    const activateSizeOps = buildActivateOps(
        inactiveSizes,
        (ss) => !!(ss.categoryId && validCatIds.has(String(ss.categoryId)))
    );

    if (activateSizeOps.length) await ScreenSize.bulkWrite(activateSizeOps, { ordered: false });

    return {
        brands: activateBrandOps.length,
        spareParts: activatePartOps.length,
        screenSizes: activateSizeOps.length,
    };
}
