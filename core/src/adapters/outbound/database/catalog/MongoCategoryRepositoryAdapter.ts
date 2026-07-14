import mongoose from 'mongoose';
import {
    Category,
    CategoryRepositoryPort,
    CategoryId,
    ListingTypeValue,
    ServiceSelectionMode
} from '../../../../domains/catalog';
import CategoryModel from '../../../../models/Category';
import { CATALOG_APPROVAL_STATUS, CatalogApprovalStatusValue } from '@esparex/shared';

interface DbCategory {
    _id: unknown;
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    isActive: boolean;
    isDeleted: boolean;
    listingType?: string[];
    serviceSelectionMode?: 'single' | 'multi';
    approvalStatus: string;
    hasScreenSizes?: boolean;
}

export class MongoCategoryRepositoryAdapter implements CategoryRepositoryPort {
    private toDomain(doc: DbCategory): Category {
        return {
            id: String(doc._id),
            name: doc.name,
            displayName: doc.displayName,
            canonicalName: doc.canonicalName,
            slug: doc.slug,
            isActive: doc.isActive,
            isDeleted: doc.isDeleted,
            configuration: {
                listingTypes: (doc.listingType || []) as ListingTypeValue[],
                serviceSelectionMode: (doc.serviceSelectionMode || 'multi') as ServiceSelectionMode,
                approvalStatus: doc.approvalStatus as CatalogApprovalStatusValue,
                hasScreenSizes: !!doc.hasScreenSizes,
            }
        };
    }

    async findById(id: string, tx?: unknown): Promise<Category | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        const query = CategoryModel.findById(safeId).lean<DbCategory | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findBySlug(slug: string, tx?: unknown): Promise<Category | null> {
        const safeSlug = typeof slug === 'string' ? slug : String(slug ?? '');
        const query = CategoryModel.findOne({ slug: safeSlug }).lean<DbCategory | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string, tx?: unknown): Promise<boolean> {
        const query = CategoryModel.findById(id).select('_id').lean();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc !== null;
    }

    async resolveActiveCategoryIds(categoryIds?: readonly CategoryId[], tx?: unknown): Promise<readonly CategoryId[]> {
        const filter: Record<string, unknown> = {
            isActive: true,
            isDeleted: { $ne: true },
            approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED
        };
        if (categoryIds && categoryIds.length > 0) {
            filter._id = { $in: categoryIds };
        }
        const query = CategoryModel.find(filter).select('_id').lean();
        if (tx) query.session(tx as any);
        const docs = await query.exec();
        return docs.map(doc => String(doc._id));
    }

    async create(data: Partial<Category> | any, tx?: unknown): Promise<Category> {
        const docs = await CategoryModel.create([data], { session: tx as any });
        return this.toDomain(docs[0] as unknown as DbCategory);
    }

    async update(id: string, data: Partial<Category> | any, tx?: unknown): Promise<Category | null> {
        const query = CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean<DbCategory | null>();
        if (tx) query.session(tx as any);
        const doc = await query.exec();
        return doc ? this.toDomain(doc) : null;
    }

    async softDelete(id: string, tx?: unknown): Promise<boolean> {
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };
        const query = CategoryModel.updateOne({ _id: id }, { $set: update });
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount > 0;
    }
}
