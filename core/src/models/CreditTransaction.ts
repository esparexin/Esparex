// core/src/models/CreditTransaction.ts
import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import { applyToJSONTransform } from '../utils/schemaOptions';

export type CreditPoolType = 'PROMOTIONAL' | 'MONTHLY_FREE' | 'PURCHASED' | 'SUBSCRIPTION';
export type CreditActionType = 'CREDIT' | 'DEBIT' | 'EXPIRE' | 'RESET';

export interface ICreditTransaction {
    userId: Types.ObjectId;
    listingId?: Types.ObjectId;
    creditPool: CreditPoolType;
    amount: number;
    type: CreditActionType;
    reason: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        listingId: { type: Schema.Types.ObjectId, ref: "Ad" },
        creditPool: {
            type: String,
            enum: ['PROMOTIONAL', 'MONTHLY_FREE', 'PURCHASED', 'SUBSCRIPTION'],
            required: true
        },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ['CREDIT', 'DEBIT', 'EXPIRE', 'RESET'],
            required: true
        },
        reason: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CreditTransactionSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_credittransaction_user_created_idx' });
CreditTransactionSchema.index({ listingId: 1 }, { name: 'idx_credittransaction_listing_idx', sparse: true });

const connection = getUserConnection();
export const CreditTransaction: Model<ICreditTransaction> =
    (connection.models.CreditTransaction as Model<ICreditTransaction>) ||
    connection.model<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
applyToJSONTransform(CreditTransactionSchema);

export default CreditTransaction;
