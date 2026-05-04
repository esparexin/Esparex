"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userStatus_1 = require("@core/constants/enums/userStatus");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const AdminSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    mobile: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: [
            "super_admin",
            "admin",
            "moderator",
            "user_manager",
            "finance_manager",
            "content_moderator",
            "editor",
            "viewer",
            "custom"
        ],
        default: "viewer",
    },
    permissions: {
        type: [String],
        default: [],
    },
    lastLogin: { type: Date },
    status: {
        type: String,
        enum: userStatus_1.USER_STATUS_VALUES,
        default: userStatus_1.USER_STATUS.LIVE
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    twoFactorSecret: {
        type: String,
        select: false,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
// Apply soft-delete plugin
AdminSchema.plugin(softDeletePlugin_1.default);
// Compound Index for Search Opt
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdminSchema.index({ email: 1 }, { name: 'idx_admin_email_unique', unique: true });
AdminSchema.index({ mobile: 1 }, { name: 'idx_admin_mobile_unique', unique: true, sparse: true });
AdminSchema.index({ status: 1 }, { name: 'idx_admin_status' });
AdminSchema.index({ role: 1, status: 1 }, { name: 'idx_admin_role_status' });
AdminSchema.index({ isDeleted: 1 }, { name: 'idx_admin_isDeleted' });
// 🔒 SECURITY: Hash password before saving
AdminSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
AdminSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});
(0, schemaOptions_1.applyToJSONTransform)(AdminSchema);
// Prevent recompilation in dev
const Admin = (0, db_1.getAdminConnection)().models.Admin ||
    (0, db_1.getAdminConnection)().model("Admin", AdminSchema);
exports.default = Admin;
//# sourceMappingURL=Admin.js.map