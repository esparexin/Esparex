import { CatalogApprovalStatusValue } from '@esparex/shared';

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
    findById(id: string): Promise<Model | null>;
    exists(id: string): Promise<boolean>;
}
