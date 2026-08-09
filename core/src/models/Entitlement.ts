import mongoose, { Schema, Document } from 'mongoose';
import type { EntitlementType, EntitlementSourceType, EntitlementStatus } from '@esparex/contracts';

export interface IEntitlement extends Document {
    userId: mongoose.Types.ObjectId;
    type: EntitlementType;
    sourceType: EntitlementSourceType;
    sourceId: mongoose.Types.ObjectId;
    quantity: number;
    consumed: number;
    remaining: number;
    startsAt: Date;
    expiresAt?: Date | null;
    status: EntitlementStatus;
    createdAt: Date;
    updatedAt: Date;
}

const EntitlementSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['AD_POSTING', 'SPOTLIGHT_HP', 'SPOTLIGHT_CAT', 'PUSH_TO_TOP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE'],
            required: true,
        },
        sourceType: {
            type: String,
            enum: ['FREE_ALLOWANCE', 'PURCHASED_PACK', 'SUBSCRIPTION_TIER', 'PROMO_CAMPAIGN', 'REFERRAL'],
            required: true,
        },
        sourceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        consumed: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        remaining: {
            type: Number,
            required: true,
            min: 0,
        },
        startsAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACTIVE', 'EXHAUSTED', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
            required: true,
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

// Compound Indexes for fast entitlement resolution (Explicitly Named per Governance rules)
EntitlementSchema.index({ userId: 1, status: 1, type: 1 }, { name: 'idx_entitlement_userId_status_type' });
EntitlementSchema.index({ userId: 1, expiresAt: 1 }, { name: 'idx_entitlement_userId_expiresAt' });

export default mongoose.models.Entitlement || mongoose.model<IEntitlement>('Entitlement', EntitlementSchema);
