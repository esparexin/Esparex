import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../constants/enums/catalogStatus';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '../constants/enums/catalogApprovalStatus';

export interface IModel extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    brandId: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
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
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
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

/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - model_brand_category_idx: { brandId: 1, categoryId: 1 }
 */

import softDeletePlugin from '../utils/softDeletePlugin';
ModelSchema.plugin(softDeletePlugin);

ModelSchema.pre('validate', function () {
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

    // Enforce bidirectional singular/plural category synchronization
    if (mutableDoc.categoryId && (!mutableDoc.categoryIds || mutableDoc.categoryIds.length === 0)) {
        mutableDoc.categoryIds = [mutableDoc.categoryId];
    } else if ((!mutableDoc.categoryId || mutableDoc.categoryId === null) && mutableDoc.categoryIds && mutableDoc.categoryIds.length > 0) {
        mutableDoc.categoryId = mutableDoc.categoryIds[0];
    }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ModelSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../config/db';
const ProductModel: Model<IModel> = (getUserConnection().models.Model as Model<IModel> | undefined) || getUserConnection().model<IModel>('Model', ModelSchema);

export default ProductModel;
