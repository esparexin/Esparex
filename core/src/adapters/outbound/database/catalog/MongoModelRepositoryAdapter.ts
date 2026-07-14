import { Model, ModelRepositoryPort } from '../../../../domains/catalog/ports/ModelRepositoryPort';
import ModelMongoose from '../../../../models/Model';
import { CatalogApprovalStatusValue } from '@esparex/shared';

interface DbModel {
    _id: unknown;
    name: string;
    canonicalName: string;
    slug: string;
    isActive: boolean;
    isDeleted: boolean;
    brandId: unknown;
    categoryIds: unknown[];
    approvalStatus: string;
}

export class MongoModelRepositoryAdapter implements ModelRepositoryPort {
    private toDomain(doc: DbModel): Model {
        return {
            id: String(doc._id),
            name: doc.name,
            canonicalName: doc.canonicalName,
            slug: doc.slug,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            brandId: String(doc.brandId),
            categoryIds: doc.categoryIds ? doc.categoryIds.map(id => String(id)) : [],
            approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
        };
    }

    async findById(id: string): Promise<Model | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const doc = await ModelMongoose.findById(safeId).lean<DbModel | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string): Promise<boolean> {
        const doc = await ModelMongoose.findById(id).select('_id').lean().exec();
        return doc !== null;
    }
}
