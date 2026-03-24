import { Schema, Document, Types, Model } from 'mongoose'
import { ISoftDeleteDocument } from '../utils/softDeletePlugin'
import softDeletePlugin from '../utils/softDeletePlugin'
import { CATALOG_STATUS } from '../../../shared/enums/catalogStatus'

export interface IBrand extends Document, ISoftDeleteDocument {
  name: string
  slug: string
  categoryIds: Types.ObjectId[]
  isActive: boolean
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
  name: { type: String, required: true },
  slug: { type: String, required: true },
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
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
    transform: function (_doc, ret) {
      const json = ret as Record<string, unknown>;
      json.id = String(json._id);
      delete json._id;
      return json;
    }
  },
  toObject: { virtuals: true, versionKey: false }
})

// Apply soft-delete plugin (adds isDeleted, deletedAt fields + auto-filter pre-hooks + softDelete()/restore() methods)
BrandSchema.plugin(softDeletePlugin);

// 🚀 CORE INDEXES (Aligned with Atlas ground truth in migrations)
BrandSchema.index({ categoryIds: 1 }, { name: 'idx_brand_categoryIds_idx' })
BrandSchema.index({ status: 1 }, { name: 'idx_brand_status_idx' })
BrandSchema.index({ isDeleted: 1 }, { name: 'idx_brand_isDeleted_idx' })

BrandSchema.index(
  { categoryIds: 1, name: 1 },
  {
    unique: true,
    name: 'idx_brand_categoryIds_name_unique',
    partialFilterExpression: {
      isDeleted: false,
      // 'live' is CATALOG_STATUS.ACTIVE; 'active' kept for legacy records
      status: { $in: ['live', 'active', 'pending'] }
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
      // 'live' is CATALOG_STATUS.ACTIVE; 'active' kept for legacy records
      status: { $in: ['live', 'active', 'pending'] }
    }
  }
)

/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - brand_name_categoryId_text_idx: { name: 1, categoryId: 1 } (Collation: {locale: 'en', strength: 2})
 */

import { getAdminConnection } from '../config/db'

BrandSchema.pre('deleteOne',
  { document: true, query: false },
  async function(this: IBrand) {
    const Model = getAdminConnection().model('Model')
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

export const Brand: Model<IBrand> = (getAdminConnection().models.Brand as Model<IBrand>) || getAdminConnection().model<IBrand>('Brand', BrandSchema)
export default Brand
