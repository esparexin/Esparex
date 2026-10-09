import { CatalogApprovalStatusValue } from '@esparex/contracts';

export interface Brand {
    readonly id: string;
    readonly _id?: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly categoryIds: readonly string[];
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface BrandRepositoryPort {
    findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<Brand | null>;
    findByNameAndCategory(name: string, categoryId: string, tx?: unknown): Promise<Brand | null>;
    findByCategory(categoryId: string, tx?: unknown): Promise<Brand[]>;
    exists(id: string, tx?: unknown): Promise<boolean>;
    create(data: Partial<Brand> | Record<string, unknown>, tx?: unknown): Promise<Brand>;
    update(id: string, data: Partial<Brand> | Record<string, unknown>, tx?: unknown): Promise<Brand | null>;
    updateCategoryIds(brandId: string, categoryIds: string[], tx?: unknown): Promise<boolean>;
    softDelete(brandId: string, tx?: unknown): Promise<boolean>;
    softDeleteMany(brandIds: string[], tx?: unknown): Promise<number>;
}
