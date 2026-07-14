import { CatalogApprovalStatusValue } from '@esparex/shared';

export interface Brand {
    readonly id: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly categoryIds: readonly string[];
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface BrandRepositoryPort {
    findById(id: string): Promise<Brand | null>;
    findByNameAndCategory(name: string, categoryId: string): Promise<Brand | null>;
    exists(id: string): Promise<boolean>;
}
