import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IAdImage extends Document {
    adId: mongoose.Types.ObjectId;
    imageUrl: string;
    thumbnailUrl?: string;
    imageHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const AdImageSchema: Schema = new Schema({
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    imageHash: { type: String, required: true },
}, {
    timestamps: true
});

// CRITICAL: Prevent duplicate images per Ad at the database level
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdImageSchema.index({ adId: 1 }, { name: 'idx_adimage_adId_idx' });
AdImageSchema.index({ imageHash: 1 }, { name: 'idx_adimage_imageHash_idx' });
AdImageSchema.index({ adId: 1, imageHash: 1 }, { name: 'idx_adimage_adId_hash_unique_idx', unique: true });

const AdImage: Model<IAdImage> = (getUserConnection().models.AdImage as Model<IAdImage> | undefined) || getUserConnection().model<IAdImage>('AdImage', AdImageSchema);

export default AdImage;
