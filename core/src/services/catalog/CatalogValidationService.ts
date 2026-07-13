import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import {
    CATALOG_APPROVAL_STATUS,
    type CatalogApprovalStatusValue,
    CatalogValidationServiceShared,
    type CatalogValidator,
    CharacterValidator,
    LengthValidator,
    SpamValidator,
    ReservedWordValidator
} from '@esparex/shared';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { validateObjectIdOrThrow } from '../../utils/idUtils';
import {
    applyCatalogGovernanceDefaults,
    normalizeCatalogCanonicalName as normalizeCatalogCanonicalNameGoverned,
} from '../../utils/catalogGovernance';

// ─── Shared Mongo query fragments ────────────────────────────────────────────

/** Reusable filter for active, non-deleted categories */
export const ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true } as Record<string, unknown>,
    deletedAt: null,
    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
};

export const ACTIVE_BRAND_QUERY = {
    isDeleted: { $ne: true } as Record<string, unknown>,
    deletedAt: null,
    isActive: true,
    approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
};

/** Filter for publicly visible catalog records (Strict SSOT) */
export const CATALOG_PUBLIC_VISIBILITY_QUERY = {
    isDeleted: { $ne: true } as Record<string, unknown>,
    deletedAt: null,
    isActive: true,
    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
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
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryId] }).build(),
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
        isDeleted: { $ne: true },
        deletedAt: null,
        isActive: true,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
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
 * Validate that a category supports ad listings (listingType: 'ad')
 */
export async function validateAdCategoryCapability(categoryId: string): Promise<ValidationResult> {
    validateObjectIdOrThrow('categoryId', categoryId);
    const category = await Category.findOne({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        listingType: 'ad'
    }).select('_id').lean();

    if (!category) {
        return { ok: false, reason: 'This category does not support advertisements.' };
    }
    return { ok: true };
}

// ─── Service validation ──────────────────────────────────────────────────────

/**
 * Validate that a category supports service listings (listingType: 'service')
 */
export async function validateServiceCategoryCapability(categoryId: string): Promise<ValidationResult> {
    validateObjectIdOrThrow('categoryId', categoryId);
    const category = await Category.findOne({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        listingType: 'service'
    }).select('_id').lean();

    if (!category) {
        return { ok: false, reason: 'This category does not support service listings.' };
    }
    return { ok: true };
}

/**
 * 🛠️ Unified Category Capability Guard
 * Validates that a category supports the specific listing type.
 */
export async function validateListingCategoryCapability(
    categoryId: string,
    listingType: string
): Promise<ValidationResult> {
    validateObjectIdOrThrow('categoryId', categoryId);
    
    // Normalize listing type for query
    const type = listingType.toLowerCase().trim();
    
    const category = await Category.findOne({
        _id: categoryId,
        ...ACTIVE_CATEGORY_QUERY,
        listingType: type
    }).select('_id').lean();

    if (!category) {
        return { 
            ok: false, 
            reason: `This category does not support ${type} listings.` 
        };
    }
    return { ok: true };
}

export async function getCategorySelectionMode(categoryId: unknown): Promise<'single' | 'multi'> {
    const doc = await Category.findById(categoryId)
        .select('serviceSelectionMode')
        .lean<{ serviceSelectionMode?: 'single' | 'multi' } | null>();
    return doc?.serviceSelectionMode ?? 'multi';
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
        listingType: { $ne: 'spare_part' }
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
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryId] }).build(),
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
    } catch {
        return { ok: false, reason: 'categoryId is not a valid ObjectId.' };
    }
    const exists = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
    return exists
        ? { ok: true }
        : { ok: false, reason: 'categoryId refers to an invalid or inactive category.' };
}

/**
 * Normalizes a catalog name to its canonical form (lowercase, single-spaced).
 */
export function normalizeCatalogCanonicalName(name: string): string {
    return normalizeCatalogCanonicalNameGoverned(name);
}

/**
 * Applies standard catalog naming defaults (canonical name normalization).
 */
export function applyCatalogNamingDefaults(doc: { name: string; canonicalName?: string }): void {
    applyCatalogGovernanceDefaults(doc as Record<string, unknown>);
}

/**
 * Simple duplicate suggestion check based on canonical name match.
 */
export function isDuplicateSuggestion(name: string, existing: Array<{ name: string }>) {
    const normalized = normalizeCatalogCanonicalName(name);
    const match = existing.find(e => normalizeCatalogCanonicalName(e.name) === normalized);
    return {
        isDuplicate: !!match,
        confidence: match ? 1.0 : 0,
        matchedWith: match?.name
    };
}

/**
 * Derives the target approval status for a catalog record based on its current state and intent.
 */
export function deriveApprovalStatus(options: {
    approvalStatus?: unknown;
    isActive?: boolean | null;
    fallback?: CatalogApprovalStatusValue;
}): CatalogApprovalStatusValue {
    const { approvalStatus, isActive, fallback = CATALOG_APPROVAL_STATUS.APPROVED } = options;

    if (approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED || approvalStatus === CATALOG_APPROVAL_STATUS.REJECTED) {
        return approvalStatus as CatalogApprovalStatusValue;
    }

    if (approvalStatus === CATALOG_APPROVAL_STATUS.PENDING && isActive === true) {
        return CATALOG_APPROVAL_STATUS.APPROVED;
    }

    return ((approvalStatus as string) || fallback) as CatalogApprovalStatusValue;
}

/* ─── Configurable Naming Validators (SSOT via @esparex/shared) ─── */

export {
    type CatalogValidator,
    CharacterValidator,
    LengthValidator,
    SpamValidator,
    ReservedWordValidator,
};

export class CatalogValidationService {
    public static validateCatalogInput(options: {
        name: string;
        requestType: 'brand' | 'model';
    }): { ok: boolean; reason?: string } {
        return CatalogValidationServiceShared.validateCatalogInput(options);
    }
}
