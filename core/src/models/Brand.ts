import { Schema, Document, Types, Model } from 'mongoose'
import { ISoftDeleteDocument } from '../utils/softDeletePlugin'
import softDeletePlugin from '../utils/softDeletePlugin'
import { CATALOG_STATUS } from '../constants/enums/catalogStatus'
import {
  TAXONOMY_APPROVAL_STATUS,
  TAXONOMY_APPROVAL_STATUS_VALUES,
  TaxonomyApprovalStatusValue,
} from '../constants/enums/taxonomyApprovalStatus'
import {
  applyTaxonomyNamingDefaults,
} from '../services/catalog/taxonomySsot'
import { applyTaxonomyLifecycleFields, taxonomyEntityToJsonTransform } from './taxonomyLifecycle';
import { TaxonomyAiAnalysisSchema, TaxonomyAiDecisionSchema } from './taxonomyAiSchema';

export interface IBrand extends Document, ISoftDeleteDocument {
  name: string
  displayName: string
  canonicalName: string
  slug: string
  aliases: string[]
  synonyms: string[]
  categoryId?: Types.ObjectId
  categoryIds: Types.ObjectId[]
  isActive: boolean
  approvalStatus: TaxonomyApprovalStatusValue
  status: string
  suggestedBy?: Types.ObjectId
  rejectionReason?: string
  needsReview?: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date;
  updatedAt: Date;
  aiAnalysis?: any;
  aiDecision?: any;
}


const BrandSchema = new Schema<IBrand>({
  name: { type: String, required: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  canonicalName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  aliases: { type: [String], default: [] },
  synonyms: { type: [String], default: [] },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  approvalStatus: {
    type: String,
    enum: TAXONOMY_APPROVAL_STATUS_VALUES,
    default: TAXONOMY_APPROVAL_STATUS.APPROVED,
  },
  status: { type: String, enum: Object.values(CATALOG_STATUS), default: CATALOG_STATUS.ACTIVE },
  suggestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  needsReview: { type: Boolean, default: false },
  aiAnalysis: { type: TaxonomyAiAnalysisSchema },
  aiDecision: { type: TaxonomyAiDecisionSchema },
  // isDeleted and deletedAt are injected by softDeletePlugin below
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: taxonomyEntityToJsonTransform
  },
  toObject: { virtuals: true, versionKey: false }
})

// Apply soft-delete plugin (adds isDeleted, deletedAt fields + auto-filter pre-hooks + softDelete()/restore() methods)
BrandSchema.plugin(softDeletePlugin);

BrandSchema.pre('validate', function () {
  const mutableDoc = this as any;
  applyTaxonomyNamingDefaults(mutableDoc);
  applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
  mutableDoc.name = mutableDoc.displayName;

  // Enforce bidirectional singular/plural category synchronization
  if (mutableDoc.categoryId && (!mutableDoc.categoryIds || mutableDoc.categoryIds.length === 0)) {
    mutableDoc.categoryIds = [mutableDoc.categoryId];
  } else if ((!mutableDoc.categoryId || mutableDoc.categoryId === null) && mutableDoc.categoryIds && mutableDoc.categoryIds.length > 0) {
    mutableDoc.categoryId = mutableDoc.categoryIds[0];
  }
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
BrandSchema.plugin(installSafeSoftDeleteQuery);

// 🚀 CORE INDEXES (Aligned with Atlas ground truth in migrations)
BrandSchema.index({ categoryIds: 1 }, { name: 'idx_brand_categoryIds_idx' })
BrandSchema.index({ status: 1 }, { name: 'idx_brand_status_idx' })
BrandSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_brand_approval_active_idx' })
BrandSchema.index({ isDeleted: 1 }, { name: 'idx_brand_isDeleted_idx' })

BrandSchema.index(
  { canonicalName: 1 },
  {
    unique: true,
    name: 'idx_brand_canonicalName_unique',
    partialFilterExpression: {
      isDeleted: false,
      approvalStatus: { $in: [TAXONOMY_APPROVAL_STATUS.APPROVED, TAXONOMY_APPROVAL_STATUS.PENDING] }
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
      approvalStatus: { $in: [TAXONOMY_APPROVAL_STATUS.APPROVED, TAXONOMY_APPROVAL_STATUS.PENDING] }
    }
  }
)

/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - brand_name_categoryId_text_idx: { name: 1, categoryId: 1 } (Collation: {locale: 'en', strength: 2})
 */

import { getUserConnection } from '../config/db'

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
