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
import { validateObjectIdOrThrow } from '../../utils/idUtils';
import {
    applyCatalogGovernanceDefaults,
    normalizeCatalogCanonicalName as normalizeCatalogCanonicalNameGoverned,
} from '../../utils/catalogGovernance';

import {
    CategoryRepositoryPort,
    BrandRepositoryPort,
    CategoryId,
    ListingTypeValue
} from '../../domains/catalog';

// ─── Shared Mongo query fragments (Retained for backwards compatibility if needed elsewhere) ─

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

export class CatalogValidationService {
    constructor(
        private readonly categoryRepository: CategoryRepositoryPort,
        private readonly brandRepository: BrandRepositoryPort
    ) {}

    public static validateCatalogInput(options: {
        name: string;
        requestType: 'brand' | 'model';
    }): { ok: boolean; reason?: string } {
        return CatalogValidationServiceShared.validateCatalogInput(options);
    }

    async getActiveCategoryIds(requestedCategoryIds?: string[]): Promise<string[]> {
        const activeIds = await this.categoryRepository.resolveActiveCategoryIds(requestedCategoryIds);
        return [...activeIds];
    }

    async validateActiveCategories(categoryIds: string[]): Promise<CategoryValidationResult> {
        const unique = Array.from(new Set(categoryIds));
        const activeIds = await this.categoryRepository.resolveActiveCategoryIds(unique);
        const activeSet = new Set(activeIds);
        const invalidCategoryIds = unique.filter((id) => !activeSet.has(id));
        return { ok: invalidCategoryIds.length === 0, invalidCategoryIds };
    }

    async validateBrandBelongsToCategory(
        brandId: string,
        categoryId: string,
    ): Promise<ValidationResult> {
        validateObjectIdOrThrow('brandId', brandId);
        validateObjectIdOrThrow('categoryId', categoryId);

        const brand = await this.brandRepository.findById(brandId);
        const isBrandActive = brand && brand.isActive && !brand.isDeleted &&
            (brand.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED || brand.approvalStatus === CATALOG_APPROVAL_STATUS.PENDING);

        if (!isBrandActive || !brand.categoryIds.includes(categoryId)) {
            return { ok: false, reason: 'Brand is invalid, inactive, or does not belong to the specified category.' };
        }
        return { ok: true };
    }

    async validateBrandIsActive(brandId: string): Promise<ValidationResult> {
        validateObjectIdOrThrow('brandId', brandId);
        const brand = await this.brandRepository.findById(brandId);
        const isBrandActive = brand && brand.isActive && !brand.isDeleted &&
            (brand.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED || brand.approvalStatus === CATALOG_APPROVAL_STATUS.PENDING);
        if (!isBrandActive) {
            return { ok: false, reason: 'brandId refers to an invalid or inactive brand.' };
        }
        return { ok: true };
    }

    async validateCategoryIsActive(categoryId: string): Promise<ValidationResult> {
        try {
            validateObjectIdOrThrow('categoryId', categoryId);
        } catch {
            return { ok: false, reason: 'categoryId is not a valid ObjectId.' };
        }
        const category = await this.categoryRepository.findById(categoryId);
        const isCategoryActive = category && category.isActive && !category.isDeleted &&
            category.configuration.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED;
        return isCategoryActive
            ? { ok: true }
            : { ok: false, reason: 'categoryId refers to an invalid or inactive category.' };
    }

    async validateModelBelongsToBrand(
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

    async validateAdCategoryCapability(categoryId: string): Promise<ValidationResult> {
        validateObjectIdOrThrow('categoryId', categoryId);
        const category = await this.categoryRepository.findById(categoryId);
        const isCategoryActive = category && category.isActive && !category.isDeleted &&
            category.configuration.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED;
        if (!isCategoryActive || !category.configuration.listingTypes.includes('ad')) {
            return { ok: false, reason: 'This category does not support advertisements.' };
        }
        return { ok: true };
    }

    async validateServiceCategoryCapability(categoryId: string): Promise<ValidationResult> {
        validateObjectIdOrThrow('categoryId', categoryId);
        const category = await this.categoryRepository.findById(categoryId);
        const isCategoryActive = category && category.isActive && !category.isDeleted &&
            category.configuration.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED;
        if (!isCategoryActive || !category.configuration.listingTypes.includes('service')) {
            return { ok: false, reason: 'This category does not support service listings.' };
        }
        return { ok: true };
    }

    async validateListingCategoryCapability(
        categoryId: string,
        listingType: string
    ): Promise<ValidationResult> {
        validateObjectIdOrThrow('categoryId', categoryId);
        const type = listingType.toLowerCase().trim() as ListingTypeValue;
        
        const category = await this.categoryRepository.findById(categoryId);
        const isCategoryActive = category && category.isActive && !category.isDeleted &&
            category.configuration.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED;

        if (!isCategoryActive || !category.configuration.listingTypes.includes(type)) {
            return { 
                ok: false, 
                reason: `This category does not support ${type} listings.` 
            };
        }
        return { ok: true };
    }

    async getCategorySelectionMode(categoryId: unknown): Promise<'single' | 'multi'> {
        if (typeof categoryId !== 'string') {
            return 'multi';
        }
        const category = await this.categoryRepository.findById(categoryId);
        return category?.configuration.serviceSelectionMode ?? 'multi';
    }

    async validateSparePartRelations(
        payload: SparePartRelationPayload,
    ): Promise<ValidationResult> {
        const { categoryIds, brandId, modelId } = payload;

        if (!categoryIds || categoryIds.length === 0) {
            return { ok: false, reason: 'At least one category is required.' };
        }

        try {
            categoryIds.forEach(id => validateObjectIdOrThrow('categoryIds', id));
            if (brandId) validateObjectIdOrThrow('brandId', brandId);
            if (modelId) validateObjectIdOrThrow('modelId', modelId);
        } catch (error) {
            return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
        }

        for (const id of categoryIds) {
            const category = await this.categoryRepository.findById(id);
            if (!category || !category.configuration.listingTypes.includes('spare_part')) {
                return { ok: false, reason: 'One or more categories do not support spare parts.' };
            }
        }

        const { ok: categoriesOk, invalidCategoryIds } = await this.validateActiveCategories(categoryIds);
        if (!categoriesOk) {
            return { ok: false, reason: `Invalid or inactive categories: ${invalidCategoryIds.join(', ')}` };
        }

        if (brandId) {
            const brand = await this.brandRepository.findById(brandId);
            const isBrandActive = brand && brand.isActive && !brand.isDeleted &&
                (brand.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED || brand.approvalStatus === CATALOG_APPROVAL_STATUS.PENDING);
            const belongsToCategory = brand && brand.categoryIds.some(catId => categoryIds.includes(catId));
            if (!isBrandActive || !belongsToCategory) {
                return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the given categories.' };
            }
        }

        if (modelId) {
            const modelResult = await this.validateModelBelongsToBrand(modelId, brandId);
            if (!modelResult.ok) return modelResult;
        }

        return { ok: true };
    }

    async validateScreenSizeRelations(
        payload: ScreenSizeRelationPayload,
    ): Promise<ValidationResult> {
        const { categoryId, brandId } = payload;

        try {
            validateObjectIdOrThrow('categoryId', categoryId);
            if (brandId) validateObjectIdOrThrow('brandId', brandId);
        } catch (error) {
            return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
        }

        const category = await this.categoryRepository.findById(categoryId);
        const isCategoryActive = category && category.isActive && !category.isDeleted &&
            category.configuration.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED;

        if (!isCategoryActive || !category.configuration.hasScreenSizes) {
            return { ok: false, reason: 'categoryId refers to an invalid or inactive category, or one that does not support screen sizes.' };
        }

        if (!brandId) return { ok: true };

        const brand = await this.brandRepository.findById(brandId);
        const isBrandActive = brand && brand.isActive && !brand.isDeleted &&
            (brand.approvalStatus === CATALOG_APPROVAL_STATUS.APPROVED || brand.approvalStatus === CATALOG_APPROVAL_STATUS.PENDING);

        if (!isBrandActive || !brand.categoryIds.includes(categoryId)) {
            return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the specified category.' };
        }

        return { ok: true };
    }
}

// ─── Legacy Backward-Compatibility Singleton & Delegates ─────────────────────

let serviceInstance: CatalogValidationService | null = null;

export function initializeCatalogValidationService(instance: CatalogValidationService) {
    serviceInstance = instance;
}

function getServiceInstance(): CatalogValidationService {
    if (!serviceInstance) {
        // Fallback lazy initialization using dynamic import/require
        // to avoid circular dependencies and static concrete imports in tests
        const { MongoCategoryRepository } = require('../../adapters/outbound/database/catalog/MongoCategoryRepository');
        const { MongoBrandRepository } = require('../../adapters/outbound/database/catalog/MongoBrandRepository');
        serviceInstance = new CatalogValidationService(
            new MongoCategoryRepository(),
            new MongoBrandRepository()
        );
    }
    return serviceInstance;
}

export async function getActiveCategoryIds(requestedCategoryIds?: string[]): Promise<string[]> {
    return getServiceInstance().getActiveCategoryIds(requestedCategoryIds);
}

export async function validateActiveCategories(categoryIds: string[]): Promise<CategoryValidationResult> {
    return getServiceInstance().validateActiveCategories(categoryIds);
}

export async function validateBrandBelongsToCategory(brandId: string, categoryId: string): Promise<ValidationResult> {
    return getServiceInstance().validateBrandBelongsToCategory(brandId, categoryId);
}

export async function validateBrandIsActive(brandId: string): Promise<ValidationResult> {
    return getServiceInstance().validateBrandIsActive(brandId);
}

export async function validateCategoryIsActive(categoryId: string): Promise<ValidationResult> {
    return getServiceInstance().validateCategoryIsActive(categoryId);
}

export async function validateModelBelongsToBrand(modelId: string, brandId?: string): Promise<ValidationResult> {
    return getServiceInstance().validateModelBelongsToBrand(modelId, brandId);
}

export async function validateAdCategoryCapability(categoryId: string): Promise<ValidationResult> {
    return getServiceInstance().validateAdCategoryCapability(categoryId);
}

export async function validateServiceCategoryCapability(categoryId: string): Promise<ValidationResult> {
    return getServiceInstance().validateServiceCategoryCapability(categoryId);
}

export async function validateListingCategoryCapability(categoryId: string, listingType: string): Promise<ValidationResult> {
    return getServiceInstance().validateListingCategoryCapability(categoryId, listingType);
}

export async function getCategorySelectionMode(categoryId: unknown): Promise<'single' | 'multi'> {
    return getServiceInstance().getCategorySelectionMode(categoryId);
}

export interface SparePartRelationPayload {
    categoryIds: string[];
    brandId?: string;
    modelId?: string;
}

export async function validateSparePartRelations(payload: SparePartRelationPayload): Promise<ValidationResult> {
    return getServiceInstance().validateSparePartRelations(payload);
}

export interface ScreenSizeRelationPayload {
    categoryId: string;
    brandId?: string;
}

export async function validateScreenSizeRelations(payload: ScreenSizeRelationPayload): Promise<ValidationResult> {
    return getServiceInstance().validateScreenSizeRelations(payload);
}

export function normalizeCatalogCanonicalName(name: string): string {
    return normalizeCatalogCanonicalNameGoverned(name);
}

export function applyCatalogNamingDefaults(doc: { name: string; canonicalName?: string }): void {
    applyCatalogGovernanceDefaults(doc as Record<string, unknown>);
}

export function isDuplicateSuggestion(name: string, existing: Array<{ name: string }>) {
    const normalized = normalizeCatalogCanonicalName(name);
    const match = existing.find(e => normalizeCatalogCanonicalName(e.name) === normalized);
    return {
        isDuplicate: !!match,
        confidence: match ? 1.0 : 0,
        matchedWith: match?.name
    };
}

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

export {
    type CatalogValidator,
    CharacterValidator,
    LengthValidator,
    SpamValidator,
    ReservedWordValidator,
};
