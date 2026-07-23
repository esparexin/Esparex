// core/src/models/CreditRule.ts
import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface ICreditRule {
    categoryId?: Types.ObjectId;
    locationId?: Types.ObjectId;
    userRole?: 'normal' | 'business' | 'all';
    requiredCredits: number;
    description?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CreditRuleSchema = new Schema<ICreditRule>(
    {
        categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
        locationId: { type: Schema.Types.ObjectId, ref: "Location" },
        userRole: { type: String, enum: ['normal', 'business', 'all'], default: 'all' },
        requiredCredits: { type: Number, required: true, default: 1, min: 0 },
        description: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CreditRuleSchema.index({ categoryId: 1, locationId: 1, userRole: 1 }, { name: 'idx_creditrule_cat_loc_role_idx' });
CreditRuleSchema.index({ active: 1 }, { name: 'idx_creditrule_active_idx' });

const connection = getUserConnection();
export const CreditRule: Model<ICreditRule> =
    (connection.models.CreditRule as Model<ICreditRule>) ||
    connection.model<ICreditRule>("CreditRule", CreditRuleSchema);
applyToJSONTransform(CreditRuleSchema);

export default CreditRule;
