import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '@esparex/contracts';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '@esparex/shared';
import { applyCatalogGovernanceDefaults } from '../utils/catalogGovernance';
import { IMarketplaceTrust, marketplaceTrustDefinition } from './catalogLifecycle';

export interface IModel extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    marketplaceTrust?: IMarketplaceTrust;
    brandId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    parentModelId?: mongoose.Types.ObjectId | null;
    variantOfModelId?: mongoose.Types.ObjectId | null;
    hierarchyPath?: string[];
    treeDepth?: number;
    variantType?: string;
    isParentModel?: boolean;
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    suggestedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ModelSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    marketplaceTrust: marketplaceTrustDefinition,
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    parentModelId: { type: Schema.Types.ObjectId, ref: 'Model', default: null },
    variantOfModelId: { type: Schema.Types.ObjectId, ref: 'Model', default: null },
    hierarchyPath: { type: [String], default: [] },
    treeDepth: { type: Number, default: 0, min: 0 },
    variantType: { type: String, trim: true, default: null },
    isParentModel: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: CATALOG_APPROVAL_STATUS_VALUES,
        default: CATALOG_APPROVAL_STATUS.APPROVED,
    },
    status: { type: String, enum: CATALOG_STATUS_VALUES, default: CATALOG_STATUS.ACTIVE },
    suggestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
    },
    toObject: { virtuals: true, versionKey: false }
});

// INDEXES
ModelSchema.index(
    { brandId: 1, canonicalName: 1 },
    {
        name: 'idx_model_brand_canonical_name_unique',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: {
            isDeleted: false,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
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
ModelSchema.index({ name: 1 }, { name: 'idx_model_name', collation: { locale: 'en', strength: 2 } });
ModelSchema.index({ isDeleted: 1 }, { name: 'idx_model_isDeleted' });
ModelSchema.index({ brandId: 1 }, { name: 'idx_model_brandId' });
ModelSchema.index({ parentModelId: 1 }, { name: 'idx_model_parentModelId' });
ModelSchema.index({ variantOfModelId: 1 }, { name: 'idx_model_variantOfModelId' });
ModelSchema.index({ hierarchyPath: 1 }, { name: 'idx_model_hierarchyPath' });
ModelSchema.index({ brandId: 1, parentModelId: 1 }, { name: 'idx_model_brand_parentModelId' });
ModelSchema.index({ brandId: 1, variantOfModelId: 1, slug: 1 }, { name: 'idx_model_brand_variant_slug' });
ModelSchema.index({ brandId: 1, parentModelId: 1, slug: 1 }, { name: 'idx_model_brand_parent_slug' });
ModelSchema.index({ treeDepth: 1, isDeleted: 1 }, { name: 'idx_model_treeDepth_isDeleted' });
ModelSchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_model_marketplaceTrust_catalog' });
ModelSchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_model_marketplaceTrust_seo' });
ModelSchema.index(
    { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
    {
        name: 'idx_model_search_text_readiness',
        weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
    }
);

ModelSchema.index({ brandId: 1, categoryIds: 1 }, { name: 'model_brand_categoryIds_idx' });

import softDeletePlugin from '../utils/softDeletePlugin';
ModelSchema.plugin(softDeletePlugin);

ModelSchema.pre('validate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
    const mutableDoc = this as any;
    applyCatalogGovernanceDefaults(mutableDoc);

    if (!mutableDoc.approvalStatus) {
        mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
    }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ModelSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../config/db';
export const Model: MongooseModel<IModel> = (getUserConnection().models.Model as MongooseModel<IModel> | undefined) || getUserConnection().model<IModel>('Model', ModelSchema);

export default Model;
