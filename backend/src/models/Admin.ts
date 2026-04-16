import { Schema, Document, Model } from "mongoose";
import { getAdminConnection } from "../config/db";
import softDeletePlugin from '../utils/softDeletePlugin';
import bcrypt from 'bcryptjs';
import { USER_STATUS, USER_STATUS_VALUES, UserStatusValue } from "@shared/enums/userStatus";
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IAdmin extends Document {
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    password?: string;
    role: "super_admin" | "admin" | "moderator" | "user_manager" | "finance_manager" | "content_moderator" | "editor" | "viewer" | "custom";
    permissions: string[];
    lastLogin?: Date;
    status: UserStatusValue;
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    twoFactorSecret?: string;
    twoFactorEnabled?: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const AdminSchema = new Schema<IAdmin>(
    {
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
            enum: USER_STATUS_VALUES,
            default: USER_STATUS.ACTIVE
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
    },
    { timestamps: true }
);

// Apply soft-delete plugin
AdminSchema.plugin(softDeletePlugin);

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
AdminSchema.pre('save', async function (this: IAdmin) {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
});

AdminSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

applyToJSONTransform(AdminSchema);

// Prevent recompilation in dev
const Admin: Model<IAdmin> =
    (getAdminConnection().models.Admin as Model<IAdmin> | undefined) ||
    getAdminConnection().model<IAdmin>("Admin", AdminSchema);

export default Admin;
