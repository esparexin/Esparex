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
    findById(id: string): Promise<SparePart | null>;
    exists(id: string): Promise<boolean>;
}
