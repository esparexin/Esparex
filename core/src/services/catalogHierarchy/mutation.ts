import type { AnyBulkWriteOperation } from 'mongoose';
import mongoose from 'mongoose';
import Model from '../../models/Model';
import Brand, { IBrand } from '../../models/Brand';
import SparePart, { ISparePart } from '../../models/SparePart';
import ScreenSize, { IScreenSize } from '../../models/ScreenSize';
import Category from '../../models/Category';
import { getActiveCategoryIds } from '../catalog/CatalogValidationService';
import type { ModelHierarchyDoc, ModelHierarchyTransactionResult, RepairSummary } from './types';
import { MAX_MODEL_TREE_DEPTH } from './constants';
import { normalizeId, modelSelect, validateModelHierarchyMutation } from './validation';

const hierarchyTelemetry = {
    modelHierarchyMutations: 0,
    modelHierarchyRollbacks: 0,
    descendantCascadeUpdates: 0,
    descendantCascadeScans: 0,
    lastMutationDurationMs: 0,
    lastRollbackAt: undefined as Date | undefined,
};

export const getHierarchyTelemetrySnapshot = () => ({ ...hierarchyTelemetry, lastRollbackAt: hierarchyTelemetry.lastRollbackAt ? new Date(hierarchyTelemetry.lastRollbackAt) : undefined });

const hasHierarchyMutation = (data: Record<string, unknown>, existing: ModelHierarchyDoc): boolean => {
    const nextParentId = normalizeId(data.parentModelId) ?? null;
    const nextVariantId = normalizeId(data.variantOfModelId) ?? null;
    const oldParentId = normalizeId(existing.parentModelId) ?? null;
    const oldVariantId = normalizeId(existing.variantOfModelId) ?? null;
    const nextPath = Array.isArray(data.hierarchyPath) ? data.hierarchyPath.map(String) : [];
    const oldPath = Array.isArray(existing.hierarchyPath) ? existing.hierarchyPath.map(String) : [];
    return nextParentId !== oldParentId || nextVariantId !== oldVariantId ||
        Number(data.treeDepth ?? 0) !== Number(existing.treeDepth ?? 0) ||
        JSON.stringify(nextPath) !== JSON.stringify(oldPath);
};

const buildDescendantCascadeOps = (rootId: string, nextRoot: ModelHierarchyDoc, descendants: ModelHierarchyDoc[], nextBrandId: unknown): AnyBulkWriteOperation[] => {
    const nextPrefix = [...((nextRoot.hierarchyPath ?? []).map(String)), rootId];
    return descendants.map((descendant) => {
        const currentPath = (descendant.hierarchyPath ?? []).map(String);
        const rootIndex = currentPath.indexOf(rootId);
        const tail = rootIndex >= 0 ? currentPath.slice(rootIndex + 1) : [];
        const nextPath = [...nextPrefix, ...tail];
        const nextDepth = nextPath.length;
        if (nextDepth > MAX_MODEL_TREE_DEPTH) throw new Error(`Descendant hierarchy depth cannot exceed ${MAX_MODEL_TREE_DEPTH}`);
        return { updateOne: { filter: { _id: descendant._id, isDeleted: { $ne: true } }, update: { $set: { hierarchyPath: nextPath, treeDepth: nextDepth, brandId: nextBrandId }, $inc: { __v: 1 } } } };
    });
};

export async function updateModelHierarchyTransactionally(id: string, rawData: Record<string, unknown>, options: { expectedVersion?: number; expectedUpdatedAt?: Date | string | null } = {}): Promise<ModelHierarchyTransactionResult> {
    const startedAt = Date.now();
    const session = await Model.db.startSession();
    let rollback = false, cascadeUpdateCount = 0, descendantScanCount = 0;

    try {
        let updatedItem: unknown = null;
        await session.withTransaction(async () => {
            const existing = await Model.findOne({ _id: id, isDeleted: { $ne: true } }).select(`${modelSelect} categoryIds isActive approvalStatus updatedAt __v`).session(session);
            if (!existing) throw new Error('Model not found');
            const existingPlain = existing.toObject({ versionKey: true }) as ModelHierarchyDoc & { __v?: number };
            if (typeof options.expectedVersion === 'number' && existingPlain.__v !== options.expectedVersion) throw new Error('Model hierarchy was updated by another admin; reload before saving');
            if (options.expectedUpdatedAt) {
                const expectedTime = new Date(options.expectedUpdatedAt).getTime();
                const actualTime = existingPlain.updatedAt ? new Date(existingPlain.updatedAt).getTime() : NaN;
                if (Number.isFinite(expectedTime) && Number.isFinite(actualTime) && expectedTime !== actualTime) throw new Error('Model hierarchy was updated by another admin; reload before saving');
            }
            const validated = await validateModelHierarchyMutation(rawData, { existingModel: existingPlain, modelId: id, session });
            const hierarchyChanged = hasHierarchyMutation(validated, existingPlain);
            const nextBrandId = validated.brandId ?? existingPlain.brandId;
            const updateFilter: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };
            if (typeof existingPlain.__v === 'number') updateFilter.__v = existingPlain.__v;

            const root = await Model.findOneAndUpdate(updateFilter, { $set: validated, $inc: { __v: 1 } }, { new: true, runValidators: true, session });
            if (!root) throw new Error('Model hierarchy changed concurrently; reload before saving');

            if (hierarchyChanged) {
                const descendants = await Model.find({ hierarchyPath: id, isDeleted: { $ne: true } }).select(modelSelect).sort({ treeDepth: 1 }).session(session).lean<ModelHierarchyDoc[]>();
                descendantScanCount = descendants.length;
                const ops = buildDescendantCascadeOps(id, root.toObject() as ModelHierarchyDoc, descendants, nextBrandId);
                if (ops.length > 0) { const result = await Model.bulkWrite(ops, { ordered: true, session }); cascadeUpdateCount = result.modifiedCount ?? ops.length; }
            }
            updatedItem = root;
        });

        hierarchyTelemetry.modelHierarchyMutations++;
        hierarchyTelemetry.descendantCascadeUpdates += cascadeUpdateCount;
        hierarchyTelemetry.descendantCascadeScans += descendantScanCount;
        hierarchyTelemetry.lastMutationDurationMs = Date.now() - startedAt;
        return { item: updatedItem, metrics: { durationMs: Date.now() - startedAt, cascadeUpdateCount, descendantScanCount, rollback } };
    } catch (error) {
        rollback = true;
        hierarchyTelemetry.modelHierarchyRollbacks++;
        hierarchyTelemetry.lastRollbackAt = new Date();
        throw error;
    } finally { await session.endSession(); }
}

export async function repairHierarchy(): Promise<RepairSummary> {
    const summary: RepairSummary = { brandsRepaired: 0, brandsOrphaned: 0, sparePartsRepaired: 0, sparePartsOrphaned: 0, screenSizesDeactivated: 0 };
    const validCatIds = new Set(await getActiveCategoryIds());
    const categories = await Category.find({ isDeleted: { $ne: true }, isActive: true }).select('_id name slug').lean();
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c._id]));
    const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

    // Repair brands with null categoryId
    const orphanBrands = await Brand.find({ isDeleted: { $ne: true }, $or: [{ categoryIds: null }, { categoryIds: { $exists: false } }, { categoryIds: { $size: 0 } }] }).lean();
    const brandRepairOps: AnyBulkWriteOperation<IBrand>[] = [];
    const brandOrphanOps: AnyBulkWriteOperation<IBrand>[] = [];
    for (const brand of orphanBrands) {
        const nameLower = (brand.name ?? '').toLowerCase().trim();
        const matchedCatId = catByName.get(nameLower) ?? catBySlug.get(nameLower.replace(/[^a-z0-9]+/g, '-')) ?? null;
        if (matchedCatId) { brandRepairOps.push({ updateOne: { filter: { _id: brand._id }, update: { $set: { categoryIds: [matchedCatId], needsReview: false } } } }); summary.brandsRepaired++; }
        else { brandOrphanOps.push({ updateOne: { filter: { _id: brand._id }, update: { $set: { isActive: false, needsReview: true } } } }); summary.brandsOrphaned++; }
    }
    if (brandRepairOps.length) await Brand.bulkWrite(brandRepairOps, { ordered: false });
    if (brandOrphanOps.length) await Brand.bulkWrite(brandOrphanOps, { ordered: false });

    // Repair spare parts
    const brandCatMap = new Map((await Brand.find({ isDeleted: { $ne: true }, isActive: true, categoryIds: { $exists: true, $not: { $size: 0 } } }).select('_id categoryIds').lean()).map((b) => [String(b._id), b.categoryIds?.[0] || null]));
    const emptyParts = await SparePart.find({ isDeleted: { $ne: true }, $or: [{ categoryIds: { $exists: false } }, { categoryIds: null }, { categoryIds: { $size: 0 } }] }).lean();
    const partRepairOps: AnyBulkWriteOperation<ISparePart>[] = [];
    const partOrphanOps: AnyBulkWriteOperation<ISparePart>[] = [];
    for (const part of emptyParts) {
        const derivedCatId = part.brandId ? (brandCatMap.get(String(part.brandId)) ?? null) : null;
        if (derivedCatId && validCatIds.has(String(derivedCatId))) { partRepairOps.push({ updateOne: { filter: { _id: part._id }, update: { $set: { categoryIds: [derivedCatId] } } } }); summary.sparePartsRepaired++; }
        else { partOrphanOps.push({ updateOne: { filter: { _id: part._id }, update: { $set: { isActive: false, categoryIds: [] } } } }); summary.sparePartsOrphaned++; }
    }
    const allActiveParts = await SparePart.find({ isDeleted: { $ne: true }, categoryIds: { $exists: true, $not: { $size: 0 } } }).select('_id categoryIds').lean();
    const pruneOps: AnyBulkWriteOperation<ISparePart>[] = [];
    for (const part of allActiveParts) {
        const cats = ((part as { categoryIds?: unknown[] }).categoryIds ?? []).map(String);
        const validCats = cats.filter((id) => validCatIds.has(id));
        if (validCats.length === cats.length) continue;
        if (validCats.length === 0) { partOrphanOps.push({ updateOne: { filter: { _id: part._id }, update: { $set: { isActive: false, categoryIds: [] } } } }); summary.sparePartsOrphaned++; }
        else { pruneOps.push({ updateOne: { filter: { _id: part._id }, update: { $set: { categoryIds: validCats.map((id) => new mongoose.Types.ObjectId(id)) } } } }); }
    }
    if (partRepairOps.length) await SparePart.bulkWrite(partRepairOps, { ordered: false });
    if (partOrphanOps.length) await SparePart.bulkWrite(partOrphanOps, { ordered: false });
    if (pruneOps.length) await SparePart.bulkWrite(pruneOps, { ordered: false });

    // Deactivate orphan screen sizes
    const staleSizes = await ScreenSize.find({ isDeleted: { $ne: true } }).select('_id categoryId').lean();
    const sizeDeactivateOps: AnyBulkWriteOperation<IScreenSize>[] = [];
    for (const ss of staleSizes) {
        const catId = ss.categoryId ? String(ss.categoryId) : null;
        if (!catId || !validCatIds.has(catId)) { sizeDeactivateOps.push({ updateOne: { filter: { _id: ss._id }, update: { $set: { isActive: false } } } }); summary.screenSizesDeactivated++; }
    }
    if (sizeDeactivateOps.length) await ScreenSize.bulkWrite(sizeDeactivateOps, { ordered: false });

    return summary;
}
