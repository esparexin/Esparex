import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface ICategory extends Document {
    name: string;
    slug: string;
    type?: 'ad' | 'spare_part' | 'service' | 'other';
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
    type: { type: String, enum: ['ad', 'spare_part', 'service', 'other'], default: 'ad', required: false },
    icon: { type: String },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
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
    name: 'idx_category_slug_unique_idx', 
    unique: true,
    background: true,
    partialFilterExpression: { isDeleted: false }
});
CategorySchema.index({ parentId: 1 }, { name: 'idx_category_parent' });
CategorySchema.index({ type: 1, isActive: 1 }, { name: 'idx_category_type_active' });
CategorySchema.index({ status: 1 }, { name: 'idx_category_status' });
CategorySchema.index({ isDeleted: 1, isActive: 1 }, { name: 'idx_category_isDeleted_isActive' });
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

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
CategorySchema.plugin(installSafeSoftDeleteQuery);

// ON-THE-FLY NORMALIZATION (Safe Migration)
// Ensures legacy uppercase types and 'post' prefixes are mapped to the new standard at runtime.
CategorySchema.post('init', function(doc) {
    if (doc.type && ['AD', 'SERVICE', 'SPARE_PART'].includes(doc.type)) {
        doc.type = doc.type.toLowerCase() as any;
    }
    if (doc.listingType && doc.listingType.length > 0) {
        doc.listingType = doc.listingType.map((lt: string) => {
            if (lt === 'postad') return 'ad';
            if (lt === 'postservice') return 'service';
            if (lt === 'postsparepart') return 'spare_part';
            return lt;
        }) as any;
    }
});

import { getAdminConnection } from '../config/db';
const Category: Model<ICategory> = getAdminConnection().models.Category || getAdminConnection().model<ICategory>('Category', CategorySchema);

export default Category;
