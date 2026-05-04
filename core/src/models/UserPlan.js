"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const UserPlanSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true, ref: 'User' },
    planId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true, ref: 'Plan' },
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
const connection = (0, db_1.getUserConnection)();
const UserPlan = connection.models.UserPlan ||
    connection.model("UserPlan", UserPlanSchema);
(0, schemaOptions_1.applyToJSONTransform)(UserPlanSchema);
exports.default = UserPlan;
//# sourceMappingURL=UserPlan.js.map