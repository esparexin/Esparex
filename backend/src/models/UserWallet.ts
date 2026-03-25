// backend/src/models/UserWallet.ts
import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import { applyToJSONTransform } from '../utils/schemaOptions';

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
applyToJSONTransform(UserWalletSchema);

export default UserWallet;
