import { CatalogApprovalStatusValue } from '@esparex/contracts';

export interface ScreenSize {
    readonly id: string;
    readonly size: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly value: number;
    readonly categoryId: string;
    readonly brandId?: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface ScreenSizeBulkDeleteCriteria {
    categoryId: string;
    brandIds?: readonly string[];
}

export interface ScreenSizeRepositoryPort {
    // Bulk
    softDeleteByCriteria(criteria: ScreenSizeBulkDeleteCriteria, tx?: unknown): Promise<number>;
}
