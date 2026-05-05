import mongoose, { Schema, Document, Model } from 'mongoose';
import { applyToJSONTransform } from '../utils/schemaOptions';

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

// Covers getSavedAds sorted pagination: find({ userId }).sort({ createdAt: -1 })
SavedAdSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_savedad_userId_createdAt_desc' });

applyToJSONTransform(SavedAdSchema);

import { getUserConnection } from '../config/db';
const SavedAd: Model<ISavedAd> = (getUserConnection().models.SavedAd as Model<ISavedAd> | undefined) || getUserConnection().model<ISavedAd>('SavedAd', SavedAdSchema);

export default SavedAd;
