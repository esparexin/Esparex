import {
    CatalogApprovalStatusValue,
    ListingTypeValue,
    ServiceSelectionMode
} from '@esparex/shared';

// Currently an alias.
// Can later become a branded type or value object.
export type CategoryId = string;

export interface CategoryConfiguration {
    readonly listingTypes: readonly ListingTypeValue[];
    readonly serviceSelectionMode: ServiceSelectionMode;
    readonly approvalStatus: CatalogApprovalStatusValue;
    readonly hasScreenSizes: boolean;
}

export interface Category {
    readonly id: CategoryId;
    readonly _id?: string;
    readonly name: string;
    readonly displayName: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly configuration: CategoryConfiguration;
    readonly filters?: readonly unknown[];
}

export interface CategoryRepositoryPort {
    findById(id: string, tx?: unknown): Promise<Category | null>;
    findBySlug(slug: string, tx?: unknown): Promise<Category | null>;
    exists(id: string, tx?: unknown): Promise<boolean>;
    resolveActiveCategoryIds(categoryIds?: readonly CategoryId[], tx?: unknown): Promise<readonly CategoryId[]>;
    create(data: Partial<Category> | any, tx?: unknown): Promise<Category>;
    update(id: string, data: Partial<Category> | any, tx?: unknown): Promise<Category | null>;
    softDelete(id: string, tx?: unknown): Promise<boolean>;
    findActive(tx?: unknown): Promise<Category[]>;
}
