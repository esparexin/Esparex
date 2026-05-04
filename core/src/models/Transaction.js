"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
// core/src/models/Transaction.ts
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const paymentStatus_1 = require("@core/constants/enums/paymentStatus");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const TransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Plan" }, // Optional for custom billing
    planSnapshot: {
        code: { type: String },
        name: { type: String },
        type: { type: String },
        credits: { type: Number },
        durationDays: { type: Number },
        limits: { type: mongoose_1.Schema.Types.Mixed },
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
        enum: paymentStatus_1.PAYMENT_STATUS_VALUES,
        default: paymentStatus_1.PAYMENT_STATUS.INITIATED
    },
    applied: { type: Boolean, default: false }, // CRITICAL idempotency flag
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
TransactionSchema.index({ userId: 1 }, { name: 'idx_transaction_userId_idx' });
TransactionSchema.index({ planId: 1 }, { name: 'idx_transaction_planId_idx' });
TransactionSchema.index({ gatewayPaymentId: 1 }, { name: 'idx_transaction_gatewayPaymentId_unique_idx', unique: true, sparse: true });
TransactionSchema.index({ gatewayOrderId: 1, applied: 1 }, { name: 'idx_transaction_gatewayOrderId_applied_idx' });
TransactionSchema.index({ status: 1 }, { name: 'idx_transaction_status_idx' });
TransactionSchema.index({ status: 1, createdAt: 1 }, { name: 'idx_transaction_status_createdAt_idx' });
TransactionSchema.index({ createdAt: -1 }, { name: 'idx_transaction_createdAt_idx' });
const connection = (0, db_1.getUserConnection)();
exports.Transaction = connection.models.Transaction ||
    connection.model("Transaction", TransactionSchema);
(0, schemaOptions_1.applyToJSONTransform)(TransactionSchema);
exports.default = exports.Transaction;
//# sourceMappingURL=Transaction.js.map