import mongoose, { Model, Types } from "mongoose";
import { getUserConnection } from '../config/db';

export interface IUserPlan {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    startDate?: Date;
    endDate?: Date | null;
    status?: 'active' | 'expired' | 'suspended';
}

const UserPlanSchema = new mongoose.Schema<IUserPlan>({
    userId: mongoose.Types.ObjectId,
    planId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    status: {
        type: String,
        enum: ["active", "expired", "suspended"]
    }
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

UserPlanSchema.index({ userId: 1 }, { name: 'userplan_userId_idx' });
UserPlanSchema.index({ planId: 1 }, { name: 'userplan_planId_idx' });
UserPlanSchema.index({ status: 1 }, { name: 'userplan_status_idx' });

const connection = getUserConnection();
const UserPlan: Model<IUserPlan> =
    (connection.models.UserPlan as Model<IUserPlan>) ||
    connection.model<IUserPlan>("UserPlan", UserPlanSchema);

// toJSON Transform - Convert _id to id
UserPlanSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default UserPlan;
