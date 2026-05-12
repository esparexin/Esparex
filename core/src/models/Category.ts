import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../constants/enums/catalogStatus';
import {
    TAXONOMY_APPROVAL_STATUS,
    TAXONOMY_APPROVAL_STATUS_VALUES,
    TaxonomyApprovalStatusValue,
} from '../constants/enums/taxonomyApprovalStatus';
import {
    applyTaxonomyNamingDefaults,
} from '../services/catalog/taxonomySsot';
import { applyTaxonomyLifecycleFields, taxonomyEntityToJsonTransform } from './taxonomyLifecycle';

export interface ICategory extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    type?: 'ad' | 'spare_part' | 'service' | 'other';
    icon?: string;
    description?: string;
    parentId?: mongoose.Types.ObjectId;
    isActive: boolean;
    approvalStatus: TaxonomyApprovalStatusValue;
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
    type: { type: String, enum: ['ad', 'spare_part', 'service', 'other'], default: 'ad', required: false },
    icon: { type: String },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: TAXONOMY_APPROVAL_STATUS_VALUES,
        default: TAXONOMY_APPROVAL_STATUS.APPROVED,
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
        transform: taxonomyEntityToJsonTransform
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
CategorySchema.index({ type: 1, isActive: 1 }, { name: 'idx_category_type_active' });
CategorySchema.index({ status: 1 }, { name: 'idx_category_status' });
CategorySchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_category_approval_active' });
CategorySchema.index({ isDeleted: 1, isActive: 1 }, { name: 'idx_category_isDeleted_isActive' });
CategorySchema.index({ isDeleted: 1 }, { name: 'idx_category_isDeleted' });

CategorySchema.index({ listingType: 1 }, { name: 'idx_category_listingType' });
CategorySchema.index(
    { canonicalName: 1 },
    {
        name: 'idx_category_canonicalName_unique_ci',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: { isDeleted: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
CategorySchema.plugin(softDeletePlugin);

CategorySchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    applyTaxonomyNamingDefaults(mutableDoc as Parameters<typeof applyTaxonomyNamingDefaults>[0]);
    applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
CategorySchema.plugin(installSafeSoftDeleteQuery);

// ON-THE-FLY NORMALIZATION (Safe Migration)
// Ensures legacy uppercase types and 'post' prefixes are mapped to the new standard at runtime.
CategorySchema.post('init', function(doc) {
    if (doc.type && ['AD', 'SERVICE', 'SPARE_PART'].includes(doc.type)) {
        doc.type = doc.type.toLowerCase() as typeof doc.type;
    }
});

import { getUserConnection } from '../config/db';
const Category: Model<ICategory> = (getUserConnection().models.Category as Model<ICategory> | undefined) || getUserConnection().model<ICategory>('Category', CategorySchema);

export default Category;
