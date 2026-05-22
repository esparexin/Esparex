import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '@esparex/shared';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    type CatalogApprovalStatusValue,
} from '@esparex/shared';
import softDeletePlugin from '../utils/softDeletePlugin';
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
import { getUserConnection } from '../config/db';

export interface IVariant extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    marketplaceTrust?: {
        catalogTrustScore?: number;
        variantTrustScore?: number;
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
    modelId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const VariantSchema = new Schema<IVariant>(
    {
        name: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        canonicalName: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true },
        aliases: { type: [String], default: [] },
        synonyms: { type: [String], default: [] },
        marketplaceTrust: {
            catalogTrustScore: { type: Number, default: 0.72, min: 0, max: 1 },
            variantTrustScore: { type: Number, default: 0.66, min: 0, max: 1 },
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
        modelId: { type: Schema.Types.ObjectId, ref: 'Model', required: true },
        categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
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
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
        toObject: { virtuals: true, versionKey: false },
    }
);

VariantSchema.plugin(softDeletePlugin);
VariantSchema.plugin(installSafeSoftDeleteQuery);

VariantSchema.pre('validate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
    const mutableDoc = this as any;
    
    if (!mutableDoc.canonicalName && mutableDoc.displayName) {
        mutableDoc.canonicalName = mutableDoc.displayName;
    }
    
    if (!mutableDoc.approvalStatus) {
        mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
    }

    mutableDoc.name = mutableDoc.displayName;
});

VariantSchema.index({ modelId: 1 }, { name: 'idx_variant_modelId' });
VariantSchema.index({ categoryIds: 1 }, { name: 'idx_variant_categoryIds' });
VariantSchema.index({ isActive: 1 }, { name: 'idx_variant_isActive' });
VariantSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_variant_approval_active' });
VariantSchema.index({ isDeleted: 1 }, { name: 'idx_variant_isDeleted' });
VariantSchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_variant_marketplaceTrust_catalog' });
VariantSchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_variant_marketplaceTrust_seo' });
VariantSchema.index(
    { modelId: 1, slug: 1 },
    {
        name: 'idx_variant_model_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);
VariantSchema.index(
    { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
    {
        name: 'idx_variant_search_text_readiness',
        weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
    }
);

const VariantModel: Model<IVariant> =
    (getUserConnection().models.Variant as Model<IVariant> | undefined) ||
    getUserConnection().model<IVariant>('Variant', VariantSchema);

export default VariantModel;
