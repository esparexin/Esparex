"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
// core/src/models/Invoice.ts
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const paymentStatus_1 = require("@core/constants/enums/paymentStatus");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Transaction", required: true },
    planSnapshot: { type: mongoose_1.Schema.Types.Mixed }, // Optional
    items: [{
            description: String,
            quantity: Number,
            unitPrice: Number,
            total: Number
        }],
    isGstInvoice: { type: Boolean, default: false },
    gstin: { type: String },
    sacCode: { type: String, default: '998599' },
    billingAddress: {
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String, default: 'India' }
    },
    subtotal: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
        type: String,
        enum: paymentStatus_1.PAYMENT_STATUS_VALUES,
        default: paymentStatus_1.PAYMENT_STATUS.PENDING
    },
    tax: {
        gst: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    pdfUrl: { type: String }, // S3 / storage link
    issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
InvoiceSchema.index({ invoiceNumber: 1 }, { name: 'idx_invoice_number_unique_idx', unique: true });
InvoiceSchema.index({ userId: 1 }, { name: 'idx_invoice_userId_idx' });
InvoiceSchema.index({ transactionId: 1 }, { name: 'idx_invoice_transactionId_idx' });
InvoiceSchema.index({ status: 1 }, { name: 'idx_invoice_status_idx' });
InvoiceSchema.index({ createdAt: -1 }, { name: 'idx_invoice_createdAt_idx' });
InvoiceSchema.index({ issuedAt: -1 }, { name: 'idx_invoice_issuedAt_idx' });
const connection = (0, db_1.getUserConnection)();
exports.Invoice = connection.models.Invoice ||
    connection.model("Invoice", InvoiceSchema);
(0, schemaOptions_1.applyToJSONTransform)(InvoiceSchema);
exports.default = exports.Invoice;
//# sourceMappingURL=Invoice.js.map