import { Schema, Document, Types, Model } from 'mongoose'
import { getUserConnection } from '../config/db'

export interface ISmartAlert extends Document {
  userId: Types.ObjectId
  name?: string
  criteria: {
    keywords?: string
    categoryId?: Types.ObjectId
    brandId?: Types.ObjectId
    modelId?: Types.ObjectId
    minPrice?: number
    maxPrice?: number
    condition?: string
  }
  coordinates?: {
    type: string
    coordinates: [number, number]
  }
  radiusKm?: number
  isActive: boolean
  notificationChannels?: string[]
  lastTriggeredAt?: Date
  expiresAt?: Date
}

const SmartAlertSchema = new Schema<ISmartAlert>({
  userId: { type: Schema.Types.ObjectId,
            ref: 'User', required: true },
  name: { type: String },
  criteria: {
    keywords: { type: String },
    categoryId: { type: Schema.Types.ObjectId,
                  ref: 'Category' },
    brandId: { type: Schema.Types.ObjectId,
               ref: 'Brand' },
    modelId: { type: Schema.Types.ObjectId,
               ref: 'Model' },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    condition: { type: String },
  },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] },
  },
  radiusKm: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  notificationChannels: [{ type: String }],
  lastTriggeredAt: { type: Date },
  expiresAt: { type: Date },
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

SmartAlertSchema.index({ userId: 1 }, { name: 'idx_smartalert_userId_idx' })
SmartAlertSchema.index({ coordinates: '2dsphere' }, { name: 'idx_smartalert_geo_2dsphere' })
SmartAlertSchema.index({ isActive: 1, expiresAt: 1 }, { name: 'idx_smartalert_user_active_idx' })

export const SmartAlert: Model<ISmartAlert> = (getUserConnection().models.SmartAlert as Model<ISmartAlert>) || getUserConnection().model<ISmartAlert>(
  'SmartAlert', SmartAlertSchema
)
export default SmartAlert
