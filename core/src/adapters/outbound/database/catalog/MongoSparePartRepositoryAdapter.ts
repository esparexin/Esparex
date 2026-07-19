import { SparePart, SparePartRepositoryPort } from '../../../../domains/catalog';
import SparePartMongoose from '../../../../models/SparePart';
import { CatalogApprovalStatusValue } from '@esparex/contracts';

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

    async findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<SparePart | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = SparePartMongoose.findById(safeId).lean<DbSparePart | null>();
        if (includeDeleted) query.setOptions({ withDeleted: true });
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string, tx?: unknown): Promise<boolean> {
        const query = SparePartMongoose.findById(id).select('_id').lean();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc !== null;
    }

    async findByCategoryOrBrands(categoryId: string, brandIds: string[], tx?: unknown): Promise<SparePart[]> {
        const sparePartOrFilters: Array<Record<string, unknown>> = [{ categoryIds: categoryId }];
        if (brandIds.length > 0) {
            sparePartOrFilters.push({ brandId: { $in: brandIds } });
        }
        const query = SparePartMongoose.find({ $or: sparePartOrFilters }).lean<DbSparePart[]>();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async create(data: Partial<SparePart> | any, tx?: unknown): Promise<SparePart> {
        const docs = await SparePartMongoose.create([data], { session: tx as any });
        return this.toDomain(docs[0] as unknown as DbSparePart);
    }

    async update(id: string, data: Partial<SparePart> | any, tx?: unknown): Promise<SparePart | null> {
        const query = SparePartMongoose.findByIdAndUpdate(id, data, { new: true }).lean<DbSparePart | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async softDelete(id: string, tx?: unknown): Promise<boolean> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = SparePartMongoose.findByIdAndUpdate(id, update, { new: true });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return !!res;
    }

    async softDeleteMany(sparePartIds: string[], tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = SparePartMongoose.updateMany({ _id: { $in: sparePartIds } }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }

    async softDeleteByBrandId(brandId: string, tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = SparePartMongoose.updateMany({ brandId }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }

    async softDeleteByModelIds(modelIds: string[], tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = SparePartMongoose.updateMany({ modelId: { $in: modelIds } }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }

    async updateCategoryIds(sparePartId: string, categoryIds: string[], tx?: unknown): Promise<boolean> {
        const query = SparePartMongoose.updateOne(
            { _id: sparePartId },
            { $set: { categoryIds } }
        );
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount > 0;
    }

    async clearModelReferences(modelId: string, tx?: unknown): Promise<number> {
        const query = SparePartMongoose.updateMany(
            { modelId },
            { $set: { modelId: null, isActive: false } }
        );
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }
}
