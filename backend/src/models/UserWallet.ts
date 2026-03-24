// backend/src/models/UserWallet.ts
import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";

export interface IUserWallet {
    userId: Types.ObjectId;
    adCredits: number;
    monthlyFreeAdsUsed: number;
    spotlightCredits: number;
    smartAlertSlots: number;
    consumedSlots?: Types.ObjectId[];
    lastMonthlyReset?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserWalletSchema = new Schema<IUserWallet>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

        adCredits: { type: Number, default: 0 }, // never expires
        monthlyFreeAdsUsed: { type: Number, default: 0 },
        spotlightCredits: { type: Number, default: 0 },
        smartAlertSlots: { type: Number, default: 2 }, // base free
        consumedSlots: [{ type: Schema.Types.ObjectId, ref: 'Ad' }],

        lastMonthlyReset: { type: Date }, // for free ad slots logic
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

UserWalletSchema.index({ userId: 1 }, { name: 'idx_userwallet_userId_unique_idx', unique: true });

const connection = getUserConnection();
const UserWallet: Model<IUserWallet> = (connection.models.UserWallet as Model<IUserWallet>) ||
    connection.model<IUserWallet>("UserWallet", UserWalletSchema);
// toJSON Transform - Convert _id to id
UserWalletSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as unknown as { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default UserWallet;
