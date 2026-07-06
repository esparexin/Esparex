import { Schema, Document, Types, Model } from 'mongoose'
import { ISoftDeleteDocument } from '../utils/softDeletePlugin'
import softDeletePlugin from '../utils/softDeletePlugin'
import { CATALOG_STATUS } from '@esparex/shared'
import { applyCatalogGovernanceDefaults } from '../utils/catalogGovernance'
import {
  CATALOG_APPROVAL_STATUS,
  CATALOG_APPROVAL_STATUS_VALUES,
  CatalogApprovalStatusValue,
} from '@esparex/shared'

export interface IBrand extends Document, ISoftDeleteDocument {
  name: string
  displayName: string
  canonicalName: string
  slug: string
  aliases: string[]
  synonyms: string[]
  marketplaceTrust?: {
    catalogTrustScore?: number
    variantTrustScore?: number
    aliasTrustScore?: number
    synonymTrustScore?: number
    transliterationTrustScore?: number
    moderatorTrustScore?: number
    moderationReliabilityScore?: number
    aliasApprovalConfidence?: number
    synonymApprovalConfidence?: number
    popularityConfidenceScore?: number
    canonicalCertaintyScore?: number
    duplicateConfidenceScore?: number
    seoQualityScore?: number
    crawlDepthLimit?: number
    indexable?: boolean
    lastAuditAt?: Date
  }
  categoryIds: Types.ObjectId[]
  isActive: boolean
  approvalStatus: CatalogApprovalStatusValue
  status: string
  suggestedBy?: Types.ObjectId
  rejectionReason?: string
  needsReview?: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date;
  updatedAt: Date;
}


const BrandSchema = new Schema<IBrand>({
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
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  approvalStatus: {
    type: String,
    enum: CATALOG_APPROVAL_STATUS_VALUES,
    default: CATALOG_APPROVAL_STATUS.APPROVED,
  },
  status: { type: String, enum: Object.values(CATALOG_STATUS), default: CATALOG_STATUS.ACTIVE },
  suggestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  needsReview: { type: Boolean, default: false },
  // isDeleted and deletedAt are injected by softDeletePlugin below
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
  toObject: { virtuals: true, versionKey: false }
})

// Apply soft-delete plugin (adds isDeleted, deletedAt fields + auto-filter pre-hooks + softDelete()/restore() methods)
BrandSchema.plugin(softDeletePlugin);

BrandSchema.pre('validate', function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
  const mutableDoc = this as any;
  applyCatalogGovernanceDefaults(mutableDoc);

  if (!mutableDoc.approvalStatus) {
    mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
  }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
BrandSchema.plugin(installSafeSoftDeleteQuery);

// 🚀 CORE INDEXES (Aligned with Atlas ground truth in migrations)
BrandSchema.index({ categoryIds: 1 }, { name: 'idx_brand_categoryIds_idx' })
BrandSchema.index({ status: 1 }, { name: 'idx_brand_status_idx' })
BrandSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_brand_approval_active_idx' })
BrandSchema.index({ name: 1 }, { name: 'idx_brand_name', collation: { locale: 'en', strength: 2 } })
BrandSchema.index({ isDeleted: 1 }, { name: 'idx_brand_isDeleted_idx' })
BrandSchema.index({ 'marketplaceTrust.catalogTrustScore': -1 }, { name: 'idx_brand_marketplaceTrust_catalog' })
BrandSchema.index({ 'marketplaceTrust.seoQualityScore': -1, 'marketplaceTrust.indexable': 1 }, { name: 'idx_brand_marketplaceTrust_seo' })

BrandSchema.index(
  { canonicalName: 1 },
  {
    unique: true,
    name: 'idx_brand_canonicalName_unique',
    partialFilterExpression: {
      isDeleted: false,
      approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] }
    },
    collation: { locale: 'en', strength: 2 }
  }
)

BrandSchema.index(
  { categoryIds: 1, slug: 1 },
  {
    unique: true,
    name: 'idx_brand_categoryIds_slug_unique',
    partialFilterExpression: {
      isDeleted: false,
      approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] }
    }
  }
)

BrandSchema.index(
  { name: 1, categoryIds: 1 },
  { name: 'brand_name_categoryIds_text_idx', collation: { locale: 'en', strength: 2 } }
)
BrandSchema.index(
  { name: 'text', displayName: 'text', canonicalName: 'text', slug: 'text', aliases: 'text', synonyms: 'text' },
  {
    name: 'idx_brand_search_text_readiness',
    weights: { canonicalName: 10, displayName: 8, name: 8, slug: 6, aliases: 4, synonyms: 3 },
  }
)

import { getUserConnection } from '../infrastructure/db'

BrandSchema.pre('deleteOne',
  { document: true, query: false },
  async function(this: IBrand) {
    const Model = getUserConnection().model('Model')
    const count = await Model.countDocuments({
      brandId: this._id
    })
    if (count > 0) {
      throw new Error(
        'Cannot delete brand with dependent models'
      )
    }
  }
)

export const Brand: Model<IBrand> = (getUserConnection().models.Brand as Model<IBrand>) || getUserConnection().model<IBrand>('Brand', BrandSchema)
export default Brand
