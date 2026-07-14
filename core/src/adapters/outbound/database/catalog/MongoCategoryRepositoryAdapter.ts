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

    async findById(id: string): Promise<Category | null> {
        const doc = await CategoryModel.findById(id).lean<DbCategory | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findBySlug(slug: string): Promise<Category | null> {
        const doc = await CategoryModel.findOne({ slug }).lean<DbCategory | null>().exec();
        return doc ? this.toDomain(doc) : null;
    }

    async exists(id: string): Promise<boolean> {
        const doc = await CategoryModel.findById(id).select('_id').lean().exec();
        return doc !== null;
    }

    async resolveActiveCategoryIds(categoryIds?: readonly CategoryId[]): Promise<readonly CategoryId[]> {
        const query: Record<string, unknown> = {
            isActive: true,
            isDeleted: { $ne: true },
            approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED
        };
        if (categoryIds && categoryIds.length > 0) {
            query._id = { $in: categoryIds };
        }
        const docs = await CategoryModel.find(query).select('_id').lean().exec();
        return docs.map(doc => String(doc._id));
    }
}
