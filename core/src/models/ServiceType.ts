import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '@esparex/shared';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    CatalogApprovalStatusValue,
} from '@esparex/shared';
import {
    applyCatalogNamingDefaults,
} from '../services/catalog/CatalogValidationService';
import { applyCatalogLifecycleFields, catalogEntityToJsonTransform } from './catalogLifecycle';

export interface IServiceType extends Document {
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
    categoryIds: mongoose.Types.ObjectId[];
    filters?: unknown[];
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ServiceTypeSchema: Schema = new Schema({
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
    categoryIds: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        validate: {
            validator: (val: unknown[]) => val && val.length > 0,
            message: 'Service type must be mapped to at least one category'
        }
    },
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
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ServiceTypeSchema.index({ categoryIds: 1 }, { name: 'idx_servicetype_categoryIds' });
ServiceTypeSchema.index({ isActive: 1 }, { name: 'idx_servicetype_isActive' });
ServiceTypeSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_servicetype_approval_active' });
ServiceTypeSchema.index({ isDeleted: 1 }, { name: 'idx_servicetype_isDeleted' });
ServiceTypeSchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_servicetype_marketplaceTrust_catalog' });
ServiceTypeSchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_servicetype_marketplaceTrust_seo' });
ServiceTypeSchema.index({ name: 1 }, { name: 'idx_servicetype_name', collation: { locale: 'en', strength: 2 } });
ServiceTypeSchema.index(
    { canonicalName: 1, categoryIds: 1 },
    {
        name: 'idx_servicetype_canonicalName_category_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);
ServiceTypeSchema.index(
    { categoryIds: 1, slug: 1 },
    {
        name: 'idx_servicetype_category_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);
ServiceTypeSchema.index(
    { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
    {
        name: 'idx_servicetype_search_text_readiness',
        weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
ServiceTypeSchema.plugin(softDeletePlugin);

ServiceTypeSchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    applyCatalogNamingDefaults(mutableDoc as Parameters<typeof applyCatalogNamingDefaults>[0]);
    applyCatalogLifecycleFields(mutableDoc, CATALOG_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ServiceTypeSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../infrastructure/db';
import { applyToJSONTransform } from '../utils/schemaOptions';
const ServiceType: Model<IServiceType> = (getUserConnection().models.ServiceType as Model<IServiceType> | undefined) || getUserConnection().model<IServiceType>('ServiceType', ServiceTypeSchema);

applyToJSONTransform(ServiceTypeSchema);
ServiceTypeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: catalogEntityToJsonTransform
});

export default ServiceType;
