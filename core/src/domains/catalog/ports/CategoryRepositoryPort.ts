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
    readonly name: string;
    readonly displayName: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly configuration: CategoryConfiguration;
}

export interface CategoryRepositoryPort {
    findById(id: string): Promise<Category | null>;
    findBySlug(slug: string): Promise<Category | null>;
    exists(id: string): Promise<boolean>;
    resolveActiveCategoryIds(categoryIds?: readonly CategoryId[]): Promise<readonly CategoryId[]>;
}
