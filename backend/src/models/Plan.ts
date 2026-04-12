import { Schema, Document } from "mongoose";
import { getUserConnection } from "../config/db";
import type { Model } from "mongoose";
import { applyToJSONTransform } from '../utils/schemaOptions';
import type { Plan as SharedPlan } from "@shared/types/Plan";

export interface IPlan extends Document, Omit<SharedPlan, "id" | "createdAt" | "updatedAt"> {
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
            maxAlerts: { type: Number, min: 0, default: 0 },
            matchFrequency: { type: String, enum: ['realtime', 'hourly', 'daily'], default: 'daily' },
            radiusLimitKm: { type: Number, min: 0, default: 50 },
            notificationChannels: { type: [String], default: [] }
        },

        /**
         * @deprecated Legacy field kept for backward compatibility with old plans.
         * New plans use `limits` (maxAds, spotlightCredits, smartAlerts).
         * Used as a fallback in planEntitlements.ts via getPrimaryPlanCreditCount().
         * Do NOT remove — old UserPlan records may reference plans that only have this field.
         */
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

PlanSchema.index({ code: 1 }, { name: 'idx_plan_code_unique_idx', unique: true });
PlanSchema.index({ type: 1 }, { name: 'idx_plan_type_idx' });
PlanSchema.index({ createdByAdmin: 1 }, { name: 'idx_plan_createdByAdmin_idx' });

const connection = getUserConnection();
export const Plan: Model<IPlan> =
    (connection.models.Plan as Model<IPlan>) ||
    connection.model<IPlan>("Plan", PlanSchema);
applyToJSONTransform(PlanSchema);

export default Plan;
