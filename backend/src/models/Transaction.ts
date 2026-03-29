// backend/src/models/Transaction.ts
import { Schema, Document, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import type { Model } from "mongoose";
import { PAYMENT_STATUS, PAYMENT_STATUS_VALUES, PaymentStatusValue } from "../../../shared/enums/paymentStatus";
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface ITransaction extends Document {
    userId: Types.ObjectId | string;
    planId?: Types.ObjectId | string;
    planSnapshot?: {
        code: string;
        name: string;
        type: string;
        credits: number;
        durationDays?: number;
        limits?: {
            maxAds?: number;
            maxServices?: number;
            maxParts?: number;
            smartAlerts?: number;
            spotlightCredits?: number;
        };
        price: number;
        currency: string;
    };
    description?: string; // For custom transactions
    paymentGateway?: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    amount: number;
    currency: string;
    status: PaymentStatusValue;
    applied: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

        planId: { type: Schema.Types.ObjectId, ref: "Plan" }, // Optional for custom billing
        planSnapshot: {
            code: { type: String },
            name: { type: String },
            type: { type: String },
            credits: { type: Number },
            durationDays: { type: Number },
            limits: { type: Schema.Types.Mixed },
            price: { type: Number },
            currency: { type: String },
        },
        description: { type: String },

        paymentGateway: { type: String }, // razorpay / stripe / cashfree
        gatewayPaymentId: { type: String },
        gatewayOrderId: { type: String },

        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },

        status: {
            type: String,
            enum: PAYMENT_STATUS_VALUES,
            default: PAYMENT_STATUS.INITIATED
        },

        applied: { type: Boolean, default: false }, // CRITICAL idempotency flag
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

TransactionSchema.index({ userId: 1 }, { name: 'idx_transaction_userId_idx' });
TransactionSchema.index({ planId: 1 }, { name: 'idx_transaction_planId_idx' });
TransactionSchema.index({ gatewayPaymentId: 1 }, { name: 'idx_transaction_gatewayPaymentId_unique_idx', unique: true, sparse: true });
TransactionSchema.index({ gatewayOrderId: 1 }, { name: 'idx_transaction_gatewayOrderId_idx' });
TransactionSchema.index({ status: 1 }, { name: 'idx_transaction_status_idx' });
TransactionSchema.index({ status: 1, createdAt: 1 }, { name: 'idx_transaction_status_createdAt_idx' });
TransactionSchema.index({ createdAt: -1 }, { name: 'idx_transaction_createdAt_idx' });

const connection = getUserConnection();
export const Transaction: Model<ITransaction> =
    (connection.models.Transaction as Model<ITransaction>) ||
    connection.model<ITransaction>("Transaction", TransactionSchema);
applyToJSONTransform(TransactionSchema);

export default Transaction;
