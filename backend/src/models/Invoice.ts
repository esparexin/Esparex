// backend/src/models/Invoice.ts
import { Schema, Document, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import type { Model } from "mongoose";
import { PAYMENT_STATUS, PAYMENT_STATUS_VALUES, PaymentStatusValue } from "../../../shared/enums/paymentStatus";

export interface IInvoice extends Document {
    invoiceNumber: string;
    userId: Types.ObjectId | string;
    transactionId: Types.ObjectId | string;
    planSnapshot?: Record<string, unknown>;
    items?: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    isGstInvoice?: boolean;
    gstin?: string;
    sacCode?: string;
    billingAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    subtotal?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total?: number;
    amount: number;
    currency: string;
    status: PaymentStatusValue;
    tax: {
        gst: number;
        total: number;
    };
    pdfUrl?: string;
    issuedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
    {
        invoiceNumber: { type: String, required: true },

        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },

        planSnapshot: { type: Schema.Types.Mixed }, // Optional

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
            enum: PAYMENT_STATUS_VALUES,
            default: PAYMENT_STATUS.PENDING
        },

        tax: {
            gst: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },

        pdfUrl: { type: String }, // S3 / storage link
        issuedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

InvoiceSchema.index({ invoiceNumber: 1 }, { name: 'idx_invoice_number_unique_idx', unique: true });
InvoiceSchema.index({ userId: 1 }, { name: 'idx_invoice_userId_idx' });
InvoiceSchema.index({ transactionId: 1 }, { name: 'idx_invoice_transactionId_idx' });
InvoiceSchema.index({ status: 1 }, { name: 'idx_invoice_status_idx' });
InvoiceSchema.index({ createdAt: -1 }, { name: 'idx_invoice_createdAt_idx' });
InvoiceSchema.index({ issuedAt: -1 }, { name: 'idx_invoice_issuedAt_idx' });

const connection = getUserConnection();
export const Invoice: Model<IInvoice> =
    (connection.models.Invoice as Model<IInvoice>) ||
    connection.model<IInvoice>("Invoice", InvoiceSchema);
// toJSON Transform - Convert _id to id
InvoiceSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        return json;
    }
});

export default Invoice;
