import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface ISparePart extends Document {
    name: string;
    slug: string;
    listingType: string[];
    categoryIds: mongoose.Types.ObjectId[];
    brandId?: mongoose.Types.ObjectId;   // Optional — scopes part to a brand
    modelId?: mongoose.Types.ObjectId;   // Optional — scopes part to a specific model
    sortOrder: number;
    usageCount: number;
    filters?: unknown[];
    isActive: boolean;
    rejectionReason?: string;
    needsReview?: boolean; // Flag for data audit/migration
    createdBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const SparePartSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
        listingType: { 
            type: [String], 
            enum: ['postad', 'postsparepart'], 
            default: ['postsparepart'] 
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
        rejectionReason: { type: String },
        needsReview: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
    },

    {
        timestamps: true,
        toObject: { virtuals: true, versionKey: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
SparePartSchema.plugin(softDeletePlugin);

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

// toJSON Transform — MUST be before model() registration
SparePartSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        return json;
    }
});

import { getAdminConnection } from '../config/db';
export const SparePartModel: Model<ISparePart> =
    getAdminConnection().models.SparePart ||
    getAdminConnection().model<ISparePart>('SparePart', SparePartSchema);

export default SparePartModel;
