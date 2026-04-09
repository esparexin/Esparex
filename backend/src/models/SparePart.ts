import mongoose, { Schema, Document, Model } from 'mongoose';
import { LISTING_TYPE, LISTING_TYPE_VALUES, type ListingTypeValue } from '../../../shared/enums/listingType';

export interface ISparePart extends Document {
    name: string;
    slug: string;
    listingType: ListingTypeValue[];
    categoryIds: mongoose.Types.ObjectId[];
    brandId?: mongoose.Types.ObjectId;   // Optional — scopes part to a brand
    modelId?: mongoose.Types.ObjectId;   // Optional — scopes part to a specific model
    sortOrder: number;
    usageCount: number;
    filters?: unknown[];
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const SparePartSchema = new Schema<ISparePart>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
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
        createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
    },

    {
        timestamps: true,
        toObject: { virtuals: true, versionKey: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
SparePartSchema.plugin(softDeletePlugin);

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
SparePartSchema.index({ categoryIds: 1, isActive: 1 }, { name: 'idx_sparepart_categoryIds_active' });
SparePartSchema.index({ brandId: 1, modelId: 1 }, { name: 'idx_sparepart_brand_model' });
SparePartSchema.index({ sortOrder: 1 }, { name: 'idx_sparepart_sortOrder' });
SparePartSchema.index({ createdBy: 1 }, { name: 'idx_sparepart_createdBy' });
SparePartSchema.index({ isDeleted: 1 }, { name: 'idx_sparepart_isDeleted' });

SparePartSchema.pre('validate', function() {
    if (Array.isArray(this.listingType) && this.listingType.length > 0) {
        this.listingType = this.listingType.map((value: string) => {
            if (value === 'postad') return LISTING_TYPE.AD;
            if (value === 'postsparepart') return LISTING_TYPE.SPARE_PART;
            return value;
        }) as ListingTypeValue[];
    }
});

SparePartSchema.post('init', function(doc: ISparePart) {
    if (Array.isArray(doc.listingType) && doc.listingType.length > 0) {
        doc.listingType = doc.listingType.map((value: string) => {
            if (value === 'postad') return LISTING_TYPE.AD;
            if (value === 'postsparepart') return LISTING_TYPE.SPARE_PART;
            return value;
        }) as ListingTypeValue[];
    }
});

import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

applyToJSONTransform(SparePartSchema);
export const SparePartModel: Model<ISparePart> =
    getAdminConnection().models.SparePart ||
    getAdminConnection().model<ISparePart>('SparePart', SparePartSchema);

export default SparePartModel;
