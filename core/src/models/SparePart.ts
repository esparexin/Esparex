import mongoose, { Schema, Document, Model } from 'mongoose';
import { LISTING_TYPE, LISTING_TYPE_VALUES, type ListingTypeValue } from '../constants/enums/listingType';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '../constants/enums/catalogStatus';
import {
    TAXONOMY_APPROVAL_STATUS,
    TAXONOMY_APPROVAL_STATUS_VALUES,
    TaxonomyApprovalStatusValue,
} from '../constants/enums/taxonomyApprovalStatus';
import {
    applyTaxonomyNamingDefaults,
} from '../services/catalog/taxonomySsot';
import { applyTaxonomyLifecycleFields, taxonomyEntityToJsonTransform } from './taxonomyLifecycle';

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
    approvalStatus: TaxonomyApprovalStatusValue;
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
            enum: TAXONOMY_APPROVAL_STATUS_VALUES,
            default: TAXONOMY_APPROVAL_STATUS.APPROVED,
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
        toObject: { virtuals: true, versionKey: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
SparePartSchema.plugin(softDeletePlugin);

SparePartSchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    applyTaxonomyNamingDefaults(mutableDoc as Parameters<typeof applyTaxonomyNamingDefaults>[0]);
    applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
SparePartSchema.plugin(installSafeSoftDeleteQuery);

// INDEXES
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

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
SparePartSchema.index({ isDeleted: 1 }, { name: 'idx_sparepart_isDeleted' });

import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

applyToJSONTransform(SparePartSchema);

SparePartSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: taxonomyEntityToJsonTransform,
});

export const SparePartModel: Model<ISparePart> =
    (getUserConnection().models.SparePart as Model<ISparePart> | undefined) ||
    getUserConnection().model<ISparePart>('SparePart', SparePartSchema);

export default SparePartModel;
