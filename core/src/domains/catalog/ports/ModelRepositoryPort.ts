import { CatalogApprovalStatusValue } from '@esparex/contracts';

export interface Model {
    readonly id: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly brandId: string;
    readonly categoryIds: readonly string[];
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface ModelRepositoryPort {
    // Query methods
    findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<Model | null>;
    exists(id: string, tx?: unknown): Promise<boolean>;
    findByCategoryOrBrands(categoryId: string, brandIds: string[], tx?: unknown): Promise<Model[]>;
    findByBrandId(brandId: string, tx?: unknown): Promise<Model[]>;

    // Mutation methods
    create(data: Partial<Model>, tx?: unknown): Promise<Model>;
    update(id: string, data: Partial<Model>, tx?: unknown): Promise<Model | null>;
    softDelete(id: string, tx?: unknown): Promise<boolean>;

    // Bulk methods
    softDeleteMany(modelIds: string[], tx?: unknown): Promise<number>;
    softDeleteByBrandId(brandId: string, tx?: unknown): Promise<number>;

    // Relationship methods
    updateCategoryIds(modelId: string, categoryIds: string[], tx?: unknown): Promise<boolean>;
}
