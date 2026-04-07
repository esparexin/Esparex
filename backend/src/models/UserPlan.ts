import mongoose, { Model, Types } from "mongoose";
import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IUserPlan {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    startDate?: Date;
    endDate?: Date | null;
    status?: 'active' | 'expired' | 'suspended';
}

const UserPlanSchema = new mongoose.Schema<IUserPlan>({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    planId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Plan' },
    startDate: { type: Date, required: true },
    endDate: Date,
    status: {
        type: String,
        enum: ["active", "expired", "suspended"],
        default: 'active'
    }
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

UserPlanSchema.index({ userId: 1 }, { name: 'idx_userplan_userId_idx' });
UserPlanSchema.index({ planId: 1 }, { name: 'idx_userplan_planId_idx' });
UserPlanSchema.index({ status: 1 }, { name: 'idx_userplan_status_idx' });
UserPlanSchema.index({ userId: 1, status: 1 }, { name: 'idx_userplan_userId_status_compound' });

const connection = getUserConnection();
const UserPlan: Model<IUserPlan> =
    (connection.models.UserPlan as Model<IUserPlan>) ||
    connection.model<IUserPlan>("UserPlan", UserPlanSchema);

applyToJSONTransform(UserPlanSchema);

export default UserPlan;
