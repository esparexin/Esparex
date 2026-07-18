import { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '@esparex/contracts';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '@esparex/shared';
import {
    applyCatalogNamingDefaults,
} from '../services/catalog/CatalogValidationService';
import { applyCatalogLifecycleFields, catalogEntityToJsonTransform } from './catalogLifecycle';

export interface IScreenSize extends Document {
    size: string;
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    marketplaceTrust?: {
        catalogTrustScore?: number;
        aliasTrustScore?: number;
        synonymTrustScore?: number;
        transliterationTrustScore?: number;
        moderatorTrustScore?: number;
        moderationReliabilityScore?: number;
        aliasApprovalConfidence?: number;
        synonymApprovalConfidence?: number;
        popularityConfidenceScore?: number;
        canonicalCertaintyScore?: number;
        duplicateConfidenceScore?: number;
        seoQualityScore?: number;
        crawlDepthLimit?: number;
        indexable?: boolean;
        lastAuditAt?: Date;
    };
    value: number;
    categoryId: Document['_id'];
    brandId?: Document['_id'];
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
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
    marketplaceTrust: {
        catalogTrustScore: { type: Number, default: 0.72, min: 0, max: 1 },
        aliasTrustScore: { type: Number, default: 0.62, min: 0, max: 1 },
        synonymTrustScore: { type: Number, default: 0.58, min: 0, max: 1 },
        transliterationTrustScore: { type: Number, default: 0.64, min: 0, max: 1 },
        moderatorTrustScore: { type: Number, default: 0.7, min: 0, max: 1 },
        moderationReliabilityScore: { type: Number, default: 0.7, min: 0, max: 1 },
        aliasApprovalConfidence: { type: Number, default: 0.6, min: 0, max: 1 },
        synonymApprovalConfidence: { type: Number, default: 0.55, min: 0, max: 1 },
        popularityConfidenceScore: { type: Number, default: 0.65, min: 0, max: 1 },
        canonicalCertaintyScore: { type: Number, default: 0.72, min: 0, max: 1 },
        duplicateConfidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
        seoQualityScore: { type: Number, default: 0.6, min: 0, max: 1 },
        crawlDepthLimit: { type: Number, default: 4, min: 1, max: 8 },
        indexable: { type: Boolean, default: true },
        lastAuditAt: { type: Date },
    },
    value: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
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
ScreenSizeSchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_screensize_marketplaceTrust_catalog' });
ScreenSizeSchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_screensize_marketplaceTrust_seo' });
ScreenSizeSchema.index({ name: 1 }, { name: 'idx_screensize_name', collation: { locale: 'en', strength: 2 } });
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
    applyCatalogNamingDefaults(mutableDoc as Parameters<typeof applyCatalogNamingDefaults>[0]);
    applyCatalogLifecycleFields(mutableDoc, CATALOG_APPROVAL_STATUS.APPROVED);
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
    transform: catalogEntityToJsonTransform
});

const userConnection = getUserConnection();

const ScreenSize: Model<IScreenSize> = (
    userConnection.models.ScreenSize as Model<IScreenSize>
) || userConnection.model<IScreenSize>('ScreenSize', ScreenSizeSchema);

export default ScreenSize;
