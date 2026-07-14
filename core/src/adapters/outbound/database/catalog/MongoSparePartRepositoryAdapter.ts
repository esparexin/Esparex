import { SparePart, SparePartRepositoryPort } from '../../../../domains/catalog';
import SparePartMongoose from '../../../../models/SparePart';
import { CatalogApprovalStatusValue } from '@esparex/shared';

interface DbSparePart {
    _id: unknown;
    name: string;
    canonicalName: string;
    slug: string;
    isActive: boolean;
    isDeleted: boolean;
    categoryIds: unknown[];
    brandId?: unknown;
    modelId?: unknown;
    approvalStatus: string;
}

export class MongoSparePartRepositoryAdapter implements SparePartRepositoryPort {
    private toDomain(doc: DbSparePart): SparePart {
        return {
            id: String(doc._id),
            name: doc.name,
            canonicalName: doc.canonicalName,
            slug: doc.slug,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            categoryIds: doc.categoryIds ? doc.categoryIds.map(id => String(id)) : [],
            brandId: doc.brandId ? String(doc.brandId) : undefined,
            modelId: doc.modelId ? String(doc.modelId) : undefined,
            approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
        };
    }

    async findById(id: string): Promise<SparePart | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const doc = await SparePartMongoose.findById(safeId).lean<DbSparePart | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string): Promise<boolean> {
        const doc = await SparePartMongoose.findById(id).select('_id').lean().exec();
        return doc !== null;
    }
}
