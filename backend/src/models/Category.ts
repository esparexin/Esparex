import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface ICategory extends Document {
    name: string;
    slug: string;
    type?: 'AD' | 'SPARE_PART' | 'SERVICE' | 'OTHER';
    icon?: string;
    description?: string;
    parentId?: mongoose.Types.ObjectId;
    isActive: boolean;
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
    slug: { type: String, required: true },
    type: { type: String, enum: ['AD', 'SPARE_PART', 'SERVICE', 'OTHER'], default: 'AD', required: false },
    icon: { type: String },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: CATALOG_STATUS_VALUES, default: CATALOG_STATUS.ACTIVE },
    filters: { type: [Schema.Types.Mixed], default: [] },
    // Metadata-driven fields
    listingType: [{ type: String, enum: ['postad', 'postservice', 'postsparepart'] }],
    serviceSelectionMode: { type: String, enum: ['single', 'multi'], default: 'multi' },
    hasScreenSizes: { type: Boolean, default: false }
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
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CategorySchema.index({ slug: 1 }, { 
    name: 'category_slug_unique_idx', 
    unique: true,
    background: true,
    partialFilterExpression: { isDeleted: false }
});
CategorySchema.index({ parentId: 1 }, { name: 'idx_category_parent' });
CategorySchema.index({ type: 1, isActive: 1 }, { name: 'idx_category_type_active' });
CategorySchema.index({ status: 1 }, { name: 'idx_category_status' });
CategorySchema.index({ isDeleted: 1 }, { name: 'idx_category_isDeleted' });
CategorySchema.index({ listingType: 1 }, { name: 'idx_category_listingType' });
CategorySchema.index(
    { name: 1 },
    {
        name: 'idx_category_name_unique_ci',
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: { isDeleted: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
CategorySchema.plugin(softDeletePlugin);

import { getAdminConnection } from '../config/db';
const Category: Model<ICategory> = getAdminConnection().models.Category || getAdminConnection().model<ICategory>('Category', CategorySchema);

export default Category;
