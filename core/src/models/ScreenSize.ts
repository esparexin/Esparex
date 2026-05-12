import { Schema, Document, Model } from 'mongoose';
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

export interface IScreenSize extends Document {
    size: string;
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    value: number;
    categoryId: Document['_id'];
    brandId?: Document['_id'];
    isActive: boolean;
    approvalStatus: TaxonomyApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ScreenSizeSchema: Schema = new Schema({
    size: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    value: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
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
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ScreenSizeSchema.index(
    { size: 1, categoryId: 1, brandId: 1 },
    {
        name: 'idx_screensize_size_category_brand',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

ScreenSizeSchema.index({ categoryId: 1 }, { name: 'idx_screensize_categoryId' });
ScreenSizeSchema.index({ brandId: 1 }, { name: 'idx_screensize_brandId' });
ScreenSizeSchema.index({ isActive: 1 }, { name: 'idx_screensize_isActive' });
ScreenSizeSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_screensize_approval_active' });
ScreenSizeSchema.index({ isDeleted: 1 }, { name: 'idx_screensize_isDeleted' });
ScreenSizeSchema.index(
    { categoryId: 1, slug: 1, brandId: 1 },
    {
        name: 'idx_screensize_category_slug_brand_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
ScreenSizeSchema.plugin(softDeletePlugin);

ScreenSizeSchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    if (typeof mutableDoc.name !== 'string' && typeof mutableDoc.size === 'string') {
        mutableDoc.name = `${mutableDoc.size} Screen Size`;
    }
    applyTaxonomyNamingDefaults(mutableDoc as Parameters<typeof applyTaxonomyNamingDefaults>[0]);
    applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ScreenSizeSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';
applyToJSONTransform(ScreenSizeSchema);
ScreenSizeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: taxonomyEntityToJsonTransform
});

const userConnection = getUserConnection();

const ScreenSize: Model<IScreenSize> = (
    userConnection.models.ScreenSize as Model<IScreenSize>
) || userConnection.model<IScreenSize>('ScreenSize', ScreenSizeSchema);

export default ScreenSize;
