import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedAd extends Document {
    userId: mongoose.Types.ObjectId;
    adId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const SavedAdSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

SavedAdSchema.index({ userId: 1, adId: 1 }, { name: 'idx_savedad_user_ad_unique_idx', unique: true });

// toJSON Transform - Convert _id to id
SavedAdSchema.set('toJSON', {
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
const SavedAd: Model<ISavedAd> = getUserConnection().models.SavedAd || getUserConnection().model<ISavedAd>('SavedAd', SavedAdSchema);

export default SavedAd;
