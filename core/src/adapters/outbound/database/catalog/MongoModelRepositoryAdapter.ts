import { Model, ModelRepositoryPort } from '../../../../domains/catalog';
import ModelMongoose from '../../../../models/Model';
import { CatalogApprovalStatusValue } from '@esparex/contracts';

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

    async findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<Model | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = ModelMongoose.findById(safeId).lean<DbModel | null>();
        if (includeDeleted) query.setOptions({ withDeleted: true });
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string, tx?: unknown): Promise<boolean> {
        const query = ModelMongoose.findById(id).select('_id').lean();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc !== null;
    }

    async findByCategoryOrBrands(categoryId: string, brandIds: string[], tx?: unknown): Promise<Model[]> {
        const modelOrFilters: Array<Record<string, unknown>> = [{ categoryIds: categoryId }];
        if (brandIds.length > 0) {
            modelOrFilters.push({ brandId: { $in: brandIds } });
        }
        const query = ModelMongoose.find({ $or: modelOrFilters }).lean<DbModel[]>();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async findByBrandId(brandId: string, tx?: unknown): Promise<Model[]> {
        const query = ModelMongoose.find({ brandId }).lean<DbModel[]>();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async create(data: Partial<Model> | any, tx?: unknown): Promise<Model> {
        const docs = await ModelMongoose.create([data], { session: tx as any });
        return this.toDomain(docs[0] as unknown as DbModel);
    }

    async update(id: string, data: Partial<Model> | any, tx?: unknown): Promise<Model | null> {
        const query = ModelMongoose.findByIdAndUpdate(id, data, { new: true }).lean<DbModel | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async softDelete(id: string, tx?: unknown): Promise<boolean> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = ModelMongoose.findByIdAndUpdate(id, update, { new: true });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return !!res;
    }

    async softDeleteMany(modelIds: string[], tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = ModelMongoose.updateMany({ _id: { $in: modelIds } }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }

    async softDeleteByBrandId(brandId: string, tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = ModelMongoose.updateMany({ brandId }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }

    async updateCategoryIds(modelId: string, categoryIds: string[], tx?: unknown): Promise<boolean> {
        const query = ModelMongoose.updateOne(
            { _id: modelId },
            { $set: { categoryIds: categoryIds } }
        );
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount > 0;
    }
}
