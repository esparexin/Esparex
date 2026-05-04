"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plan = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const PlanSchema = new mongoose_1.Schema({
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
    createdByAdmin: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, // Refers back to an admin user
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
PlanSchema.index({ code: 1 }, { name: 'idx_plan_code_unique_idx', unique: true });
PlanSchema.index({ type: 1 }, { name: 'idx_plan_type_idx' });
PlanSchema.index({ createdByAdmin: 1 }, { name: 'idx_plan_createdByAdmin_idx' });
const connection = (0, db_1.getUserConnection)();
exports.Plan = connection.models.Plan ||
    connection.model("Plan", PlanSchema);
(0, schemaOptions_1.applyToJSONTransform)(PlanSchema);
exports.default = exports.Plan;
//# sourceMappingURL=Plan.js.map