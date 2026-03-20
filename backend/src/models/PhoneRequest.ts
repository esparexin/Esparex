import mongoose, { Schema, Document, Model } from 'mongoose';
import { REQUEST_STATUS, REQUEST_STATUS_VALUES } from '../../../shared/enums/requestStatus';

export interface IPhoneRequest extends Document {
    buyerId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    entityId: mongoose.Types.ObjectId; // Ad or Service
    entityType: 'ad' | 'service';
    status: (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
    createdAt: Date;
    updatedAt: Date;
}

const PhoneRequestSchema: Schema = new Schema({
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service'], required: true },
    status: {
        type: String,
        enum: REQUEST_STATUS_VALUES,
        default: REQUEST_STATUS.PENDING
    }
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

PhoneRequestSchema.index({ buyerId: 1 }, { name: 'phonereq_buyerId_idx' });
PhoneRequestSchema.index({ sellerId: 1 }, { name: 'phonereq_sellerId_idx' });
PhoneRequestSchema.index({ entityId: 1 }, { name: 'phonereq_entityId_idx' });
PhoneRequestSchema.index({ status: 1 }, { name: 'phonereq_status_idx' });
PhoneRequestSchema.index(
    { buyerId: 1, sellerId: 1, entityId: 1 }, 
    { name: 'phonereq_buyer_seller_entity_unique_idx', unique: true }
);

// toJSON Transform - Convert _id to id
PhoneRequestSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

import { getUserConnection } from '../config/db';
const PhoneRequest: Model<IPhoneRequest> = getUserConnection().models.PhoneRequest || getUserConnection().model<IPhoneRequest>('PhoneRequest', PhoneRequestSchema);

export default PhoneRequest;
