import mongoose from 'mongoose';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { validateObjectIdOrThrow } from '../../utils/idUtils';

// ─── Shared Mongo query fragments ────────────────────────────────────────────

/** Reusable filter for active, non-deleted categories */
export const ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true } as Record<string, unknown>,
    status: CATALOG_STATUS.ACTIVE,
};

/** Reusable filter for active, non-deleted brands */
export const ACTIVE_BRAND_QUERY = {
    isActive: true,
    isDeleted: { $ne: true } as Record<string, unknown>,
    $or: [
        { status: CATALOG_STATUS.ACTIVE },
        { status: { $exists: false } },
    ] as Record<string, unknown>[],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
    ok: boolean;
    reason?: string;
}

export interface CategoryValidationResult {
    ok: boolean;
    invalidCategoryIds: string[];
}

// ─── Category helpers ─────────────────────────────────────────────────────────

/**
 * Return the ObjectId strings of all currently active categories.
 * If requestedCategoryIds is provided, only validates those IDs.
 */
export async function getActiveCategoryIds(requestedCategoryIds?: string[]): Promise<string[]> {
    const filter: Record<string, unknown> = { ...ACTIVE_CATEGORY_QUERY };
    if (requestedCategoryIds && requestedCategoryIds.length > 0) {
        filter._id = { $in: requestedCategoryIds };
    }
    const categories = await Category.find(filter).select('_id').lean();
    return categories.map((c) => String(c._id));
}

/**
 * Validate that all supplied category IDs are active and non-deleted.
 */
export async function validateActiveCategories(categoryIds: string[]): Promise<CategoryValidationResult> {
    const unique = Array.from(new Set(categoryIds));
    const activeIds = await getActiveCategoryIds(unique);
    const activeSet = new Set(activeIds);
    const invalidCategoryIds = unique.filter((id) => !activeSet.has(id));
    return { ok: invalidCategoryIds.length === 0, invalidCategoryIds };
}

// ─── Brand validation ─────────────────────────────────────────────────────────

/**
 * Validate that a brand exists, is active, and belongs to the given category.
 */
export async function validateBrandBelongsToCategory(
    brandId: string,
    categoryId: string,
): Promise<ValidationResult> {
    validateObjectIdOrThrow('brandId', brandId);
    validateObjectIdOrThrow('categoryId', categoryId);

    const brand = await Brand.findOne({
        _id: brandId,
        ...ACTIVE_BRAND_QUERY,
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryId }).build(),
    }).select('_id').lean();

    if (!brand) {
        return { ok: false, reason: 'Brand is invalid, inactive, or does not belong to the specified category.' };
    }
    return { ok: true };
}

/**
 * Validate that a brand exists and is active (no category constraint).
 */
export async function validateBrandIsActive(brandId: string): Promise<ValidationResult> {
    validateObjectIdOrThrow('brandId', brandId);
    const brand = await Brand.exists({ _id: brandId, ...ACTIVE_BRAND_QUERY });
    if (!brand) {
        return { ok: false, reason: 'brandId refers to an invalid or inactive brand.' };
    }
    return { ok: true };
}

// ─── Model validation ─────────────────────────────────────────────────────────

/**
 * Validate that a model exists, is active, and (optionally) belongs to a given brand.
 */
export async function validateModelBelongsToBrand(
    modelId: string,
    brandId?: string,
): Promise<ValidationResult> {
    validateObjectIdOrThrow('modelId', modelId);
    if (brandId) validateObjectIdOrThrow('brandId', brandId);

    const model = await Model.findOne({
        _id: modelId,
        isActive: true,
        isDeleted: { $ne: true },
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } },
        ],
    }).select('brandId').lean();

    if (!model) {
        return { ok: false, reason: 'modelId refers to an invalid or inactive model.' };
    }

    if (brandId && String((model as { brandId?: unknown }).brandId) !== brandId) {
        return { ok: false, reason: 'modelId does not belong to the specified brandId.' };
    }

    return { ok: true };
}

// ─── Ad validation ───────────────────────────────────────────────────────────

/**
 * Validate that a category supports Ads (listingType: 'postad')
 */
export async function validateAdCategoryCapability(categoryId: string): Promise<ValidationResult> {
    validateObjectIdOrThrow('categoryId', categoryId);
    const category = await Category.findOne({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        listingType: 'postad'
    }).select('_id').lean();

    if (!category) {
        return { ok: false, reason: 'This category does not support advertisements.' };
    }
    return { ok: true };
}

// ─── Service validation ──────────────────────────────────────────────────────

/**
 * Validate that a category supports Services (listingType: 'postservice')
 */
export async function validateServiceCategoryCapability(categoryId: string): Promise<ValidationResult> {
    validateObjectIdOrThrow('categoryId', categoryId);
    const category = await Category.findOne({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        listingType: 'postservice'
    }).select('_id').lean();

    if (!category) {
        return { ok: false, reason: 'This category does not support service listings.' };
    }
    return { ok: true };
}

// ─── SparePart validation ─────────────────────────────────────────────────────

export interface SparePartRelationPayload {
    categoryIds: string[];
    brandId?: string;
    modelId?: string;
}

/**
 * Validate the full Category → Brand → Model hierarchy for a spare part.
 * Consolidates all the duplicated validation logic previously scattered across
 * the spare parts controller.
 */
export async function validateSparePartRelations(
    payload: SparePartRelationPayload,
): Promise<ValidationResult> {
    const { categoryIds, brandId, modelId } = payload;

    if (!categoryIds || categoryIds.length === 0) {
        return { ok: false, reason: 'At least one category is required.' };
    }

    // Harden inputs: Category IDs must be valid hex strings
    try {
        categoryIds.forEach(id => validateObjectIdOrThrow('categoryIds', id));
        if (brandId) validateObjectIdOrThrow('brandId', brandId);
        if (modelId) validateObjectIdOrThrow('modelId', modelId);
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
    }

    // 1. Category capability guard: categories must explicitly support spare parts
    const invalidCategories = await Category.find({
        _id: { $in: categoryIds },
        listingType: { $ne: 'postsparepart' }
    }).select('_id').lean();

    if (invalidCategories.length > 0) {
        return { ok: false, reason: 'One or more categories do not support spare parts.' };
    }

    // 2. All category IDs must be active
    const { ok: categoriesOk, invalidCategoryIds } = await validateActiveCategories(categoryIds);
    if (!categoriesOk) {
        return { ok: false, reason: `Invalid or inactive categories: ${invalidCategoryIds.join(', ')}` };
    }

    // 3. Brand must be active and belong to one of the given categories
    if (brandId) {
        const brand = await Brand.exists({
            _id: brandId,
            ...ACTIVE_BRAND_QUERY,
            ...CategoryQueryBuilder.forPlural().withFilters({ categoryIds }).build(),
        });
        if (!brand) {
            return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the given categories.' };
        }
    }

    // 4. Model must be active and belong to the given brand (if both are present)
    if (modelId) {
        const modelResult = await validateModelBelongsToBrand(modelId, brandId);
        if (!modelResult.ok) return modelResult;
    }

    return { ok: true };
}

// ─── ScreenSize validation ────────────────────────────────────────────────────

export interface ScreenSizeRelationPayload {
    categoryId: string;
    brandId?: string;
}

/**
 * Validate the Category → Brand hierarchy for a screen size entry.
 */
export async function validateScreenSizeRelations(
    payload: ScreenSizeRelationPayload,
): Promise<ValidationResult> {
    const { categoryId, brandId } = payload;

    // Harden inputs
    try {
        validateObjectIdOrThrow('categoryId', categoryId);
        if (brandId) validateObjectIdOrThrow('brandId', brandId);
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
    }

    // Category must be active and support screen sizes
    const categoryExists = await Category.exists({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        hasScreenSizes: true
    });
    if (!categoryExists) {
        return { ok: false, reason: 'categoryId refers to an invalid or inactive category, or one that does not support screen sizes.' };
    }

    if (!brandId) return { ok: true };

    // Brand must be active AND belong to this category
    const brand = await Brand.findOne({
        _id: brandId,
        ...ACTIVE_BRAND_QUERY,
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryId }).build(),
    }).select('_id').lean();

    if (!brand) {
        return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the specified category.' };
    }

    return { ok: true };
}

// ─── Brand–Category relation (for admin brand create/update) ─────────────────

/**
 * Validate that a category exists and is active (used when creating/updating a brand).
 */
export async function validateCategoryIsActive(categoryId: string): Promise<ValidationResult> {
    try {
        validateObjectIdOrThrow('categoryId', categoryId);
    } catch (error) {
        return { ok: false, reason: 'categoryId is not a valid ObjectId.' };
    }
    const exists = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
    return exists
        ? { ok: true }
        : { ok: false, reason: 'categoryId refers to an invalid or inactive category.' };
}
