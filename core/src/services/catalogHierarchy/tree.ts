import mongoose from 'mongoose';
import Category from '../../models/Category';
import Brand, { IBrand } from '../../models/Brand';
import Model from '../../models/Model';
import Ad from '../../models/Ad';
import Variant from '../../models/Variant';
import SparePart, { ISparePart } from '../../models/SparePart';
import ScreenSize, { IScreenSize } from '../../models/ScreenSize';
import { getActiveCategoryIds } from '../catalog/CatalogValidationService';
import { normalizeCatalogCanonicalName, slugifyCatalogValue } from '../../utils/catalogGovernance';
import type { AnyBulkWriteOperation } from 'mongoose';
import type { HierarchyTreeResponse } from '@esparex/shared';
import type { ModelHierarchyDoc, HierarchyIssue, HierarchyReport, ModelDeletionImpact, ModelHierarchyRepairPlan } from './types';
import { MAX_MODEL_TREE_DEPTH } from './constants';
import { normalizeId, getEffectiveParentId, modelSelect, getLineageKey } from './validation';

const buildActivateOps = <T extends { _id: unknown }>(
    docs: T[], predicate: (doc: T) => boolean
): AnyBulkWriteOperation[] =>
    docs.filter(predicate).map((doc) => ({ updateOne: { filter: { _id: doc._id }, update: { $set: { isActive: true } } } }));

export async function scanHierarchyIntegrity(): Promise<HierarchyReport> {
    const issues: HierarchyIssue[] = [];
    const validCatIds = new Set(await getActiveCategoryIds());

    const allBrands = await Brand.find({ isDeleted: { $ne: true } }).select('_id categoryIds').lean();
    let orphanedBrands = 0;
    for (const brand of allBrands) {
        const cats = (brand.categoryIds ?? []).map(String);
        const hasValidCat = cats.some((id) => validCatIds.has(id));
        if (cats.length === 0 || !hasValidCat) {
            orphanedBrands++;
            issues.push({ collection: 'brands', docId: String(brand._id), issue: cats.length === 0 ? 'categoryIds array is empty' : 'all category references are stale' });
        }
    }

    const validBrandIds = new Set((await Brand.find({ isDeleted: { $ne: true }, isActive: true }).select('_id').lean()).map((b) => String(b._id)));
    const allModels = await Model.find({ isDeleted: { $ne: true } }).select(modelSelect).lean<ModelHierarchyDoc[]>();
    const modelById = new Map(allModels.map((model) => [String(model._id), model]));
    let orphanedModels = 0, cyclicModels = 0, duplicateLineages = 0, invalidPaths = 0, maxModelDepth = 0;
    const depthDistribution: Record<string, number> = {};
    const lineageByKey = new Map<string, string>();

    for (const model of allModels) {
        const brandId = model.brandId ? String(model.brandId) : null;
        if (!brandId || !validBrandIds.has(brandId)) {
            orphanedModels++;
            issues.push({ collection: 'models', docId: String(model._id), issue: brandId ? `brandId "${brandId}" is missing or inactive` : 'brandId is null or missing', severity: 'error', repairSuggestion: 'Assign the model to an active brand or deactivate it for review' });
        }
        const modelId = String(model._id);
        const parentId = getEffectiveParentId(model);
        const path = Array.isArray(model.hierarchyPath) ? model.hierarchyPath.map(String) : [];
        const treeDepth = Number(model.treeDepth ?? path.length);
        maxModelDepth = Math.max(maxModelDepth, treeDepth);
        depthDistribution[String(treeDepth)] = (depthDistribution[String(treeDepth)] ?? 0) + 1;

        if (parentId && !modelById.has(parentId)) { orphanedModels++; issues.push({ collection: 'models', docId: modelId, issue: `hierarchy parent "${parentId}" is missing`, severity: 'error', repairSuggestion: 'Clear parentModelId/variantOfModelId or attach it to an existing parent model' }); }
        if (parentId && parentId === modelId) { cyclicModels++; issues.push({ collection: 'models', docId: modelId, issue: 'model references itself as parent', severity: 'error', repairSuggestion: 'Clear the self-referencing hierarchy fields' }); }
        if (path.includes(modelId)) { cyclicModels++; issues.push({ collection: 'models', docId: modelId, issue: 'hierarchyPath contains the model itself', severity: 'error', repairSuggestion: 'Rebuild hierarchyPath from the parent chain' }); }
        if (treeDepth > MAX_MODEL_TREE_DEPTH) { invalidPaths++; issues.push({ collection: 'models', docId: modelId, issue: `treeDepth ${treeDepth} exceeds max depth ${MAX_MODEL_TREE_DEPTH}`, severity: 'error', repairSuggestion: 'Move the model higher in the hierarchy before activating it' }); }
        if (parentId) {
            const parent = modelById.get(parentId);
            const expectedPath = parent ? [...(parent.hierarchyPath ?? []).map(String), parentId] : [];
            if (expectedPath.length && JSON.stringify(expectedPath) !== JSON.stringify(path)) { invalidPaths++; issues.push({ collection: 'models', docId: modelId, issue: 'hierarchyPath does not match parent chain', severity: 'error', repairSuggestion: 'Recompute hierarchyPath from the selected parent model' }); }
        } else if (path.length > 0 || treeDepth !== 0) { invalidPaths++; issues.push({ collection: 'models', docId: modelId, issue: 'root model has non-empty hierarchyPath or non-zero treeDepth', severity: 'warning', repairSuggestion: 'Clear hierarchyPath and reset treeDepth to 0' }); }

        const lineageKey = getLineageKey(model);
        const previousLineageDocId = lineageByKey.get(lineageKey);
        if (previousLineageDocId) { duplicateLineages++; issues.push({ collection: 'models', docId: modelId, issue: `duplicate lineage with model "${previousLineageDocId}"`, severity: 'error', repairSuggestion: 'Rename, merge, or move one duplicate model in this lineage' }); }
        else lineageByKey.set(lineageKey, modelId);
    }

    const validModelIds = new Set(allModels.map((model) => String(model._id)));
    const allVariants = await Variant.find({ isDeleted: { $ne: true } }).select('_id name canonicalName slug modelId').lean();
    let orphanedVariants = 0;
    for (const variant of allVariants) {
        const modelId = variant.modelId ? String(variant.modelId) : null;
        if (!modelId || !validModelIds.has(modelId)) { orphanedVariants++; issues.push({ collection: 'variants', docId: String(variant._id), issue: modelId ? `modelId "${modelId}" is missing` : 'modelId is null or missing', severity: 'error', repairSuggestion: 'Attach this Variant to an existing parent model or deactivate it' }); }
    }

    const variantModelPairs = await Model.find({ isDeleted: { $ne: true }, variantOfModelId: { $ne: null } }).select('_id slug canonicalName variantOfModelId').lean<ModelHierarchyDoc[]>();
    const variantsByOwnerAndSlug = new Set(allVariants.map((v) => [String((v as { modelId?: unknown }).modelId ?? ''), slugifyCatalogValue(String((v as { slug?: unknown; canonicalName?: unknown; name?: unknown }).slug ?? (v as { canonicalName?: unknown }).canonicalName ?? (v as { name?: unknown }).name ?? ''))].join('|')));
    for (const vm of variantModelPairs) {
        const ownerId = String(vm.variantOfModelId ?? '');
        if (ownerId && variantsByOwnerAndSlug.has([ownerId, slugifyCatalogValue(String(vm.slug ?? vm.canonicalName ?? vm.name ?? ''))].join('|'))) {
            issues.push({ collection: 'models', docId: String(vm._id), issue: 'variant exists both as model hierarchy node and Variant collection record', severity: 'error', repairSuggestion: 'Choose the canonical Variant ownership path before adding another variant' });
        }
    }

    const allParts = await SparePart.find({ isDeleted: { $ne: true } }).select('_id categoryIds').lean();
    let orphanedParts = 0, staleCategoryParts = 0;
    for (const part of allParts) {
        const cats = ((part as { categoryIds?: unknown[] }).categoryIds ?? []).map(String);
        if (cats.length === 0) { orphanedParts++; issues.push({ collection: 'spareparts', docId: String(part._id), issue: 'categoryIds array is empty' }); continue; }
        const validCats = cats.filter((id) => validCatIds.has(id));
        if (validCats.length === 0) { orphanedParts++; issues.push({ collection: 'spareparts', docId: String(part._id), issue: 'all category references are stale' }); }
        else if (validCats.length < cats.length) { staleCategoryParts++; issues.push({ collection: 'spareparts', docId: String(part._id), issue: `${cats.length - validCats.length} stale category reference(s)` }); }
    }

    const allSizes = await ScreenSize.find({ isDeleted: { $ne: true } }).select('_id categoryId').lean();
    let orphanedSizes = 0;
    for (const ss of allSizes) {
        const catId = ss.categoryId ? String(ss.categoryId) : null;
        if (!catId || !validCatIds.has(catId)) { orphanedSizes++; issues.push({ collection: 'screensizes', docId: String(ss._id), issue: catId ? `categoryId "${catId}" is missing or inactive` : 'categoryId is null or missing' }); }
    }

    return {
        scannedAt: new Date(),
        brands: { total: allBrands.length, orphaned: orphanedBrands },
        models: { total: allModels.length, orphaned: orphanedModels, cycles: cyclicModels, duplicateLineages, invalidPaths, maxDepth: maxModelDepth },
        variants: { total: allVariants.length, orphaned: orphanedVariants },
        spareParts: { total: allParts.length, orphaned: orphanedParts, staleCategories: staleCategoryParts },
        screenSizes: { total: allSizes.length, orphaned: orphanedSizes },
        analytics: {
            totalDescendants: allModels.filter((m) => getEffectiveParentId(m)).length,
            totalVariants: allVariants.length + variantModelPairs.length,
            orphanCount: orphanedBrands + orphanedModels + orphanedVariants + orphanedParts + orphanedSizes,
            invalidLineageCount: cyclicModels + duplicateLineages + invalidPaths,
            maxModelDepth, depthDistribution,
        },
        issues,
    };
}

export async function getHierarchyTree(): Promise<HierarchyTreeResponse> {
    const [categories, brands, models, variants] = await Promise.all([
        Category.find({ isDeleted: { $ne: true } }).select('_id name slug listingType hasScreenSizes isActive').sort({ name: 1 }).lean(),
        Brand.find({ isDeleted: { $ne: true } }).select('_id name categoryIds isActive approvalStatus').sort({ name: 1 }).lean(),
        Model.find({ isDeleted: { $ne: true } }).select('_id name brandId categoryIds parentModelId variantOfModelId treeDepth isActive approvalStatus').sort({ name: 1 }).lean(),
        Variant.find({ isDeleted: { $ne: true } }).select('_id name modelId categoryIds isActive approvalStatus').sort({ name: 1 }).lean(),
    ]);

    const variantsByModel = new Map<string, typeof variants>();
    variants.forEach((v) => { const mid = v.modelId ? String(v.modelId) : ''; if (!mid) return; const ex = variantsByModel.get(mid) ?? []; ex.push(v); variantsByModel.set(mid, ex); });
    const modelsByBrand = new Map<string, typeof models>();
    models.forEach((m) => { const bid = m.brandId ? String(m.brandId) : ''; if (!bid) return; const ex = modelsByBrand.get(bid) ?? []; ex.push(m); modelsByBrand.set(bid, ex); });

    const categoriesTree = categories.map((cat) => ({
        id: String(cat._id), name: cat.name, slug: cat.slug,
        listingType: Array.isArray(cat.listingType) ? cat.listingType : [],
        hasScreenSizes: Boolean(cat.hasScreenSizes), isActive: Boolean(cat.isActive),
        brands: brands.filter((b) => ((b.categoryIds ?? []) as unknown[]).some((id) => String(id) === String(cat._id)))
            .map((b) => ({
                id: String(b._id), name: b.name, isActive: Boolean(b.isActive),
                approvalStatus: typeof (b as { approvalStatus?: unknown }).approvalStatus === 'string' ? (b as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected' : undefined,
                models: (modelsByBrand.get(String(b._id)) ?? []).filter((m) => ((m.categoryIds ?? []) as unknown[]).map(String).includes(String(cat._id)))
                    .map((m) => ({
                        id: String(m._id), name: m.name, isActive: Boolean(m.isActive),
                        approvalStatus: typeof (m as { approvalStatus?: unknown }).approvalStatus === 'string' ? (m as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected' : undefined,
                        variants: (variantsByModel.get(String(m._id)) ?? []).map((v) => ({
                            id: String(v._id), name: v.name, isActive: Boolean(v.isActive),
                            approvalStatus: typeof (v as { approvalStatus?: unknown }).approvalStatus === 'string' ? (v as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected' : undefined,
                        })),
                    })),
            })),
    }));

    return {
        summary: { categories: categories.length, brands: brands.length, models: models.length, variants: variants.length },
        categories: categoriesTree,
    };
}

export async function getModelDeletionImpact(id: string): Promise<ModelDeletionImpact> {
    const [listings, spareParts, variants, childModels, descendantModels, activeHierarchyRoots] = await Promise.all([
        Ad.countDocuments({ modelId: id }),
        SparePart.countDocuments({ modelId: id }),
        Variant.countDocuments({ modelId: id, isDeleted: { $ne: true } }),
        Model.countDocuments({ $or: [{ parentModelId: id }, { variantOfModelId: id }], isDeleted: { $ne: true } }),
        Model.countDocuments({ hierarchyPath: id, $nor: [{ parentModelId: id }, { variantOfModelId: id }], isDeleted: { $ne: true } }),
        Model.countDocuments({ _id: id, isParentModel: true, isActive: true, isDeleted: { $ne: true } }),
    ]);
    return { listings, spareParts, variants, childModels, descendantModels, activeHierarchyRoots, totalBlocked: listings + spareParts + variants + childModels + descendantModels + activeHierarchyRoots };
}

export async function repairStaleModelHierarchy(options: { dryRun?: boolean } = {}): Promise<ModelHierarchyRepairPlan> {
    const dryRun = options.dryRun !== false;
    const models = await Model.find({ isDeleted: { $ne: true } }).select(modelSelect).sort({ treeDepth: 1, name: 1 }).lean<ModelHierarchyDoc[]>();
    const modelById = new Map(models.map((m) => [String(m._id), m]));
    const updates: ModelHierarchyRepairPlan['updates'] = [];
    let maxDepthViolations = 0;

    for (const model of models) {
        const modelId = String(model._id);
        const parentId = getEffectiveParentId(model);
        const currentPath = Array.isArray(model.hierarchyPath) ? model.hierarchyPath.map(String) : [];
        const currentDepth = Number(model.treeDepth ?? currentPath.length);
        let nextPath: string[] = [];
        if (parentId) { const parent = modelById.get(parentId); if (!parent) continue; nextPath = [...((parent.hierarchyPath ?? []).map(String)), parentId]; }
        const nextDepth = nextPath.length;
        if (nextDepth > MAX_MODEL_TREE_DEPTH) { maxDepthViolations++; continue; }
        if (currentDepth !== nextDepth || JSON.stringify(currentPath) !== JSON.stringify(nextPath)) {
            updates.push({ modelId, currentHierarchyPath: currentPath, nextHierarchyPath: nextPath, currentTreeDepth: currentDepth, nextTreeDepth: nextDepth });
        }
    }

    let applied = 0;
    if (!dryRun && updates.length > 0) {
        const session = await Model.db.startSession();
        try {
            await session.withTransaction(async () => {
                const ops: AnyBulkWriteOperation[] = updates.map((u) => ({ updateOne: { filter: { _id: u.modelId, isDeleted: { $ne: true } }, update: { $set: { hierarchyPath: u.nextHierarchyPath, treeDepth: u.nextTreeDepth }, $inc: { __v: 1 } } } }));
                const result = await Model.bulkWrite(ops, { ordered: true, session });
                applied = result.modifiedCount ?? ops.length;
            });
        } finally { await session.endSession(); }
    }

    return { dryRun, scanned: models.length, staleNodes: updates.length, maxDepthViolations, updates, applied };
}

export async function activateValidRecords(): Promise<{ brands: number; spareParts: number; screenSizes: number }> {
    const { CATALOG_APPROVAL_STATUS } = await import('@esparex/shared');
    const validCatIds = new Set(await getActiveCategoryIds());

    const inactiveBrands = await Brand.find({ isDeleted: { $ne: true }, deletedAt: null, isActive: false, approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED, needsReview: { $ne: true }, categoryIds: { $exists: true, $not: { $size: 0 } } }).select('_id categoryIds').lean();
    const activateBrandOps = buildActivateOps(inactiveBrands, (b) => ((b as { categoryIds?: unknown[] }).categoryIds ?? []).some((id: unknown) => validCatIds.has(String(id))));
    if (activateBrandOps.length) await Brand.bulkWrite(activateBrandOps, { ordered: false });

    const inactiveParts = await SparePart.find({ isDeleted: { $ne: true }, isActive: false, categoryIds: { $exists: true, $not: { $size: 0 } } }).select('_id categoryIds').lean();
    const activatePartOps = buildActivateOps(inactiveParts, (p) => ((p as { categoryIds?: unknown[] }).categoryIds ?? []).some((id: unknown) => validCatIds.has(String(id))));
    if (activatePartOps.length) await SparePart.bulkWrite(activatePartOps, { ordered: false });

    const inactiveSizes = await ScreenSize.find({ isDeleted: { $ne: true }, isActive: false }).select('_id categoryId').lean();
    const activateSizeOps = buildActivateOps(inactiveSizes, (ss) => !!(ss.categoryId && validCatIds.has(String(ss.categoryId))));
    if (activateSizeOps.length) await ScreenSize.bulkWrite(activateSizeOps, { ordered: false });

    return { brands: activateBrandOps.length, spareParts: activatePartOps.length, screenSizes: activateSizeOps.length };
}
