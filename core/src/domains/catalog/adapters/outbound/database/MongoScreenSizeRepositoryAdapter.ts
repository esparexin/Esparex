import type { ClientSession } from 'mongoose';
import { ScreenSize, ScreenSizeBulkDeleteCriteria, ScreenSizeRepositoryPort } from '../../..';
import ScreenSizeMongoose from '../../../../../models/ScreenSize';
import { CatalogApprovalStatusValue } from '@esparex/contracts';

interface DbScreenSize {
    _id: unknown;
    size: string;
    name: string;
    canonicalName: string;
    slug: string;
    value: number;
    categoryId: unknown;
    brandId?: unknown;
    isActive: boolean;
    isDeleted: boolean;
    approvalStatus: string;
}

export class MongoScreenSizeRepositoryAdapter implements ScreenSizeRepositoryPort {
    private toDomain(doc: DbScreenSize): ScreenSize {
        return {
            id: String(doc._id),
            _id: String(doc._id),
            size: doc.size,
            name: doc.name,
            canonicalName: doc.canonicalName,
            slug: doc.slug,
            value: doc.value,
            categoryId: String(doc.categoryId),
            brandId: doc.brandId ? String(doc.brandId) : undefined,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
        };
    }

    async findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<ScreenSize | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = ScreenSizeMongoose.findById(safeId).lean<DbScreenSize | null>();
        if (includeDeleted) query.setOptions({ withDeleted: true });
        if (tx) query.session(tx as ClientSession);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async create(data: Partial<ScreenSize> | Record<string, unknown>, tx?: unknown): Promise<ScreenSize> {
        const payload: Record<string, unknown> = { ...data };
        const docs = await ScreenSizeMongoose.create([payload], { session: tx as ClientSession | undefined });
        const created = await ScreenSizeMongoose.findById(docs[0]._id).lean<DbScreenSize | null>();
        if (!created) throw new Error('ScreenSizeRepositoryPort.create: created document not found');
        return this.toDomain(created);
    }

    async update(id: string, data: Partial<ScreenSize> | Record<string, unknown>, tx?: unknown): Promise<ScreenSize | null> {
        const query = ScreenSizeMongoose.findByIdAndUpdate(id, data as Record<string, unknown>, { new: true }).lean<DbScreenSize | null>();
        if (tx) query.session(tx as ClientSession);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async softDeleteByCriteria(criteria: ScreenSizeBulkDeleteCriteria, tx?: unknown): Promise<number> {
        const { categoryId, brandIds } = criteria;
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };

        const orFilters: Array<Record<string, unknown>> = [{ categoryId }];
        if (brandIds && brandIds.length > 0) {
            orFilters.push({ brandId: { $in: brandIds } });
        }

        const query = ScreenSizeMongoose.updateMany(
            { $or: orFilters },
            { $set: update }
        );
        if (tx) query.session(tx as ClientSession);
        const res = await query.exec();
        return res.modifiedCount;
    }
}
