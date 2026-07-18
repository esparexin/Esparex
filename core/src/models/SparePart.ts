import mongoose, { Schema, Document, Model } from 'mongoose';
import { LISTING_TYPE, LISTING_TYPE_VALUES, type ListingTypeValue } from '@esparex/contracts';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '@esparex/contracts';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '@esparex/shared';
import { applyCatalogGovernanceDefaults } from '../utils/catalogGovernance';

export interface ISparePart extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    listingType: ListingTypeValue[];
    categoryIds: mongoose.Types.ObjectId[];
    brandId?: mongoose.Types.ObjectId;   // Optional — scopes part to a brand
    modelId?: mongoose.Types.ObjectId;   // Optional — scopes part to a specific model
    sortOrder: number;
    usageCount: number;
    filters?: unknown[];
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    createdBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const SparePartSchema = new Schema<ISparePart>(
    {
        name: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        canonicalName: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
        aliases: { type: [String], default: [] },
        synonyms: { type: [String], default: [] },
        listingType: {
            type: [String],
            enum: LISTING_TYPE_VALUES,
            default: [LISTING_TYPE.SPARE_PART],
        },
        categoryIds: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
            validate: {
                validator: (val: unknown[]) => val && val.length > 0,
                message: 'Spare part must be mapped to at least one category'
            }
        },
        brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
        modelId: { type: Schema.Types.ObjectId, ref: 'Model' },
        sortOrder: { type: Number, default: 0 },
        usageCount: { type: Number, default: 0 },
        filters: { type: Array, default: [] },
        isActive: { type: Boolean, default: true },
        approvalStatus: {
            type: String,
            enum: CATALOG_APPROVAL_STATUS_VALUES,
            default: CATALOG_APPROVAL_STATUS.APPROVED,
        },
        status: {
            type: String,
            enum: CATALOG_STATUS_VALUES,
            default: CATALOG_STATUS.ACTIVE,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
    },

    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
        toObject: { virtuals: true, versionKey: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
SparePartSchema.plugin(softDeletePlugin);

SparePartSchema.pre('validate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
    const mutableDoc = this as any;
    applyCatalogGovernanceDefaults(mutableDoc);
    
    if (!mutableDoc.approvalStatus) {
        mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
    }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
SparePartSchema.plugin(installSafeSoftDeleteQuery);

// INDEXES
SparePartSchema.index({ slug: 1 }, { 
    name: 'idx_sparepart_slug_unique', 
    unique: true,
    partialFilterExpression: { isDeleted: false }
});
SparePartSchema.index({ categoryIds: 1 }, { name: 'idx_sparepart_categoryIds' });
SparePartSchema.index({ isActive: 1 }, { name: 'idx_sparepart_isActive' });
SparePartSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_sparepart_approval_active' });
SparePartSchema.index({ categoryIds: 1, isActive: 1 }, { name: 'idx_sparepart_categoryIds_active' });
SparePartSchema.index({ brandId: 1, modelId: 1 }, { name: 'idx_sparepart_brand_model' });
SparePartSchema.index({ sortOrder: 1 }, { name: 'idx_sparepart_sortOrder' });
SparePartSchema.index({ createdBy: 1 }, { name: 'idx_sparepart_createdBy' });
SparePartSchema.index({ name: 1 }, { name: 'idx_sparepart_name', collation: { locale: 'en', strength: 2 } });
SparePartSchema.index({ isDeleted: 1 }, { name: 'idx_sparepart_isDeleted' });
SparePartSchema.index(
    { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
    {
        name: 'idx_sparepart_search_text_readiness',
        weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
    }
);

import { getUserConnection } from '../config/db';

export const SparePart: Model<ISparePart> =
    (getUserConnection().models.SparePart as Model<ISparePart> | undefined) ||
    getUserConnection().model<ISparePart>('SparePart', SparePartSchema);

export default SparePart;
