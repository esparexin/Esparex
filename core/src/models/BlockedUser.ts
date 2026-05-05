import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IBlockedUser extends Document {
    blockerId: mongoose.Types.ObjectId;
    blockedId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BlockedUserSchema: Schema = new Schema(
    {
        blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

BlockedUserSchema.pre('validate', function () {
    if (
        this.blockerId &&
        this.blockedId &&
        String(this.blockerId) === String(this.blockedId)
    ) {
        throw new Error('Users cannot block themselves.');
    }
});

BlockedUserSchema.index(
    { blockerId: 1, blockedId: 1 },
    { unique: true, name: 'idx_blockeduser_blocker_blocked_unique_idx' }
);
BlockedUserSchema.index({ blockedId: 1 }, { name: 'idx_blockeduser_blocked_idx' });

applyToJSONTransform(BlockedUserSchema);

const BlockedUser: Model<IBlockedUser> =
    (getUserConnection().models.BlockedUser as Model<IBlockedUser>) ||
    getUserConnection().model<IBlockedUser>('BlockedUser', BlockedUserSchema);

export default BlockedUser;
