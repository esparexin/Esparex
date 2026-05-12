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
import { TaxonomyAiAnalysisSchema, TaxonomyAiDecisionSchema } from './taxonomyAiSchema';

export interface IModel extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    brandId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    isActive: boolean;
    approvalStatus: TaxonomyApprovalStatusValue;
    status: CatalogStatusValue;
    suggestedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
    aiAnalysis?: any;
    aiDecision?: any;
}

const ModelSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: TAXONOMY_APPROVAL_STATUS_VALUES,
        default: TAXONOMY_APPROVAL_STATUS.APPROVED,
    },
    status: { type: String, enum: CATALOG_STATUS_VALUES, default: CATALOG_STATUS.ACTIVE },
    suggestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
    aiAnalysis: { type: TaxonomyAiAnalysisSchema },
    aiDecision: { type: TaxonomyAiDecisionSchema },
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
ModelSchema.index(
    { categoryIds: 1, brandId: 1, canonicalName: 1 },
    {
        name: 'idx_model_categories_brand_canonical_name',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: {
            isDeleted: false,
            approvalStatus: { $in: [TAXONOMY_APPROVAL_STATUS.APPROVED, TAXONOMY_APPROVAL_STATUS.PENDING] },
        }
    }
);

ModelSchema.index(
    { brandId: 1, categoryIds: 1, slug: 1 },
    {
        name: 'idx_model_brand_categories_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

ModelSchema.index(
    { brandId: 1, slug: 1 },
    {
        name: 'idx_model_brand_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

// Many-to-Many Indexes
ModelSchema.index({ categoryIds: 1 }, { name: 'idx_model_categoryIds' });

ModelSchema.index({ isActive: 1 }, { name: 'idx_model_isActive' });
ModelSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_model_approval_active' });
ModelSchema.index({ isDeleted: 1 }, { name: 'idx_model_isDeleted' });
ModelSchema.index({ brandId: 1 }, { name: 'idx_model_brandId' });

/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - model_brand_category_idx: { brandId: 1, categoryId: 1 }
 */

import softDeletePlugin from '../utils/softDeletePlugin';
ModelSchema.plugin(softDeletePlugin);

ModelSchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    applyTaxonomyNamingDefaults(mutableDoc as Parameters<typeof applyTaxonomyNamingDefaults>[0]);
    applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ModelSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../config/db';
const ProductModel: Model<IModel> = (getUserConnection().models.Model as Model<IModel> | undefined) || getUserConnection().model<IModel>('Model', ModelSchema);

export default ProductModel;
