// backend/src/models/Plan.ts
import { Schema, Document } from "mongoose";
import { getUserConnection } from "../config/db";
import type { Model } from "mongoose";

export interface IPlan extends Document {
    code: string;
    name: string;
    description?: string;
    type: "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT";
    userType: "normal" | "business" | "both";
    durationDays?: number; // 0 or null = infinite

    // Core Limits
    limits?: {
        maxAds?: number;
        maxServices?: number;
        maxParts?: number;
        smartAlerts?: number;
        spotlightCredits?: number;
    };

    // Boolean Features
    features?: {
        priorityWeight?: number;
        businessBadge?: boolean;
        canEditAd?: boolean;
        showOnHomePage?: boolean;
    };

    // Specific Configs
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: 'instant' | 'hourly' | 'daily';
        radiusLimitKm: number;
        notificationChannels: string[];
    };

    credits: number;
    price: number;
    currency: string;
    active: boolean;
    isDefault?: boolean; // For free plans
    createdByAdmin: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
    {
        code: { type: String, required: true }, // AD_PACK_5, SPOTLIGHT_1
        name: { type: String, required: true },
        description: { type: String },

        type: {
            type: String,
            enum: ["AD_PACK", "SPOTLIGHT", "SMART_ALERT"],
            required: true
        },

        userType: {
            type: String,
            enum: ["normal", "business", "both"],
            default: "both"
        },

        durationDays: { type: Number, default: 30 }, // Default 30 days

        limits: {
            maxAds: { type: Number, default: 0 },
            maxServices: { type: Number, default: 0 },
            maxParts: { type: Number, default: 0 },
            smartAlerts: { type: Number, default: 0 },
            spotlightCredits: { type: Number, default: 0 }
        },

        features: {
            priorityWeight: { type: Number, default: 1 },
            businessBadge: { type: Boolean, default: false },
            canEditAd: { type: Boolean, default: true },
            showOnHomePage: { type: Boolean, default: false }
        },

        smartAlertConfig: {
            maxAlerts: Number,
            matchFrequency: { type: String, enum: ['instant', 'hourly', 'daily'] },
            radiusLimitKm: Number,
            notificationChannels: [String]
        },

        credits: { type: Number, default: 0 }, // Legacy/Fallback
        price: { type: Number, required: true }, // final payable amount
        currency: { type: String, default: "INR" },

        active: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },

        createdByAdmin: { type: Schema.Types.ObjectId, ref: "User" }, // Refers back to an admin user
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

PlanSchema.index({ code: 1 }, { name: 'plan_code_unique_idx', unique: true });
PlanSchema.index({ type: 1 }, { name: 'plan_type_idx' });
PlanSchema.index({ createdByAdmin: 1 }, { name: 'plan_createdByAdmin_idx' });

const connection = getUserConnection();
export const Plan: Model<IPlan> =
    (connection.models.Plan as Model<IPlan>) ||
    connection.model<IPlan>("Plan", PlanSchema);
// toJSON Transform - Convert _id to id
PlanSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default Plan;
