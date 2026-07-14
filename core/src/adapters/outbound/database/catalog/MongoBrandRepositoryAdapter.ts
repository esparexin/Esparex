import { Brand, BrandRepositoryPort } from '../../../../domains/catalog';
import BrandModel from '../../../../models/Brand';
import { CatalogApprovalStatusValue } from '@esparex/shared';

interface DbBrand {
    _id: unknown;
    name: string;
    canonicalName: string;
    isActive: boolean;
    isDeleted: boolean;
    categoryIds: unknown[];
    approvalStatus: string;
}

export class MongoBrandRepositoryAdapter implements BrandRepositoryPort {
    private toDomain(doc: DbBrand): Brand {
        return {
            id: String(doc._id),
            name: doc.name,
            canonicalName: doc.canonicalName,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            categoryIds: (doc.categoryIds ?? []).map(id => String(id)),
            approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
        };
    }

    async findById(id: string): Promise<Brand | null> {
        const doc = await BrandModel.findById(id).lean<DbBrand | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByNameAndCategory(name: string, categoryId: string): Promise<Brand | null> {
        const canonicalName = name.trim().toLowerCase().replace(/\s+/g, ' ');
        const doc = await BrandModel.findOne({
            canonicalName,
            categoryIds: categoryId
        }).lean<DbBrand | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string): Promise<boolean> {
        const doc = await BrandModel.findById(id).select('_id').lean().exec();
        return doc !== null;
    }
}
