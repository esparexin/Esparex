import { Schema, Document, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

export type DuplicateEventAction = 'blocked' | 'flagged' | 'bypass_allowed';

export interface IDuplicateEvent extends Document {
    sellerId: Types.ObjectId;
    adId?: Types.ObjectId;
    matchedAdId?: Types.ObjectId;
    action: DuplicateEventAction;
    reason: string;
    score?: number;
    duplicateFingerprint?: string;
    details?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const DuplicateEventSchema = new Schema<IDuplicateEvent>(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        adId: { type: Schema.Types.ObjectId, ref: 'Ad' },
        matchedAdId: { type: Schema.Types.ObjectId, ref: 'Ad' },
        action: {
            type: String,
            enum: ['blocked', 'flagged', 'bypass_allowed'],
            required: true
        },
        reason: { type: String, required: true },
        score: { type: Number, min: 0, max: 100 },
        duplicateFingerprint: { type: String },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

DuplicateEventSchema.index({ sellerId: 1 }, { name: 'dupevent_sellerId_idx' });
DuplicateEventSchema.index({ action: 1 }, { name: 'dupevent_action_idx' });
DuplicateEventSchema.index({ duplicateFingerprint: 1 }, { name: 'dupevent_fingerprint_idx' });
DuplicateEventSchema.index({ createdAt: -1 }, { name: 'dupevent_createdAt_idx' });
DuplicateEventSchema.index({ sellerId: 1, createdAt: -1 }, { name: 'dupevent_seller_date_idx' });
DuplicateEventSchema.index({ action: 1, createdAt: -1 }, { name: 'dupevent_action_date_idx' });
DuplicateEventSchema.index({ adId: 1, createdAt: -1 }, { name: 'dupevent_adId_idx' });
DuplicateEventSchema.index({ matchedAdId: 1, createdAt: -1 }, { name: 'dupevent_matchedAdId_idx' });

const DuplicateEvent =
    getUserConnection().models.DuplicateEvent ||
    getUserConnection().model<IDuplicateEvent>('DuplicateEvent', DuplicateEventSchema);

export default DuplicateEvent;
