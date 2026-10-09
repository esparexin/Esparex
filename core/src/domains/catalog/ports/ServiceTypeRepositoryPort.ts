import { CatalogApprovalStatusValue } from '@esparex/contracts';

export interface ServiceType {
    readonly id: string;
    readonly _id?: string;
    readonly name: string;
    readonly canonicalName: string;
    readonly slug: string;
    readonly isActive: boolean;
    readonly isDeleted: boolean;
    readonly categoryIds: readonly string[];
    readonly approvalStatus: CatalogApprovalStatusValue;
}

export interface ServiceTypeRepositoryPort {
    findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<ServiceType | null>;
    exists(id: string, tx?: unknown): Promise<boolean>;
    create(data: Partial<ServiceType> | Record<string, unknown>, tx?: unknown): Promise<ServiceType>;
    update(id: string, data: Partial<ServiceType> | Record<string, unknown>, tx?: unknown): Promise<ServiceType | null>;
    softDelete(id: string, tx?: unknown): Promise<boolean>;
}
