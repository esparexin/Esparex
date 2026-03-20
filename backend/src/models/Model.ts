import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface IModel extends Document {
    name: string;
    brandId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    isActive: boolean;
    status: CatalogStatusValue;
    suggestedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ModelSchema: Schema = new Schema({
    name: { type: String, required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: CATALOG_STATUS_VALUES, default: CATALOG_STATUS.ACTIVE },
    suggestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc: unknown, ret: unknown) {
            const json = ret as Record<string, unknown>;
            json.id = String(json._id);
            delete json._id;
            return json;
        }
    },
    toObject: { virtuals: true, versionKey: false }
});

// INDEXES
ModelSchema.index(
    { categoryId: 1, brandId: 1, name: 1 },
    {
        name: 'idx_model_category_brand_name',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        // Same partial-index strategy as Brand: only enforce uniqueness on active/pending models.
        // MongoDB partial indexes do not support $ne; use positive $in instead.
        partialFilterExpression: { isDeleted: false, status: { $in: [CATALOG_STATUS.ACTIVE, CATALOG_STATUS.PENDING] } }
    }
);

// Many-to-Many Indexes
ModelSchema.index({ categoryIds: 1 }, { name: 'idx_model_categoryIds' });

ModelSchema.index({ categoryId: 1 }, { name: 'idx_model_categoryId' });
ModelSchema.index({ isActive: 1 }, { name: 'idx_model_isActive' });
ModelSchema.index({ isDeleted: 1 }, { name: 'idx_model_isDeleted' });

/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - model_brand_category_idx: { brandId: 1, categoryId: 1 }
 */

import softDeletePlugin from '../utils/softDeletePlugin';
ModelSchema.plugin(softDeletePlugin);

import { getAdminConnection } from '../config/db';
const ProductModel: Model<IModel> = getAdminConnection().models.Model || getAdminConnection().model<IModel>('Model', ModelSchema);

export default ProductModel;
