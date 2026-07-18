import mongoose from 'mongoose';
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

    async findMany(filter?: Record<string, unknown>, tx?: unknown): Promise<Brand[]> {
        const query = BrandModel.find(filter || {}).lean<DbBrand[]>();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<Brand | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = BrandModel.findById(safeId).lean<DbBrand | null>();
        if (includeDeleted) query.setOptions({ withDeleted: true });
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByNameAndCategory(name: string, categoryId: string, tx?: unknown): Promise<Brand | null> {
        const canonicalName = name.trim().toLowerCase().replace(/\s+/g, ' ');
        const query = BrandModel.findOne({
            canonicalName,
            categoryIds: categoryId
        }).lean<DbBrand | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByCategory(categoryId: string, tx?: unknown): Promise<Brand[]> {
        const query = BrandModel.find({ categoryIds: categoryId }).lean<DbBrand[]>();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async exists(id: string, tx?: unknown): Promise<boolean> {
        const query = BrandModel.findById(id).select('_id').lean();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc !== null;
    }

    async updateCategoryIds(brandId: string, categoryIds: string[], tx?: unknown): Promise<boolean> {
        const query = BrandModel.updateOne(
            { _id: brandId },
            { $set: { categoryIds: categoryIds } }
        );
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount > 0;
    }

    async softDelete(brandId: string, tx?: unknown): Promise<boolean> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = BrandModel.findByIdAndUpdate(brandId, update, { new: true });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return !!res;
    }

    async softDeleteMany(brandIds: string[], tx?: unknown): Promise<number> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = BrandModel.updateMany({ _id: { $in: brandIds } }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }
}
