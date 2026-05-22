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

import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import type {
    HierarchyTreeResponse,
} from "@esparex/shared";
import type { AnyBulkWriteOperation, ClientSession } from 'mongoose';
import mongoose from 'mongoose';
import Category from '../../models/Category';
import Brand, { IBrand } from '../../models/Brand';
import Model from '../../models/Model';
import Ad from '../../models/Ad';
import Variant from '../../models/Variant';
import SparePart, { ISparePart } from '../../models/SparePart';
import ScreenSize, { IScreenSize } from '../../models/ScreenSize';
import { getActiveCategoryIds } from './CatalogValidationService';
import { normalizeCatalogCanonicalName, slugifyCatalogValue } from '../../utils/catalogGovernance';

type WithId = { _id: unknown };
export type ModelHierarchyDoc = {
    _id: unknown;
    name?: string;
    displayName?: string;
    canonicalName?: string;
    slug?: string;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: string[];
    treeDepth?: number;
    categoryIds?: unknown[];
    isActive?: boolean;
    approvalStatus?: unknown;
    updatedAt?: Date;
};

export const MAX_MODEL_TREE_DEPTH = 5;

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
    severity?: 'warning' | 'error';
    repairSuggestion?: string;
}

export interface HierarchyReport {
    scannedAt: Date;
    brands:     { total: number; orphaned: number };
    models:     {
        total: number;
        orphaned: number;
        cycles: number;
        duplicateLineages: number;
        invalidPaths: number;
        maxDepth: number;
    };
    variants:   { total: number; orphaned: number };
    spareParts: { total: number; orphaned: number; staleCategories: number };
    screenSizes:{ total: number; orphaned: number };
    analytics: {
        totalDescendants: number;
        totalVariants: number;
        orphanCount: number;
        invalidLineageCount: number;
        maxModelDepth: number;
        depthDistribution: Record<string, number>;
    };
    issues: HierarchyIssue[];
}

export interface RepairSummary {
    brandsRepaired:       number;
    brandsOrphaned:       number;
    sparePartsRepaired:   number;
    sparePartsOrphaned:   number;
    screenSizesDeactivated: number;
}

export interface ModelHierarchyMutationPayload {
    name?: unknown;
    displayName?: unknown;
    canonicalName?: unknown;
    slug?: unknown;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: unknown;
    treeDepth?: unknown;
    isParentModel?: unknown;
}

export interface ModelDeletionImpact {
    listings: number;
    spareParts: number;
    variants: number;
    childModels: number;
    descendantModels: number;
    activeHierarchyRoots: number;
    totalBlocked: number;
}

export interface ModelHierarchyTransactionResult {
    item: unknown;
    metrics: {
        durationMs: number;
        cascadeUpdateCount: number;
        descendantScanCount: number;
        rollback: boolean;
    };
}

export interface HierarchyTelemetrySnapshot {
    modelHierarchyMutations: number;
    modelHierarchyRollbacks: number;
    descendantCascadeUpdates: number;
    descendantCascadeScans: number;
    lastMutationDurationMs: number;
    lastRollbackAt?: Date;
}

export interface ModelHierarchyRepairPlan {
    dryRun: boolean;
    scanned: number;
    staleNodes: number;
    maxDepthViolations: number;
    updates: Array<{
        modelId: string;
        currentHierarchyPath: string[];
        nextHierarchyPath: string[];
        currentTreeDepth: number;
        nextTreeDepth: number;
    }>;
    applied: number;
}

const hierarchyTelemetry: HierarchyTelemetrySnapshot = {
    modelHierarchyMutations: 0,
    modelHierarchyRollbacks: 0,
    descendantCascadeUpdates: 0,
    descendantCascadeScans: 0,
    lastMutationDurationMs: 0,
};

export const getHierarchyTelemetrySnapshot = (): HierarchyTelemetrySnapshot => ({
    ...hierarchyTelemetry,
    lastRollbackAt: hierarchyTelemetry.lastRollbackAt ? new Date(hierarchyTelemetry.lastRollbackAt) : undefined,
});

const normalizeId = (value: unknown): string | null => {
    if (!value) return null;
    const candidate = String(value);
    return mongoose.Types.ObjectId.isValid(candidate) ? candidate : null;
};

const getEffectiveParentId = (model: Pick<ModelHierarchyDoc, 'parentModelId' | 'variantOfModelId'>): string | null =>
    normalizeId(model.variantOfModelId) ?? normalizeId(model.parentModelId);

const getLineageKey = (model: Pick<ModelHierarchyDoc, 'brandId' | 'parentModelId' | 'variantOfModelId' | 'canonicalName' | 'slug' | 'name' | 'displayName'>): string => {
    const canonicalSource = String(model.canonicalName ?? model.displayName ?? model.name ?? model.slug ?? '');
    const normalizedName = normalizeCatalogCanonicalName(canonicalSource);
    const normalizedSlug = slugifyCatalogValue(String(model.slug ?? normalizedName));
    return [
        normalizeId(model.brandId) ?? 'no-brand',
        getEffectiveParentId(model) ?? 'root',
        normalizedSlug || normalizedName,
    ].join('|');
};

const modelSelect = '_id name displayName canonicalName slug brandId parentModelId variantOfModelId hierarchyPath treeDepth';

export async function validateModelHierarchyMutation(
    payload: ModelHierarchyMutationPayload,
    options: { existingModel?: ModelHierarchyDoc | null; modelId?: string | null; session?: ClientSession | null } = {}
): Promise<Record<string, unknown>> {
    const mutable = payload as Record<string, unknown>;
    const existing = options.existingModel ?? null;
    const currentId = normalizeId(options.modelId ?? existing?._id);
    const nextBrandId = normalizeId(mutable.brandId) ?? normalizeId(existing?.brandId);
    const parentModelId = mutable.parentModelId === null
        ? null
        : normalizeId(mutable.parentModelId) ?? (mutable.parentModelId === undefined ? normalizeId(existing?.parentModelId) : null);
    const variantOfModelId = mutable.variantOfModelId === null
        ? null
        : normalizeId(mutable.variantOfModelId) ?? (mutable.variantOfModelId === undefined ? normalizeId(existing?.variantOfModelId) : null);
    const hierarchyParentId = variantOfModelId ?? parentModelId;

    if (mutable.parentModelId === '') mutable.parentModelId = null;
    if (mutable.variantOfModelId === '') mutable.variantOfModelId = null;

    if (hierarchyParentId && currentId && hierarchyParentId === currentId) {
        throw new Error('A model cannot be its own parent or variant source');
    }

    let parent: ModelHierarchyDoc | null = null;
    if (hierarchyParentId) {
        parent = await Model.findOne({ _id: hierarchyParentId, isDeleted: { $ne: true } })
            .select(modelSelect)
            .session(options.session ?? null)
            .lean<ModelHierarchyDoc>();
        if (!parent) {
            throw new Error('Parent model must reference an existing model');
        }
        if (nextBrandId && normalizeId(parent.brandId) !== nextBrandId) {
            throw new Error('Parent model must belong to the selected brand');
        }

        const parentPath = Array.isArray(parent.hierarchyPath) ? parent.hierarchyPath.map(String) : [];
        if (currentId && parentPath.includes(currentId)) {
            throw new Error('Circular model hierarchy is not allowed');
        }
        const nextDepth = Number(parent.treeDepth ?? parentPath.length) + 1;
        if (nextDepth > MAX_MODEL_TREE_DEPTH) {
            throw new Error(`Model hierarchy depth cannot exceed ${MAX_MODEL_TREE_DEPTH}`);
        }

        mutable.parentModelId = parentModelId ?? hierarchyParentId;
        mutable.variantOfModelId = variantOfModelId;
        mutable.treeDepth = nextDepth;
        mutable.hierarchyPath = [...parentPath, String(parent._id)];
        mutable.isParentModel = Boolean(mutable.isParentModel ?? false);
    } else {
        mutable.parentModelId = null;
        mutable.variantOfModelId = null;
        mutable.treeDepth = 0;
        mutable.hierarchyPath = [];
    }

    const lineageCandidate: ModelHierarchyDoc = {
        _id: currentId,
        name: typeof mutable.name === 'string' ? mutable.name : existing?.name,
        displayName: typeof mutable.displayName === 'string' ? mutable.displayName : existing?.displayName,
        canonicalName: typeof mutable.canonicalName === 'string' ? mutable.canonicalName : existing?.canonicalName,
        slug: typeof mutable.slug === 'string' ? mutable.slug : existing?.slug,
        brandId: nextBrandId,
        parentModelId: mutable.parentModelId,
        variantOfModelId: mutable.variantOfModelId,
    };
    const lineageKeyParts = getLineageKey(lineageCandidate).split('|');
    const normalizedSlug = lineageKeyParts[lineageKeyParts.length - 1];
    const siblingQuery: Record<string, unknown> = {
        brandId: nextBrandId,
        isDeleted: { $ne: true },
        $or: [
            { slug: normalizedSlug },
            { canonicalName: normalizeCatalogCanonicalName(String(lineageCandidate.canonicalName ?? lineageCandidate.displayName ?? lineageCandidate.name ?? '')) },
        ],
    };
    if (currentId) siblingQuery._id = { $ne: currentId };
    if (hierarchyParentId) {
        siblingQuery.$and = [{
            $or: [
                { parentModelId: hierarchyParentId },
                { variantOfModelId: hierarchyParentId },
            ],
        }];
    } else {
        siblingQuery.parentModelId = { $in: [null] };
        siblingQuery.variantOfModelId = { $in: [null] };
    }
    const duplicateModel = await Model.exists(siblingQuery).session(options.session ?? null);
    if (duplicateModel) {
        throw new Error('Duplicate model lineage is not allowed for the same brand and parent');
    }

    if (variantOfModelId) {
        const conflictingVariant = await Variant.exists({
            modelId: variantOfModelId,
            isDeleted: { $ne: true },
            $or: [
                { slug: normalizedSlug },
                { canonicalName: normalizeCatalogCanonicalName(String(lineageCandidate.canonicalName ?? lineageCandidate.displayName ?? lineageCandidate.name ?? '')) },
            ],
        }).session(options.session ?? null);
        if (conflictingVariant) {
            throw new Error('Variant already exists in the canonical Variant collection for this parent model');
        }
    }

    return mutable;
}

const hasHierarchyMutation = (data: Record<string, unknown>, existing: ModelHierarchyDoc): boolean => {
    const nextParentId = normalizeId(data.parentModelId) ?? null;
    const nextVariantId = normalizeId(data.variantOfModelId) ?? null;
    const oldParentId = normalizeId(existing.parentModelId) ?? null;
    const oldVariantId = normalizeId(existing.variantOfModelId) ?? null;
    const nextPath = Array.isArray(data.hierarchyPath) ? data.hierarchyPath.map(String) : [];
    const oldPath = Array.isArray(existing.hierarchyPath) ? existing.hierarchyPath.map(String) : [];
    const nextDepth = Number(data.treeDepth ?? 0);
    const oldDepth = Number(existing.treeDepth ?? 0);
    return nextParentId !== oldParentId ||
        nextVariantId !== oldVariantId ||
        nextDepth !== oldDepth ||
        JSON.stringify(nextPath) !== JSON.stringify(oldPath);
};

const buildDescendantCascadeOps = (
    rootId: string,
    nextRoot: ModelHierarchyDoc,
    descendants: ModelHierarchyDoc[],
    nextBrandId: unknown
): AnyBulkWriteOperation[] => {
    const nextPrefix = [...((nextRoot.hierarchyPath ?? []).map(String)), rootId];

    return descendants.map((descendant) => {
        const currentPath = (descendant.hierarchyPath ?? []).map(String);
        const rootIndex = currentPath.indexOf(rootId);
        const tail = rootIndex >= 0 ? currentPath.slice(rootIndex + 1) : [];
        const nextPath = [...nextPrefix, ...tail];
        const nextDepth = nextPath.length;

        if (nextDepth > MAX_MODEL_TREE_DEPTH) {
            throw new Error(`Descendant hierarchy depth cannot exceed ${MAX_MODEL_TREE_DEPTH}`);
        }

        return {
            updateOne: {
                filter: { _id: descendant._id, isDeleted: { $ne: true } },
                update: {
                    $set: {
                        hierarchyPath: nextPath,
                        treeDepth: nextDepth,
                        brandId: nextBrandId,
                    },
                    $inc: { __v: 1 },
                },
            },
        };
    });
};

export async function updateModelHierarchyTransactionally(
    id: string,
    rawData: Record<string, unknown>,
    options: { expectedVersion?: number; expectedUpdatedAt?: Date | string | null } = {}
): Promise<ModelHierarchyTransactionResult> {
    const startedAt = Date.now();
    const session = await Model.db.startSession();
    let rollback = false;
    let cascadeUpdateCount = 0;
    let descendantScanCount = 0;

    try {
        let updatedItem: unknown = null;

        await session.withTransaction(async () => {
            const existing = await Model.findOne({ _id: id, isDeleted: { $ne: true } })
                .select(`${modelSelect} categoryIds isActive approvalStatus updatedAt __v`)
                .session(session);
            if (!existing) {
                throw new Error('Model not found');
            }

            const existingPlain = existing.toObject({ versionKey: true }) as ModelHierarchyDoc & { __v?: number };
            if (typeof options.expectedVersion === 'number' && existingPlain.__v !== options.expectedVersion) {
                throw new Error('Model hierarchy was updated by another admin; reload before saving');
            }
            if (options.expectedUpdatedAt) {
                const expectedTime = new Date(options.expectedUpdatedAt).getTime();
                const actualTime = existingPlain.updatedAt ? new Date(existingPlain.updatedAt).getTime() : NaN;
                if (Number.isFinite(expectedTime) && Number.isFinite(actualTime) && expectedTime !== actualTime) {
                    throw new Error('Model hierarchy was updated by another admin; reload before saving');
                }
            }

            const validated = await validateModelHierarchyMutation(rawData, {
                existingModel: existingPlain,
                modelId: id,
                session,
            });
            const hierarchyChanged = hasHierarchyMutation(validated, existingPlain);
            const nextBrandId = validated.brandId ?? existingPlain.brandId;

            const updateFilter: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };
            if (typeof existingPlain.__v === 'number') {
                updateFilter.__v = existingPlain.__v;
            }

            const root = await Model.findOneAndUpdate(
                updateFilter,
                { $set: validated, $inc: { __v: 1 } },
                { new: true, runValidators: true, session }
            );

            if (!root) {
                throw new Error('Model hierarchy changed concurrently; reload before saving');
            }

            if (hierarchyChanged) {
                const descendants = await Model.find({
                    hierarchyPath: id,
                    isDeleted: { $ne: true },
                })
                    .select(modelSelect)
                    .sort({ treeDepth: 1 })
                    .session(session)
                    .lean<ModelHierarchyDoc[]>();
                descendantScanCount = descendants.length;

                const ops = buildDescendantCascadeOps(id, root.toObject() as ModelHierarchyDoc, descendants, nextBrandId);
                if (ops.length > 0) {
                    const result = await Model.bulkWrite(ops, { ordered: true, session });
                    cascadeUpdateCount = result.modifiedCount ?? ops.length;
                }
            }

            updatedItem = root;
        });

        hierarchyTelemetry.modelHierarchyMutations++;
        hierarchyTelemetry.descendantCascadeUpdates += cascadeUpdateCount;
        hierarchyTelemetry.descendantCascadeScans += descendantScanCount;
        hierarchyTelemetry.lastMutationDurationMs = Date.now() - startedAt;

        return {
            item: updatedItem,
            metrics: {
                durationMs: Date.now() - startedAt,
                cascadeUpdateCount,
                descendantScanCount,
                rollback,
            },
        };
    } catch (error) {
        rollback = true;
        hierarchyTelemetry.modelHierarchyRollbacks++;
        hierarchyTelemetry.lastRollbackAt = new Date();
        throw error;
    } finally {
        await session.endSession();
    }
}

export async function repairStaleModelHierarchy(options: { dryRun?: boolean } = {}): Promise<ModelHierarchyRepairPlan> {
    const dryRun = options.dryRun !== false;
    const models = await Model.find({ isDeleted: { $ne: true } })
        .select(modelSelect)
        .sort({ treeDepth: 1, name: 1 })
        .lean<ModelHierarchyDoc[]>();
    const modelById = new Map(models.map((model) => [String(model._id), model]));
    const updates: ModelHierarchyRepairPlan['updates'] = [];
    let maxDepthViolations = 0;

    for (const model of models) {
        const modelId = String(model._id);
        const parentId = getEffectiveParentId(model);
        const currentHierarchyPath = Array.isArray(model.hierarchyPath) ? model.hierarchyPath.map(String) : [];
        const currentTreeDepth = Number(model.treeDepth ?? currentHierarchyPath.length);
        let nextHierarchyPath: string[] = [];

        if (parentId) {
            const parent = modelById.get(parentId);
            if (!parent) continue;
            nextHierarchyPath = [...((parent.hierarchyPath ?? []).map(String)), parentId];
        }

        const nextTreeDepth = nextHierarchyPath.length;
        if (nextTreeDepth > MAX_MODEL_TREE_DEPTH) {
            maxDepthViolations++;
            continue;
        }

        if (
            currentTreeDepth !== nextTreeDepth ||
            JSON.stringify(currentHierarchyPath) !== JSON.stringify(nextHierarchyPath)
        ) {
            updates.push({
                modelId,
                currentHierarchyPath,
                nextHierarchyPath,
                currentTreeDepth,
                nextTreeDepth,
            });
        }
    }

    let applied = 0;
    if (!dryRun && updates.length > 0) {
        const session = await Model.db.startSession();
        try {
            await session.withTransaction(async () => {
                const ops: AnyBulkWriteOperation[] = updates.map((update) => ({
                    updateOne: {
                        filter: { _id: update.modelId, isDeleted: { $ne: true } },
                        update: {
                            $set: {
                                hierarchyPath: update.nextHierarchyPath,
                                treeDepth: update.nextTreeDepth,
                            },
                            $inc: { __v: 1 },
                        },
                    },
                }));
                const result = await Model.bulkWrite(ops, { ordered: true, session });
                applied = result.modifiedCount ?? ops.length;
            });
        } finally {
            await session.endSession();
        }
    }

    return {
        dryRun,
        scanned: models.length,
        staleNodes: updates.length,
        maxDepthViolations,
        updates,
        applied,
    };
}

export async function getModelDeletionImpact(id: string): Promise<ModelDeletionImpact> {
    const [listings, spareParts, variants, childModels, descendantModels, activeHierarchyRoots] = await Promise.all([
        Ad.countDocuments({ modelId: id }),
        SparePart.countDocuments({ modelId: id }),
        Variant.countDocuments({ modelId: id, isDeleted: { $ne: true } }),
        Model.countDocuments({ $or: [{ parentModelId: id }, { variantOfModelId: id }], isDeleted: { $ne: true } }),
        Model.countDocuments({
            hierarchyPath: id,
            $nor: [{ parentModelId: id }, { variantOfModelId: id }],
            isDeleted: { $ne: true },
        }),
        Model.countDocuments({ _id: id, isParentModel: true, isActive: true, isDeleted: { $ne: true } }),
    ]);
    return {
        listings,
        spareParts,
        variants,
        childModels,
        descendantModels,
        activeHierarchyRoots,
        totalBlocked: listings + spareParts + variants + childModels + descendantModels + activeHierarchyRoots,
    };
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
        .select(modelSelect)
        .lean<ModelHierarchyDoc[]>();
    const modelById = new Map(allModels.map((model) => [String(model._id), model]));

    let orphanedModels = 0;
    let cyclicModels = 0;
    let duplicateLineages = 0;
    let invalidPaths = 0;
    let maxModelDepth = 0;
    const depthDistribution: Record<string, number> = {};
    const lineageByKey = new Map<string, string>();

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
                severity: 'error',
                repairSuggestion: 'Assign the model to an active brand or deactivate it for review',
            });
        }

        const modelId = String(model._id);
        const parentId = getEffectiveParentId(model);
        const path = Array.isArray(model.hierarchyPath) ? model.hierarchyPath.map(String) : [];
        const treeDepth = Number(model.treeDepth ?? path.length);
        maxModelDepth = Math.max(maxModelDepth, treeDepth);
        depthDistribution[String(treeDepth)] = (depthDistribution[String(treeDepth)] ?? 0) + 1;

        if (parentId && !modelById.has(parentId)) {
            orphanedModels++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: `hierarchy parent "${parentId}" is missing`,
                severity: 'error',
                repairSuggestion: 'Clear parentModelId/variantOfModelId or attach it to an existing parent model',
            });
        }
        if (parentId && parentId === modelId) {
            cyclicModels++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: 'model references itself as parent',
                severity: 'error',
                repairSuggestion: 'Clear the self-referencing hierarchy fields',
            });
        }
        if (path.includes(modelId)) {
            cyclicModels++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: 'hierarchyPath contains the model itself',
                severity: 'error',
                repairSuggestion: 'Rebuild hierarchyPath from the parent chain',
            });
        }
        if (treeDepth > MAX_MODEL_TREE_DEPTH) {
            invalidPaths++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: `treeDepth ${treeDepth} exceeds max depth ${MAX_MODEL_TREE_DEPTH}`,
                severity: 'error',
                repairSuggestion: 'Move the model higher in the hierarchy before activating it',
            });
        }
        if (parentId) {
            const parent = modelById.get(parentId);
            const expectedPath = parent ? [...(parent.hierarchyPath ?? []).map(String), parentId] : [];
            if (expectedPath.length && JSON.stringify(expectedPath) !== JSON.stringify(path)) {
                invalidPaths++;
                issues.push({
                    collection: 'models',
                    docId: modelId,
                    issue: 'hierarchyPath does not match parent chain',
                    severity: 'error',
                    repairSuggestion: 'Recompute hierarchyPath from the selected parent model',
                });
            }
        } else if (path.length > 0 || treeDepth !== 0) {
            invalidPaths++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: 'root model has non-empty hierarchyPath or non-zero treeDepth',
                severity: 'warning',
                repairSuggestion: 'Clear hierarchyPath and reset treeDepth to 0',
            });
        }

        const lineageKey = getLineageKey(model);
        const previousLineageDocId = lineageByKey.get(lineageKey);
        if (previousLineageDocId) {
            duplicateLineages++;
            issues.push({
                collection: 'models',
                docId: modelId,
                issue: `duplicate lineage with model "${previousLineageDocId}"`,
                severity: 'error',
                repairSuggestion: 'Rename, merge, or move one duplicate model in this lineage',
            });
        } else {
            lineageByKey.set(lineageKey, modelId);
        }
    }

    // ── Variants ────────────────────────────────────────────────────────────
    const validModelIds = new Set(allModels.map((model) => String(model._id)));
    const allVariants = await Variant.find({ isDeleted: { $ne: true } })
        .select('_id name canonicalName slug modelId')
        .lean();

    let orphanedVariants = 0;
    for (const variant of allVariants) {
        const modelId = variant.modelId ? String(variant.modelId) : null;
        if (!modelId || !validModelIds.has(modelId)) {
            orphanedVariants++;
            issues.push({
                collection: 'variants',
                docId: String(variant._id),
                issue: modelId
                    ? `modelId "${modelId}" is missing`
                    : 'modelId is null or missing',
                severity: 'error',
                repairSuggestion: 'Attach this Variant to an existing parent model or deactivate it',
            });
        }
    }

    const variantModelPairs = await Model.find({
        isDeleted: { $ne: true },
        variantOfModelId: { $ne: null },
    }).select('_id slug canonicalName variantOfModelId').lean<ModelHierarchyDoc[]>();
    const variantsByOwnerAndSlug = new Set(
        allVariants.map((variant) => [
            String((variant as { modelId?: unknown }).modelId ?? ''),
            slugifyCatalogValue(String((variant as { slug?: unknown; canonicalName?: unknown; name?: unknown }).slug ?? (variant as { canonicalName?: unknown }).canonicalName ?? (variant as { name?: unknown }).name ?? '')),
        ].join('|'))
    );
    for (const variantModel of variantModelPairs) {
        const ownerId = String(variantModel.variantOfModelId ?? '');
        const variantSlug = slugifyCatalogValue(String(variantModel.slug ?? variantModel.canonicalName ?? variantModel.name ?? ''));
        if (ownerId && variantsByOwnerAndSlug.has([ownerId, variantSlug].join('|'))) {
            issues.push({
                collection: 'models',
                docId: String(variantModel._id),
                issue: 'variant exists both as model hierarchy node and Variant collection record',
                severity: 'error',
                repairSuggestion: 'Choose the canonical Variant ownership path before adding another variant',
            });
        }
    }

    // ── Spare Parts ──────────────────────────────────────────────────────────
    const allParts = await SparePart.find({ isDeleted: { $ne: true } })
        .select('_id categoryIds')
        .lean();

    let orphanedParts = 0;
    let staleCategoryParts = 0;

    for (const part of allParts) {
        const cats: string[] = ((part as { categoryIds?: unknown[] }).categoryIds ?? []).map(String);
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
        models:     {
            total: allModels.length,
            orphaned: orphanedModels,
            cycles: cyclicModels,
            duplicateLineages,
            invalidPaths,
            maxDepth: maxModelDepth,
        },
        variants:   { total: allVariants.length, orphaned: orphanedVariants },
        spareParts: { total: allParts.length,    orphaned: orphanedParts, staleCategories: staleCategoryParts },
        screenSizes:{ total: allSizes.length,    orphaned: orphanedSizes },
        analytics: {
            totalDescendants: allModels.filter((model) => getEffectiveParentId(model)).length,
            totalVariants: allVariants.length + variantModelPairs.length,
            orphanCount: orphanedBrands + orphanedModels + orphanedVariants + orphanedParts + orphanedSizes,
            invalidLineageCount: cyclicModels + duplicateLineages + invalidPaths,
            maxModelDepth,
            depthDistribution,
        },
        issues,
    };
}

export async function getHierarchyTree(): Promise<HierarchyTreeResponse> {
    const [categories, brands, models, variants] = await Promise.all([
        Category.find({ isDeleted: { $ne: true } })
            .select('_id name slug listingType hasScreenSizes isActive')
            .sort({ name: 1 })
            .lean(),
        Brand.find({ isDeleted: { $ne: true } })
            .select('_id name categoryIds isActive approvalStatus')
            .sort({ name: 1 })
            .lean(),
        Model.find({ isDeleted: { $ne: true } })
            .select('_id name brandId categoryIds parentModelId variantOfModelId treeDepth isActive approvalStatus')
            .sort({ name: 1 })
            .lean(),
        Variant.find({ isDeleted: { $ne: true } })
            .select('_id name modelId categoryIds isActive approvalStatus')
            .sort({ name: 1 })
            .lean(),
    ]);

    const variantsByModel = new Map<string, typeof variants>();
    variants.forEach((variant) => {
        const modelId = variant.modelId ? String(variant.modelId) : '';
        if (!modelId) return;
        const existing = variantsByModel.get(modelId) ?? [];
        existing.push(variant);
        variantsByModel.set(modelId, existing);
    });

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
                    approvalStatus:
                        typeof (brand as { approvalStatus?: unknown }).approvalStatus === 'string'
                            ? ((brand as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected')
                            : undefined,
                    models: brandModels.map((model) => ({
                        id: String(model._id),
                        name: model.name,
                        isActive: Boolean(model.isActive),
                        approvalStatus:
                            typeof (model as { approvalStatus?: unknown }).approvalStatus === 'string'
                                ? ((model as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected')
                                : undefined,
                        variants: (variantsByModel.get(String(model._id)) ?? []).map((variant) => ({
                            id: String(variant._id),
                            name: variant.name,
                            isActive: Boolean(variant.isActive),
                            approvalStatus:
                                typeof (variant as { approvalStatus?: unknown }).approvalStatus === 'string'
                                    ? ((variant as { approvalStatus?: string }).approvalStatus as 'pending' | 'approved' | 'rejected')
                                    : undefined,
                        })),
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
            variants: variants.length,
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

    const emptyParts = await SparePart.find({
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
    const allActiveParts = await SparePart.find({
        isDeleted: { $ne: true },
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const pruneOps: AnyBulkWriteOperation<ISparePart>[] = [];
    for (const part of allActiveParts) {
        const cats = ((part as { categoryIds?: unknown[] }).categoryIds ?? []).map(String);
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

    if (partRepairOps.length) await SparePart.bulkWrite(partRepairOps, { ordered: false });
    if (partOrphanOps.length) await SparePart.bulkWrite(partOrphanOps, { ordered: false });
    if (pruneOps.length) await SparePart.bulkWrite(pruneOps, { ordered: false });

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

    // Brands: pending/rejected records stay inactive; only approved records can be auto-activated.
    const inactiveBrands = await Brand.find({
        isDeleted: { $ne: true },
        deletedAt: null,
        isActive: false,
        approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
        needsReview: { $ne: true },
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const activateBrandOps = buildActivateOps(
        inactiveBrands,
        (b) => ((b as { categoryIds?: unknown[] }).categoryIds ?? []).some((id: unknown) => validCatIds.has(String(id)))
    );

    if (activateBrandOps.length) await Brand.bulkWrite(activateBrandOps, { ordered: false });

    // SpareParts: inactive + valid categoryIds
    const inactiveParts = await SparePart.find({
        isDeleted: { $ne: true },
        isActive: false,
        categoryIds: { $exists: true, $not: { $size: 0 } },
    }).select('_id categoryIds').lean();

    const activatePartOps = buildActivateOps(
        inactiveParts,
        (p) => ((p as { categoryIds?: unknown[] }).categoryIds ?? []).some((id: unknown) => validCatIds.has(String(id)))
    );

    if (activatePartOps.length) await SparePart.bulkWrite(activatePartOps, { ordered: false });

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
