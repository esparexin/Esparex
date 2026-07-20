import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '@esparex/contracts';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '@esparex/shared';
import { IMarketplaceTrust, marketplaceTrustDefinition } from './catalogLifecycle';

export interface ICategory extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    marketplaceTrust?: IMarketplaceTrust;

    icon?: string;
    description?: string;
    parentId?: mongoose.Types.ObjectId;
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    filters?: unknown[];
    // Metadata-driven architecture fields
    listingType?: string[];
    serviceSelectionMode: 'single' | 'multi';
    hasScreenSizes: boolean;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const CategorySchema = new Schema<ICategory>({
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    canonicalName: { type: String, required: true },
    slug: { type: String, required: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    marketplaceTrust: marketplaceTrustDefinition,

    icon: { type: String },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: CATALOG_APPROVAL_STATUS_VALUES,
        default: CATALOG_APPROVAL_STATUS.APPROVED,
    },
    status: { type: String, enum: CATALOG_STATUS_VALUES, default: CATALOG_STATUS.ACTIVE },
    filters: { type: [Schema.Types.Mixed], default: [] },
    // Metadata-driven fields
    listingType: [{ type: String, enum: ['ad', 'service', 'spare_part'] }],
    serviceSelectionMode: { type: String, enum: ['single', 'multi'], default: 'multi' },
    hasScreenSizes: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
    },
    toObject: { virtuals: true, versionKey: false }
});


// INDEXES
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CategorySchema.index({ slug: 1 }, { 
    name: 'idx_category_slug_unique_idx', 
    unique: true,
    background: true,
    partialFilterExpression: { isDeleted: false }
});
CategorySchema.index({ parentId: 1 }, { name: 'idx_category_parent' });

CategorySchema.index({ status: 1 }, { name: 'idx_category_status' });
CategorySchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_category_approval_active' });
CategorySchema.index({ isDeleted: 1, isActive: 1 }, { name: 'idx_category_isDeleted_isActive' });
CategorySchema.index({ name: 1 }, { name: 'idx_category_name', collation: { locale: 'en', strength: 2 } });
CategorySchema.index({ isDeleted: 1 }, { name: 'idx_category_isDeleted' });

CategorySchema.index({ listingType: 1 }, { name: 'idx_category_listingType' });
CategorySchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_category_marketplaceTrust_catalog' });
CategorySchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_category_marketplaceTrust_seo' });
CategorySchema.index(
    { canonicalName: 1 },
    {
        name: 'idx_category_canonicalName_unique_ci',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: { isDeleted: false }
    }
);
CategorySchema.index(
    { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
    {
        name: 'idx_category_search_text_readiness',
        weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
CategorySchema.plugin(softDeletePlugin);

CategorySchema.pre('validate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
    const mutableDoc = this as any;

    const normalizedDisplayName = (mutableDoc.displayName || mutableDoc.name || '').trim();
    if (normalizedDisplayName) {
        mutableDoc.displayName = normalizedDisplayName;
        mutableDoc.name = normalizedDisplayName;
    }

    if (typeof mutableDoc.canonicalName === 'string') {
        mutableDoc.canonicalName = mutableDoc.canonicalName.trim();
    }
    if (!mutableDoc.canonicalName && normalizedDisplayName) {
        mutableDoc.canonicalName = normalizedDisplayName.toLowerCase().replace(/\s+/g, ' ');
    }

    if (!mutableDoc.approvalStatus) {
        mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
    }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
CategorySchema.plugin(installSafeSoftDeleteQuery);



import { getUserConnection } from '../config/db';
const Category: Model<ICategory> = (getUserConnection().models.Category as Model<ICategory> | undefined) || getUserConnection().model<ICategory>('Category', CategorySchema);

export default Category;
