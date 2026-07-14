import { CatalogApprovalStatusValue } from '@esparex/shared';

export interface SparePart {
    readonly id: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly categoryIds: readonly string[];
    readonly brandId?: string;
    readonly modelId?: string;
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface SparePartRepositoryPort {
    // Query
    findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<SparePart | null>;
    exists(id: string, tx?: unknown): Promise<boolean>;
    findByCategoryOrBrands(categoryId: string, brandIds: string[], tx?: unknown): Promise<SparePart[]>;

    // Mutation
    create(data: Partial<SparePart>, tx?: unknown): Promise<SparePart>;
    update(id: string, data: Partial<SparePart>, tx?: unknown): Promise<SparePart | null>;
    softDelete(id: string, tx?: unknown): Promise<boolean>;

    // Bulk
    softDeleteMany(sparePartIds: string[], tx?: unknown): Promise<number>;
    softDeleteByBrandId(brandId: string, tx?: unknown): Promise<number>;
    softDeleteByModelIds(modelIds: string[], tx?: unknown): Promise<number>;

    // Relationship
    updateCategoryIds(sparePartId: string, categoryIds: string[], tx?: unknown): Promise<boolean>;
    clearModelReferences(modelId: string, tx?: unknown): Promise<number>;
}
