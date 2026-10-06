import type { ClientSession } from 'mongoose';
import { ServiceType, ServiceTypeRepositoryPort } from '../../..';
import ServiceTypeModel from '../../../../../models/ServiceType';
import { CatalogApprovalStatusValue } from '@esparex/contracts';

interface DbServiceType {
    _id: unknown;
    name: string;
    canonicalName: string;
    slug: string;
    isActive: boolean;
    isDeleted: boolean;
    categoryIds: unknown[];
    approvalStatus: string;
}

export class MongoServiceTypeRepositoryAdapter implements ServiceTypeRepositoryPort {
    private toDomain(doc: DbServiceType): ServiceType {
        return {
            id: String(doc._id),
            _id: String(doc._id),
            name: doc.name,
            canonicalName: doc.canonicalName,
            slug: doc.slug,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            categoryIds: (doc.categoryIds ?? []).map(id => String(id)),
            approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
        };
    }

    async findById(id: string, includeDeleted?: boolean, tx?: unknown): Promise<ServiceType | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = ServiceTypeModel.findById(safeId).lean<DbServiceType | null>();
        if (includeDeleted) query.setOptions({ withDeleted: true });
        if (tx) query.session(tx as ClientSession);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string, tx?: unknown): Promise<boolean> {
        const query = ServiceTypeModel.findById(id).select('_id').lean();
        if (tx) query.session(tx as ClientSession);
        const doc = await query.exec();
        return doc !== null;
    }

    async create(data: Partial<ServiceType> | Record<string, unknown>, tx?: unknown): Promise<ServiceType> {
        const payload: Record<string, unknown> = { ...data };
        const docs = await ServiceTypeModel.create([payload], { session: tx as ClientSession | undefined });
        const created = await ServiceTypeModel.findById(docs[0]._id).lean<DbServiceType | null>();
        if (!created) throw new Error('ServiceTypeRepositoryPort.create: created document not found');
        return this.toDomain(created);
    }

    async update(id: string, data: Partial<ServiceType> | Record<string, unknown>, tx?: unknown): Promise<ServiceType | null> {
        const query = ServiceTypeModel.findByIdAndUpdate(id, data as Record<string, unknown>, { new: true }).lean<DbServiceType | null>();
        if (tx) query.session(tx as ClientSession);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async softDelete(id: string, tx?: unknown): Promise<boolean> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = ServiceTypeModel.findByIdAndUpdate(id, update, { new: true });
        if (tx) query.session(tx as ClientSession);
        const res = await query.exec();
        return !!res;
    }
}
