"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleAdminStatus = exports.deactivateAdminById = exports.softDeleteAdminById = exports.updateAdminById = exports.createAdminAccount = exports.findAdminByEmail = exports.isLastActiveSuperAdmin = exports.verifyUserById = exports.getUserByIdForAdmin = exports.getAdminByIdForAdmin = exports.getAdmins = exports.updateAdminUser = exports.createAdminUser = exports.getUserManagementOverview = exports.getUsers = exports.normalizeAdminManagedUser = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const Admin_1 = __importDefault(require("@core/models/Admin"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdminMetrics_1 = __importDefault(require("@core/models/AdminMetrics"));
const userStatus_1 = require("@core/constants/enums/userStatus");
const roles_1 = require("@core/constants/enums/roles");
const userStatus_2 = require("@esparex/shared/utils/userStatus");
const auth_1 = require("@core/utils/auth");
const AppError_1 = require("@core/utils/AppError");
const TrustService_1 = require("./TrustService");
const AdminSessionService_1 = require("./AdminSessionService");
const ACTIVE_USER_STATUS_QUERY = userStatus_1.USER_STATUS.LIVE;
const ADMIN_ROLE_RANK = {
    viewer: 10,
    editor: 20,
    content_moderator: 30,
    moderator: 40,
    finance_manager: 50,
    user_manager: 60,
    admin: 70,
    super_admin: 100
};
const ALLOWED_ADMIN_ROLES = new Set([
    roles_1.Role.SUPER_ADMIN,
    roles_1.Role.ADMIN,
    roles_1.Role.MODERATOR,
    'user_manager',
    'finance_manager',
    'content_moderator',
    'editor',
    'viewer',
    'custom'
]);
const getRoleRank = (role) => ADMIN_ROLE_RANK[role || ''] || 0;
const ensureRoleAssignmentAllowed = (actorRole, targetRole) => {
    if (!actorRole)
        return false;
    if (actorRole === roles_1.Role.SUPER_ADMIN)
        return true;
    return getRoleRank(targetRole) <= getRoleRank(actorRole);
};
const buildUserStatusFilter = (status) => {
    if (!status || status === 'all') {
        return undefined;
    }
    const normalizedStatus = (0, userStatus_2.normalizeUserStatus)(status);
    if (normalizedStatus === userStatus_1.USER_STATUS.LIVE) {
        return userStatus_1.USER_STATUS.LIVE;
    }
    return normalizedStatus ?? status;
};
const normalizeAdminManagedUser = (input) => {
    const inputWithToObject = input;
    const plain = typeof inputWithToObject.toObject === 'function' ? inputWithToObject.toObject() : { ...input };
    const normalizedStatus = (0, userStatus_2.normalizeUserStatus)(plain.status);
    if (normalizedStatus) {
        plain.status = normalizedStatus;
    }
    return plain;
};
exports.normalizeAdminManagedUser = normalizeAdminManagedUser;
/**
 * Service for advanced admin-only user management and metrics.
 */
const getUsers = async (filters = {}, pagination) => {
    const { search, status, role, isVerified } = filters;
    const { skip, limit } = pagination;
    const query = { status: { $ne: userStatus_1.USER_STATUS.DELETED } };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } }
        ];
    }
    const statusQuery = buildUserStatusFilter(status);
    if (statusQuery) {
        query.status = statusQuery;
    }
    if (role && role !== 'all') {
        query.role = role;
    }
    if (isVerified !== undefined) {
        query.isVerified = isVerified;
    }
    const [users, total] = await Promise.all([
        User_1.default.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User_1.default.countDocuments(query)
    ]);
    const userIds = users.map((user) => user._id);
    const adCounts = userIds.length > 0
        ? await Ad_1.default.aggregate([
            {
                $match: {
                    sellerId: { $in: userIds },
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: '$sellerId',
                    totalAdsPosted: { $sum: 1 }
                }
            }
        ])
        : [];
    const adsByUserId = new Map(adCounts.map((entry) => [String(entry._id), Number(entry.totalAdsPosted) || 0]));
    const usersWithStats = users.map((user) => {
        const plain = (0, exports.normalizeAdminManagedUser)(user.toObject ? user.toObject() : { ...user });
        plain.totalAdsPosted = adsByUserId.get(String(user._id)) || 0;
        return plain;
    });
    return { data: usersWithStats, total };
};
exports.getUsers = getUsers;
const getUserManagementOverview = async () => {
    const cachedMetrics = await AdminMetrics_1.default.findOne({ metricModule: 'USERS_OVERVIEW' })
        .sort({ aggregationDate: -1 })
        .lean();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const payload = (cachedMetrics && typeof cachedMetrics.payload === 'object' && cachedMetrics.payload !== null)
        ? cachedMetrics.payload
        : {};
    const toNumberIfFinite = (value) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
    const cachedTotalUsers = toNumberIfFinite(payload.totalUsers);
    const cachedActiveUsers = toNumberIfFinite(payload.activeUsers);
    const cachedVerifiedUsers = toNumberIfFinite(payload.verifiedUsers);
    const cachedUnverifiedUsers = toNumberIfFinite(payload.unverifiedUsers);
    const [newUsersToday, suspendedUsers, bannedUsers, liveTotalUsers, liveActiveUsers, liveVerifiedUsers] = await Promise.all([
        User_1.default.countDocuments({
            status: { $ne: userStatus_1.USER_STATUS.DELETED },
            createdAt: { $gte: startOfDay }
        }),
        User_1.default.countDocuments({ status: userStatus_1.USER_STATUS.SUSPENDED }),
        User_1.default.countDocuments({ status: userStatus_1.USER_STATUS.BANNED }),
        cachedTotalUsers === undefined
            ? User_1.default.countDocuments({ status: { $ne: userStatus_1.USER_STATUS.DELETED } })
            : Promise.resolve(cachedTotalUsers),
        cachedActiveUsers === undefined
            ? User_1.default.countDocuments({ status: ACTIVE_USER_STATUS_QUERY })
            : Promise.resolve(cachedActiveUsers),
        cachedVerifiedUsers !== undefined
            ? Promise.resolve(cachedVerifiedUsers)
            : (cachedTotalUsers !== undefined && cachedUnverifiedUsers !== undefined)
                ? Promise.resolve(Math.max(cachedTotalUsers - cachedUnverifiedUsers, 0))
                : User_1.default.countDocuments({ status: { $ne: userStatus_1.USER_STATUS.DELETED }, isVerified: true }),
    ]);
    const newUsersThisWeek = toNumberIfFinite(payload.newUsersThisWeek) ?? 0;
    const businessUsers = toNumberIfFinite(payload.businessUsers) ?? 0;
    const totalUsers = liveTotalUsers;
    const activeUsers = liveActiveUsers;
    const verifiedUsers = liveVerifiedUsers;
    const activeUsersPercentage = totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;
    const verifiedUsersPercentage = totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(1)) : 0;
    const previousWeekUsers = totalUsers - newUsersThisWeek;
    const weekGrowthValue = previousWeekUsers > 0
        ? ((newUsersThisWeek - previousWeekUsers) / previousWeekUsers) * 100
        : (newUsersThisWeek > 0 ? 100 : 0);
    const weekGrowth = `${weekGrowthValue >= 0 ? '+' : ''}${Number(weekGrowthValue.toFixed(1))}%`;
    return {
        totalUsers,
        activeUsers,
        activeUsersPercentage,
        verifiedUsers,
        verifiedUsersPercentage,
        businessUsers,
        newUsersThisWeek,
        weekGrowth,
        newUsersToday,
        suspendedUsers,
        bannedUsers
    };
};
exports.getUserManagementOverview = getUserManagementOverview;
const createAdminUser = async (data, actorId, logFn) => {
    const name = data.name;
    const email = data.email;
    const mobile = data.mobile;
    const password = data.password;
    const isVerified = data.isVerified;
    if (!mobile || !name) {
        throw new AppError_1.AppError('Name and Mobile are required', 400);
    }
    const exists = await User_1.default.findOne({ $or: [{ mobile }, ...(email ? [{ email }] : [])] });
    if (exists) {
        throw new AppError_1.AppError('User with this mobile or email already exists', 409, 'USER_ALREADY_EXISTS');
    }
    const userData = {
        name,
        mobile,
        role: roles_1.Role.USER,
        email,
        isVerified: !!isVerified,
        isPhoneVerified: !!isVerified,
        isEmailVerified: !!isVerified && !!email,
        status: userStatus_1.USER_STATUS.LIVE,
        createdBy: actorId
    };
    if (password && password.trim().length > 0) {
        userData.password = await (0, auth_1.hashPassword)(password);
    }
    const newUser = await User_1.default.create(userData);
    const userObj = (0, exports.normalizeAdminManagedUser)(newUser.toObject ? newUser.toObject() : { ...newUser });
    delete userObj.password;
    await logFn('CREATE_USER', 'User', String(userObj._id), { name, mobile, role: roles_1.Role.USER });
    return userObj;
};
exports.createAdminUser = createAdminUser;
const updateAdminUser = async (userId, data, actorId, logFn) => {
    const { name, email, mobile } = data;
    if (email || mobile) {
        const orClauses = [];
        if (email)
            orClauses.push({ email });
        if (mobile)
            orClauses.push({ mobile });
        if (orClauses.length > 0) {
            const exists = await User_1.default.findOne({ _id: { $ne: userId }, $or: orClauses });
            if (exists) {
                throw new AppError_1.AppError('Email or Mobile already in use by another user', 409, 'USER_ALREADY_EXISTS');
            }
        }
    }
    const updateData = {
        updatedBy: actorId
    };
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (mobile !== undefined)
        updateData.mobile = mobile;
    const user = await User_1.default.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    if (!user) {
        throw new AppError_1.AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    await logFn('UPDATE_USER', 'User', userId, { changes: Object.keys(data) });
    return (0, exports.normalizeAdminManagedUser)(user);
};
exports.updateAdminUser = updateAdminUser;
const getAdmins = async () => {
    return Admin_1.default.find().select('-password');
};
exports.getAdmins = getAdmins;
const getAdminByIdForAdmin = async (id) => {
    return Admin_1.default.findById(id).select('-password');
};
exports.getAdminByIdForAdmin = getAdminByIdForAdmin;
const getUserByIdForAdmin = async (id) => {
    return User_1.default.findById(id).select('-password');
};
exports.getUserByIdForAdmin = getUserByIdForAdmin;
const verifyUserById = async (id, isVerified, actorId, logFn) => {
    const user = await User_1.default.findByIdAndUpdate(id, { isVerified }, { new: true }).select('-password');
    if (!user) {
        throw new AppError_1.AppError('User not found', 404);
    }
    await logFn('VERIFY_USER', 'User', String(user._id), { isVerified });
    // 🏆 TRUST SCORE: Recalculate on verification change
    setImmediate(() => void (0, TrustService_1.recalculateTrustScore)(user._id).catch(() => { }));
    return (0, exports.normalizeAdminManagedUser)(user);
};
exports.verifyUserById = verifyUserById;
const isLastActiveSuperAdmin = async (adminId) => {
    const [targetAdmin, superAdminCount] = await Promise.all([
        Admin_1.default.findById(adminId).select('role status isDeleted').lean(),
        Admin_1.default.countDocuments({
            role: roles_1.Role.SUPER_ADMIN,
            status: userStatus_1.USER_STATUS.LIVE,
            isDeleted: { $ne: true },
        }),
    ]);
    if (!targetAdmin)
        return false;
    const adminDoc = targetAdmin;
    if (adminDoc.role !== roles_1.Role.SUPER_ADMIN)
        return false;
    if (adminDoc.status !== userStatus_1.USER_STATUS.LIVE)
        return false;
    return superAdminCount <= 1;
};
exports.isLastActiveSuperAdmin = isLastActiveSuperAdmin;
const findAdminByEmail = async (email) => {
    return Admin_1.default.findOne({ email });
};
exports.findAdminByEmail = findAdminByEmail;
const createAdminAccount = async (data, actorRole, actorId, logFn) => {
    const { firstName, lastName, name, email, mobile, password, role, permissions } = data;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';
    const derivedFirstName = typeof firstName === 'string'
        ? firstName.trim()
        : typeof name === 'string'
            ? name.trim().split(/\s+/)[0] || ''
            : '';
    const derivedLastName = typeof lastName === 'string'
        ? lastName.trim()
        : typeof name === 'string'
            ? name.trim().split(/\s+/).slice(1).join(' ')
            : '';
    if (!derivedFirstName || !derivedLastName || !normalizedEmail || !normalizedPassword) {
        throw new AppError_1.AppError('Name, email, and password are required', 400);
    }
    // Check if exists
    const exists = await (0, exports.findAdminByEmail)(normalizedEmail);
    if (exists) {
        throw new AppError_1.AppError('Admin with this email already exists', 409);
    }
    const normalizedRole = typeof role === 'string' && ALLOWED_ADMIN_ROLES.has(role)
        ? role
        : roles_1.Role.ADMIN;
    if (!ensureRoleAssignmentAllowed(actorRole, normalizedRole)) {
        throw new AppError_1.AppError('Cannot assign a role higher than your own', 403);
    }
    const normalizedPermissions = Array.isArray(permissions)
        ? permissions.filter((value) => typeof value === 'string')
        : [];
    const newAdmin = await Admin_1.default.create({
        firstName: derivedFirstName,
        lastName: derivedLastName,
        email: normalizedEmail,
        mobile,
        password: normalizedPassword,
        role: normalizedRole,
        permissions: normalizedPermissions,
        status: userStatus_1.USER_STATUS.LIVE
    });
    const adminObj = newAdmin.toObject();
    delete adminObj.password;
    await logFn('CREATE_ADMIN', 'Admin', newAdmin._id.toString(), {
        role: normalizedRole,
        permissions: normalizedPermissions
    });
    return adminObj;
};
exports.createAdminAccount = createAdminAccount;
const updateAdminById = async (id, updateDataRaw, currentId, actorRole, logFn) => {
    const { firstName, lastName, email, mobile, permissions, status, password, role } = updateDataRaw;
    if (id === currentId && status && [userStatus_1.USER_STATUS.SUSPENDED, userStatus_1.USER_STATUS.BANNED, userStatus_1.USER_STATUS.INACTIVE].includes(status)) {
        throw new AppError_1.AppError('You cannot suspend/deactivate your own admin account', 400);
    }
    if (id === currentId && role) {
        throw new AppError_1.AppError('You cannot change your own role', 400);
    }
    if (status && await (0, exports.isLastActiveSuperAdmin)(id) && [userStatus_1.USER_STATUS.SUSPENDED, userStatus_1.USER_STATUS.BANNED, userStatus_1.USER_STATUS.INACTIVE].includes(status)) {
        throw new AppError_1.AppError('Cannot suspend/deactivate the last active Super Admin', 400);
    }
    const updateData = {};
    if (firstName)
        updateData.firstName = firstName;
    if (lastName)
        updateData.lastName = lastName;
    if (email)
        updateData.email = email;
    if (mobile)
        updateData.mobile = mobile;
    if (permissions)
        updateData.permissions = permissions;
    if (status)
        updateData.status = status;
    if (role) {
        if (typeof role !== 'string' || !ALLOWED_ADMIN_ROLES.has(role)) {
            throw new AppError_1.AppError('Invalid admin role', 400);
        }
        if (!ensureRoleAssignmentAllowed(actorRole, role)) {
            throw new AppError_1.AppError('Cannot assign a role higher than your own', 403);
        }
        updateData.role = role;
    }
    if (password && password.trim().length > 0) {
        updateData.password = await (0, auth_1.hashPassword)(password);
    }
    if (await (0, exports.isLastActiveSuperAdmin)(id) && role && role !== roles_1.Role.SUPER_ADMIN) {
        throw new AppError_1.AppError('Cannot downgrade the last active Super Admin', 400);
    }
    const updatedAdmin = await Admin_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
    if (!updatedAdmin) {
        throw new AppError_1.AppError('Admin not found', 404);
    }
    if (status && [userStatus_1.USER_STATUS.INACTIVE, userStatus_1.USER_STATUS.SUSPENDED, userStatus_1.USER_STATUS.BANNED].includes(status)) {
        await (0, AdminSessionService_1.revokeAdminSessionsForAdmin)(id);
    }
    await logFn('UPDATE_ADMIN', 'Admin', String(id), { changes: Object.keys(updateData) });
    return updatedAdmin;
};
exports.updateAdminById = updateAdminById;
const softDeleteAdminById = async (id, currentId, logFn) => {
    if (id === currentId) {
        throw new AppError_1.AppError('You cannot delete yourself', 400);
    }
    if (await (0, exports.isLastActiveSuperAdmin)(id)) {
        throw new AppError_1.AppError('Cannot delete the last active Super Admin', 400);
    }
    const admin = await Admin_1.default.findById(id);
    if (!admin)
        throw new AppError_1.AppError('Admin not found', 404);
    await admin.softDelete();
    await (0, AdminSessionService_1.revokeAdminSessionsForAdmin)(id);
    await logFn('DELETE_ADMIN', 'Admin', id, { email: admin.email });
    return admin;
};
exports.softDeleteAdminById = softDeleteAdminById;
const deactivateAdminById = async (id, currentId, logFn) => {
    if (id === currentId) {
        throw new AppError_1.AppError('You cannot deactivate yourself', 400);
    }
    if (await (0, exports.isLastActiveSuperAdmin)(id)) {
        throw new AppError_1.AppError('Cannot deactivate the last active Super Admin', 400);
    }
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    const admin = await Admin_1.default.findByIdAndUpdate(id, { status: userStatus_1.USER_STATUS.INACTIVE }, { new: true }).select('-password');
    if (!admin)
        throw new AppError_1.AppError('Admin not found', 404);
    await (0, AdminSessionService_1.revokeAdminSessionsForAdmin)(id);
    await logFn('DEACTIVATE_ADMIN', 'Admin', id, { status: 'inactive' });
    return admin;
};
exports.deactivateAdminById = deactivateAdminById;
const toggleAdminStatus = async (id, currentId, logFn) => {
    const admin = await Admin_1.default.findById(id);
    if (!admin) {
        throw new AppError_1.AppError('Admin not found', 404);
    }
    const isCurrentlyActive = admin.status === userStatus_1.USER_STATUS.LIVE;
    const nextStatus = isCurrentlyActive ? userStatus_1.USER_STATUS.INACTIVE : userStatus_1.USER_STATUS.LIVE;
    if (id === currentId && !isCurrentlyActive === false) {
        // Case: currently active, trying to set to inactive
        if (nextStatus === userStatus_1.USER_STATUS.INACTIVE) {
            throw new AppError_1.AppError('You cannot deactivate yourself', 400);
        }
    }
    if (isCurrentlyActive && await (0, exports.isLastActiveSuperAdmin)(id)) {
        throw new AppError_1.AppError('Cannot deactivate the last active Super Admin', 400);
    }
    admin.status = nextStatus;
    await admin.save();
    if (nextStatus === userStatus_1.USER_STATUS.INACTIVE) {
        await (0, AdminSessionService_1.revokeAdminSessionsForAdmin)(id);
    }
    const adminObj = admin.toObject();
    delete adminObj.password;
    await logFn('TOGGLE_ADMIN_STATUS', 'Admin', id, { status: nextStatus });
    return adminObj;
};
exports.toggleAdminStatus = toggleAdminStatus;
//# sourceMappingURL=AdminUsersService.js.map