import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

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

BlockedUserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    },
});

const BlockedUser: Model<IBlockedUser> =
    (getUserConnection().models.BlockedUser as Model<IBlockedUser>) ||
    getUserConnection().model<IBlockedUser>('BlockedUser', BlockedUserSchema);

export default BlockedUser;
