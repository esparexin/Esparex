"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminProfileById = exports.updateAdminLastLogin = exports.findAdminForLogin = exports.findAdminByResetToken = exports.findAdminByEmailForAuth = exports.saveAdmin = exports.getAdminWithTwoFactor = exports.getAuditLogs = exports.loginAdmin = exports.seedAdmin = void 0;
const Admin_1 = __importDefault(require("@core/models/Admin"));
const AdminLog_1 = __importDefault(require("@core/models/AdminLog"));
const auth_1 = require("@core/utils/auth");
const userStatus_1 = require("@core/constants/enums/userStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
const AppError_1 = require("@core/utils/AppError");
const env_1 = require("@core/config/env");
const stringUtils_1 = require("@core/utils/stringUtils");
const seedAdmin = async (email) => {
    // Explicit local bootstrap only. Never seed defaults in production/CI.
    const canSeedDefaultAdmin = env_1.env.NODE_ENV === 'development' &&
        !env_1.env.CI &&
        env_1.env.ALLOW_DEFAULT_ADMIN_SEED;
    if (!canSeedDefaultAdmin)
        return;
    if (email !== 'admin@esparex.com')
        return;
    // 🛡️ GOVERNANCE: Ensure we are using the Admin DB connection
    const adminConn = Admin_1.default.db;
    const isCorrectDb = adminConn.name === 'esparex_admin' || !env_1.env.ADMIN_MONGODB_URI;
    if (!isCorrectDb) {
        logger_1.default.error('❌ SEED FAILURE: Admin model is bound to incorrect database', {
            expected: 'esparex_admin',
            actual: adminConn.name
        });
        return;
    }
    const adminExists = await Admin_1.default.findOne({ email });
    if (adminExists) {
        // 🔄 AUTO-CORRECTION: If admin exists but is not LIVE (e.g. legacy "active" status), fix it.
        if (adminExists.status !== userStatus_1.USER_STATUS.LIVE) {
            logger_1.default.warn(`Admin ${email} found with status ${adminExists.status}. Auto-correcting to LIVE.`);
            adminExists.status = userStatus_1.USER_STATUS.LIVE;
            await adminExists.save();
            logger_1.default.info(`✅ Admin ${email} lifecycle stabilized (status: LIVE).`);
        }
        return;
    }
    logger_1.default.warn('Seeding default admin account because ALLOW_DEFAULT_ADMIN_SEED=true');
    await Admin_1.default.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@esparex.com',
        password: 'Admin@123',
        role: 'super_admin',
        status: userStatus_1.USER_STATUS.LIVE
    });
    logger_1.default.info(`✅ Seeded new Super Admin: ${email}`);
};
exports.seedAdmin = seedAdmin;
const loginAdmin = async (email, password) => {
    await (0, exports.seedAdmin)(email);
    const admin = await Admin_1.default.findOne({ email }).select('+password');
    let isMatch = false;
    if (admin) {
        if (admin.status !== userStatus_1.USER_STATUS.LIVE) {
            throw new AppError_1.AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
        }
        if (admin.password) {
            isMatch = await (0, auth_1.comparePassword)(password, admin.password);
        }
    }
    if (!admin || !isMatch) {
        return null; // Invalid credentials
    }
    admin.lastLogin = new Date();
    await admin.save();
    const token = (0, auth_1.generateAdminToken)({ id: admin._id, role: admin.role });
    const adminObj = admin.toObject({ virtuals: true });
    delete adminObj.password;
    return { token, admin: adminObj };
};
exports.loginAdmin = loginAdmin;
const getAuditLogs = async (filters, skip, limit) => {
    const query = {};
    if (filters.action)
        query.action = filters.action;
    if (filters.targetType)
        query.targetType = filters.targetType;
    if (filters.adminId)
        query.adminId = filters.adminId;
    if (filters.requestId)
        query['metadata.requestId'] = filters.requestId;
    if (filters.correlationId)
        query['metadata.correlationId'] = filters.correlationId;
    const normalizedQuery = typeof filters.q === 'string' ? filters.q.trim() : '';
    if (normalizedQuery) {
        const safeSearch = (0, stringUtils_1.escapeRegExp)(normalizedQuery);
        const adminMatches = await Admin_1.default.find({
            $or: [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ],
        }).select('_id').limit(50).lean();
        const searchConditions = [
            { action: { $regex: safeSearch, $options: 'i' } },
            { targetType: { $regex: safeSearch, $options: 'i' } },
            { targetId: { $regex: safeSearch, $options: 'i' } },
            { ipAddress: { $regex: safeSearch, $options: 'i' } },
            { userAgent: { $regex: safeSearch, $options: 'i' } },
            { 'metadata.requestId': { $regex: safeSearch, $options: 'i' } },
            { 'metadata.correlationId': { $regex: safeSearch, $options: 'i' } },
        ];
        if (adminMatches.length > 0) {
            searchConditions.push({ adminId: { $in: adminMatches.map((admin) => admin._id) } });
        }
        query.$and = [
            ...(Array.isArray(query.$and) ? query.$and : []),
            { $or: searchConditions },
        ];
    }
    const [logs, total] = await Promise.all([
        AdminLog_1.default.find(query)
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'firstName lastName email')
            .sort({ createdAt: -1 }),
        AdminLog_1.default.countDocuments(query),
    ]);
    return { logs, total };
};
exports.getAuditLogs = getAuditLogs;
const getAdminWithTwoFactor = async (adminId) => {
    return Admin_1.default.findById(adminId).select('+twoFactorSecret +twoFactorEnabled');
};
exports.getAdminWithTwoFactor = getAdminWithTwoFactor;
const saveAdmin = async (admin) => {
    return admin.save();
};
exports.saveAdmin = saveAdmin;
const findAdminByEmailForAuth = async (email) => {
    return Admin_1.default.findOne({ email });
};
exports.findAdminByEmailForAuth = findAdminByEmailForAuth;
const findAdminByResetToken = async (resetPasswordToken) => {
    return Admin_1.default.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
};
exports.findAdminByResetToken = findAdminByResetToken;
const findAdminForLogin = async (email) => {
    return Admin_1.default.findOne({ email }).select('+password +twoFactorSecret');
};
exports.findAdminForLogin = findAdminForLogin;
const updateAdminLastLogin = async (id) => {
    return Admin_1.default.updateOne({ _id: id }, { $set: { lastLogin: new Date() } });
};
exports.updateAdminLastLogin = updateAdminLastLogin;
const getAdminProfileById = async (adminId) => {
    return Admin_1.default.findById(adminId).lean();
};
exports.getAdminProfileById = getAdminProfileById;
//# sourceMappingURL=AdminService.js.map