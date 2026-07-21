import mongoose from 'mongoose';
import Model from '../../../../models/Model';
import Variant from '../../../../models/Variant';
import { normalizeCatalogCanonicalName, slugifyCatalogValue } from '../../../../utils/catalogGovernance';
import type { ModelHierarchyDoc, ModelHierarchyMutationPayload } from './types';
import { MAX_MODEL_TREE_DEPTH } from './constants';

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
    options: { existingModel?: ModelHierarchyDoc | null; modelId?: string | null; session?: mongoose.ClientSession | null } = {}
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
        if (!parent) throw new Error('Parent model must reference an existing model');
        if (nextBrandId && normalizeId(parent.brandId) !== nextBrandId) throw new Error('Parent model must belong to the selected brand');

        const parentPath = Array.isArray(parent.hierarchyPath) ? parent.hierarchyPath.map(String) : [];
        if (currentId && parentPath.includes(currentId)) throw new Error('Circular model hierarchy is not allowed');
        const nextDepth = Number(parent.treeDepth ?? parentPath.length) + 1;
        if (nextDepth > MAX_MODEL_TREE_DEPTH) throw new Error(`Model hierarchy depth cannot exceed ${MAX_MODEL_TREE_DEPTH}`);

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
        _id: currentId, name: typeof mutable.name === 'string' ? mutable.name : existing?.name,
        displayName: typeof mutable.displayName === 'string' ? mutable.displayName : existing?.displayName,
        canonicalName: typeof mutable.canonicalName === 'string' ? mutable.canonicalName : existing?.canonicalName,
        slug: typeof mutable.slug === 'string' ? mutable.slug : existing?.slug,
        brandId: nextBrandId, parentModelId: mutable.parentModelId, variantOfModelId: mutable.variantOfModelId,
    };
    const lineageKeyParts = getLineageKey(lineageCandidate).split('|');
    const normalizedSlug = lineageKeyParts[lineageKeyParts.length - 1];
    const siblingQuery: Record<string, unknown> = {
        brandId: nextBrandId, isDeleted: { $ne: true },
        $or: [{ slug: normalizedSlug }, { canonicalName: normalizeCatalogCanonicalName(String(lineageCandidate.canonicalName ?? lineageCandidate.displayName ?? lineageCandidate.name ?? '')) }],
    };
    if (currentId) siblingQuery._id = { $ne: currentId };
    if (hierarchyParentId) {
        siblingQuery.$and = [{ $or: [{ parentModelId: hierarchyParentId }, { variantOfModelId: hierarchyParentId }] }];
    } else {
        siblingQuery.parentModelId = { $in: [null] };
        siblingQuery.variantOfModelId = { $in: [null] };
    }
    const duplicateModel = await Model.exists(siblingQuery).session(options.session ?? null);
    if (duplicateModel) throw new Error('Duplicate model lineage is not allowed for the same brand and parent');

    if (variantOfModelId) {
        const conflictingVariant = await Variant.exists({
            modelId: variantOfModelId, isDeleted: { $ne: true },
            $or: [{ slug: normalizedSlug }, { canonicalName: normalizeCatalogCanonicalName(String(lineageCandidate.canonicalName ?? lineageCandidate.displayName ?? lineageCandidate.name ?? '')) }],
        }).session(options.session ?? null);
        if (conflictingVariant) throw new Error('Variant already exists in the canonical Variant collection for this parent model');
    }

    return mutable;
}

export { normalizeId, getEffectiveParentId, modelSelect, getLineageKey };
