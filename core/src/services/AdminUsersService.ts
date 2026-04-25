import User from '@core/models/User';
import Admin from '@core/models/Admin';
import Ad from '@core/models/Ad';
import AdminMetrics from '@core/models/AdminMetrics';
import { USER_STATUS } from '@core/constants/enums/userStatus';
import { Role } from '@core/constants/enums/roles';
import { normalizeUserStatus } from '@shared/utils/userStatus';
import { hashPassword } from '@core/utils/auth';
import { AppError } from '@core/utils/AppError';
import type { AdminLogFn } from './AdminListingsService';
import { recalculateTrustScore } from './TrustService';
import { revokeAdminSessionsForAdmin } from './AdminSessionService';

export interface UserFilters {
    search?: string;
    status?: string;
    role?: string;
    isVerified?: boolean;
}

const LEGACY_ACTIVE_STATUS = 'active';
const ACTIVE_USER_STATUS_QUERY = { $in: [USER_STATUS.LIVE, LEGACY_ACTIVE_STATUS] };

const ADMIN_ROLE_RANK: Record<string, number> = {
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
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MODERATOR,
    'user_manager',
    'finance_manager',
    'content_moderator',
    'editor',
    'viewer',
    'custom'
]);

const getRoleRank = (role: string | undefined): number => ADMIN_ROLE_RANK[role || ''] || 0;

const ensureRoleAssignmentAllowed = (actorRole: string | undefined, targetRole: string): boolean => {
    if (!actorRole) return false;
    if ((actorRole as Role) === Role.SUPER_ADMIN) return true;
    return getRoleRank(targetRole) <= getRoleRank(actorRole);
};

const buildUserStatusFilter = (status?: string) => {
    if (!status || status === 'all') {
        return undefined;
    }

    const normalizedStatus = normalizeUserStatus(status);
    if (normalizedStatus === USER_STATUS.LIVE) {
        return ACTIVE_USER_STATUS_QUERY;
    }

    return normalizedStatus ?? status;
};

export const normalizeAdminManagedUser = <T extends Record<string, unknown>>(input: T): T => {
    const inputWithToObject = input as T & { toObject?: () => Record<string, unknown> };
    const plain: Record<string, unknown> = typeof inputWithToObject.toObject === 'function' ? inputWithToObject.toObject() : { ...input };
    const normalizedStatus = normalizeUserStatus(plain.status as string | undefined);
    if (normalizedStatus) {
        plain.status = normalizedStatus;
    }
    return plain as T;
};

/**
 * Service for advanced admin-only user management and metrics.
 */
export const getUsers = async (filters: UserFilters = {}, pagination: { skip: number, limit: number }) => {
    const { search, status, role, isVerified } = filters;
    const { skip, limit } = pagination;

    const query: Record<string, unknown> = { status: { $ne: USER_STATUS.DELETED } };
    
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
        User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(query)
    ]);

    const userIds = users.map((user) => user._id);
    const adCounts = userIds.length > 0
        ? await Ad.aggregate<{ _id: unknown; totalAdsPosted: number }>([
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

    const adsByUserId = new Map<string, number>(
        adCounts.map((entry) => [String(entry._id), Number(entry.totalAdsPosted) || 0])
    );

    const usersWithStats = users.map((user) => {
        const plain = normalizeAdminManagedUser(user.toObject ? user.toObject() as unknown as Record<string, unknown> : { ...(user as unknown as Record<string, unknown>) });
        plain.totalAdsPosted = adsByUserId.get(String(user._id)) || 0;
        return plain;
    });

    return { data: usersWithStats, total };
};

export const getUserManagementOverview = async () => {
    const cachedMetrics = await AdminMetrics.findOne({ metricModule: 'USERS_OVERVIEW' })
        .sort({ aggregationDate: -1 })
        .lean();

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const payload = (cachedMetrics && typeof cachedMetrics.payload === 'object' && cachedMetrics.payload !== null)
        ? cachedMetrics.payload
        : {};

    const toNumberIfFinite = (value: unknown): number | undefined =>
        typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    const cachedTotalUsers = toNumberIfFinite(payload.totalUsers);
    const cachedActiveUsers = toNumberIfFinite(payload.activeUsers);
    const cachedVerifiedUsers = toNumberIfFinite(payload.verifiedUsers);
    const cachedUnverifiedUsers = toNumberIfFinite(payload.unverifiedUsers);

    const [newUsersToday, suspendedUsers, bannedUsers, liveTotalUsers, liveActiveUsers, liveVerifiedUsers] = await Promise.all([
        User.countDocuments({
            status: { $ne: USER_STATUS.DELETED },
            createdAt: { $gte: startOfDay }
        }),
        User.countDocuments({ status: USER_STATUS.SUSPENDED }),
        User.countDocuments({ status: USER_STATUS.BANNED }),
        cachedTotalUsers === undefined
            ? User.countDocuments({ status: { $ne: USER_STATUS.DELETED } })
            : Promise.resolve(cachedTotalUsers),
        cachedActiveUsers === undefined
            ? User.countDocuments({ status: ACTIVE_USER_STATUS_QUERY })
            : Promise.resolve(cachedActiveUsers),
        cachedVerifiedUsers !== undefined
            ? Promise.resolve(cachedVerifiedUsers)
            : (cachedTotalUsers !== undefined && cachedUnverifiedUsers !== undefined)
                ? Promise.resolve(Math.max(cachedTotalUsers - cachedUnverifiedUsers, 0))
                : User.countDocuments({ status: { $ne: USER_STATUS.DELETED }, isVerified: true }),
    ]);

    const newUsersThisWeek = toNumberIfFinite(payload.newUsersThisWeek) ?? 0;
    const businessUsers = toNumberIfFinite(payload.businessUsers) ?? 0;
    const totalUsers = liveTotalUsers;
    const activeUsers = liveActiveUsers;
    const verifiedUsers = liveVerifiedUsers;

    const activeUsersPercentage =
        totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;
    const verifiedUsersPercentage =
        totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(1)) : 0;

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

export const createAdminUser = async (
    data: Record<string, unknown>,
    actorId: string,
    logFn: AdminLogFn
) => {
    const name = data.name as string | undefined;
    const email = data.email as string | undefined;
    const mobile = data.mobile as string | undefined;
    const password = data.password as string | undefined;
    const isVerified = data.isVerified;

    if (!mobile || !name) {
        throw new AppError('Name and Mobile are required', 400);
    }

    const exists = await User.findOne({ $or: [{ mobile }, ...(email ? [{ email }] : [])] });
    if (exists) {
        throw new AppError('User with this mobile or email already exists', 409, 'USER_ALREADY_EXISTS');
    }

    const userData: Record<string, unknown> = {
        name,
        mobile,
        role: Role.USER,
        email,
        isVerified: !!isVerified,
        isPhoneVerified: !!isVerified,
        isEmailVerified: !!isVerified && !!email,
        status: USER_STATUS.LIVE,
        createdBy: actorId
    };

    if (password && password.trim().length > 0) {
        userData.password = await hashPassword(password);
    }

    const newUser = await User.create(userData);
    const userObj = normalizeAdminManagedUser(newUser.toObject ? newUser.toObject() as unknown as Record<string, unknown> : { ...(newUser as unknown as Record<string, unknown>) });
    delete userObj.password;

    await logFn('CREATE_USER', 'User', String(userObj._id), { name, mobile, role: Role.USER });
    return userObj;
};

export const updateAdminUser = async (
    userId: string,
    data: Record<string, unknown>,
    actorId: string,
    logFn: AdminLogFn
) => {
    const { name, email, mobile } = data as { name?: string; email?: string; mobile?: string };

    if (email || mobile) {
        const orClauses: Record<string, unknown>[] = [];
        if (email) orClauses.push({ email });
        if (mobile) orClauses.push({ mobile });

        if (orClauses.length > 0) {
            const exists = await User.findOne({ _id: { $ne: userId }, $or: orClauses });
            if (exists) {
                throw new AppError('Email or Mobile already in use by another user', 409, 'USER_ALREADY_EXISTS');
            }
        }
    }

    const updateData: Record<string, unknown> = {
        updatedBy: actorId
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
    ).select('-password');

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await logFn('UPDATE_USER', 'User', userId, { changes: Object.keys(data) });
    return normalizeAdminManagedUser(user as unknown as Record<string, unknown>);
};

export const getAdmins = async () => {
    return Admin.find().select('-password');
};

export const getAdminByIdForAdmin = async (id: string) => {
    return Admin.findById(id).select('-password');
};

export const getUserByIdForAdmin = async (id: string) => {
    return User.findById(id).select('-password');
};

export const verifyUserById = async (
    id: string,
    isVerified: boolean,
    actorId: string,
    logFn: AdminLogFn
) => {
    const user = await User.findByIdAndUpdate(id, { isVerified }, { new: true }).select('-password');
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    await logFn('VERIFY_USER', 'User', String(user._id), { isVerified });

    // 🏆 TRUST SCORE: Recalculate on verification change
    setImmediate(() => void recalculateTrustScore(user._id).catch(() => { }));

    return normalizeAdminManagedUser(user as unknown as Record<string, unknown>);
};

export const isLastActiveSuperAdmin = async (adminId: string): Promise<boolean> => {
    const [targetAdmin, superAdminCount] = await Promise.all([
        Admin.findById(adminId).select('role status isDeleted').lean(),
        Admin.countDocuments({
            role: Role.SUPER_ADMIN,
            status: USER_STATUS.ACTIVE,
            isDeleted: { $ne: true },
        }),
    ]);

    if (!targetAdmin) return false;
    const adminDoc = targetAdmin as { role?: string; status?: string };
    if (adminDoc.role !== Role.SUPER_ADMIN) return false;
    if (adminDoc.status !== USER_STATUS.ACTIVE) return false;
    return superAdminCount <= 1;
};

export const findAdminByEmail = async (email: string) => {
    return Admin.findOne({ email });
};

export const createAdminAccount = async (
    data: Record<string, unknown>,
    actorRole: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    const {
        firstName,
        lastName,
        name,
        email,
        mobile,
        password,
        role,
        permissions
    } = data as { firstName?: string; lastName?: string; name?: string; email?: string; mobile?: string; password?: string; role?: string; permissions?: string[] };

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
        throw new AppError('Name, email, and password are required', 400);
    }

    // Check if exists
    const exists = await findAdminByEmail(normalizedEmail);
    if (exists) {
        throw new AppError('Admin with this email already exists', 409);
    }

    const normalizedRole =
        typeof role === 'string' && ALLOWED_ADMIN_ROLES.has(role)
            ? role
            : Role.ADMIN;

    if (!ensureRoleAssignmentAllowed(actorRole, normalizedRole)) {
        throw new AppError('Cannot assign a role higher than your own', 403);
    }

    const normalizedPermissions = Array.isArray(permissions)
        ? permissions.filter((value) => typeof value === 'string')
        : [];

    const newAdmin = await Admin.create({
        firstName: derivedFirstName,
        lastName: derivedLastName,
        email: normalizedEmail,
        mobile,
        password: normalizedPassword,
        role: normalizedRole,
        permissions: normalizedPermissions,
        status: USER_STATUS.ACTIVE
    });

    const adminObj = newAdmin.toObject() as unknown as Record<string, unknown>;
    delete adminObj.password;

    await logFn('CREATE_ADMIN', 'Admin', newAdmin._id.toString(), {
        role: normalizedRole,
        permissions: normalizedPermissions
    });

    return adminObj;
};

export const updateAdminById = async (
    id: string,
    updateDataRaw: Record<string, unknown>,
    currentId: string,
    actorRole: string,
    logFn: AdminLogFn
) => {
    const { firstName, lastName, email, mobile, permissions, status, password, role } = updateDataRaw as {
        firstName?: string; lastName?: string; email?: string; mobile?: string;
        permissions?: string[]; status?: string; password?: string; role?: string;
    };

    if (id === currentId && status && [USER_STATUS.SUSPENDED as string, USER_STATUS.BANNED as string, USER_STATUS.INACTIVE as string].includes(status)) {
        throw new AppError('You cannot suspend/deactivate your own admin account', 400);
    }
    if (id === currentId && role) {
        throw new AppError('You cannot change your own role', 400);
    }

    if (status && await isLastActiveSuperAdmin(id) && [USER_STATUS.SUSPENDED as string, USER_STATUS.BANNED as string, USER_STATUS.INACTIVE as string].includes(status)) {
        throw new AppError('Cannot suspend/deactivate the last active Super Admin', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (permissions) updateData.permissions = permissions;
    if (status) updateData.status = status;
    if (role) {
        if (typeof role !== 'string' || !ALLOWED_ADMIN_ROLES.has(role)) {
            throw new AppError('Invalid admin role', 400);
        }
        if (!ensureRoleAssignmentAllowed(actorRole, role)) {
            throw new AppError('Cannot assign a role higher than your own', 403);
        }
        updateData.role = role;
    }

    if (password && password.trim().length > 0) {
        updateData.password = await hashPassword(password);
    }

    if (await isLastActiveSuperAdmin(id) && role && (role as Role) !== Role.SUPER_ADMIN) {
        throw new AppError('Cannot downgrade the last active Super Admin', 400);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');

    if (!updatedAdmin) {
        throw new AppError('Admin not found', 404);
    }

    if (status && [USER_STATUS.INACTIVE as string, USER_STATUS.SUSPENDED as string, USER_STATUS.BANNED as string].includes(status)) {
        await revokeAdminSessionsForAdmin(id);
    }

    await logFn('UPDATE_ADMIN', 'Admin', String(id), { changes: Object.keys(updateData) });
    return updatedAdmin;
};

export const softDeleteAdminById = async (
    id: string,
    currentId: string,
    logFn: AdminLogFn
) => {
    if (id === currentId) {
        throw new AppError('You cannot delete yourself', 400);
    }

    if (await isLastActiveSuperAdmin(id)) {
        throw new AppError('Cannot delete the last active Super Admin', 400);
    }

    const admin = await Admin.findById(id);
    if (!admin) throw new AppError('Admin not found', 404);
    await (admin as unknown as { softDelete(): Promise<void> }).softDelete();

    await revokeAdminSessionsForAdmin(id);
    await logFn('DELETE_ADMIN', 'Admin', id, { email: (admin as { email?: string }).email });

    return admin;
};

export const deactivateAdminById = async (
    id: string,
    currentId: string,
    logFn: AdminLogFn
) => {
    if (id === currentId) {
        throw new AppError('You cannot deactivate yourself', 400);
    }

    if (await isLastActiveSuperAdmin(id)) {
        throw new AppError('Cannot deactivate the last active Super Admin', 400);
    }

    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    const admin = await Admin.findByIdAndUpdate(id, { status: USER_STATUS.INACTIVE }, { new: true }).select('-password');
    if (!admin) throw new AppError('Admin not found', 404);

    await revokeAdminSessionsForAdmin(id);
    await logFn('DEACTIVATE_ADMIN', 'Admin', id, { status: 'inactive' });
    return admin;
};

export const toggleAdminStatus = async (
    id: string,
    currentId: string,
    logFn: AdminLogFn
) => {
    const admin = await Admin.findById(id);
    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    const isCurrentlyActive = admin.status === USER_STATUS.ACTIVE;
    const nextStatus = isCurrentlyActive ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;

    if (id === currentId && !isCurrentlyActive === false) {
         // Case: currently active, trying to set to inactive
        if (nextStatus === USER_STATUS.INACTIVE) {
            throw new AppError('You cannot deactivate yourself', 400);
        }
    }

    if (isCurrentlyActive && await isLastActiveSuperAdmin(id)) {
        throw new AppError('Cannot deactivate the last active Super Admin', 400);
    }

    admin.status = nextStatus;
    await admin.save();

    if (nextStatus === USER_STATUS.INACTIVE) {
        await revokeAdminSessionsForAdmin(id);
    }

    const adminObj = admin.toObject();
    delete (adminObj as unknown as Record<string, unknown>).password;

    await logFn('TOGGLE_ADMIN_STATUS', 'Admin', id, { status: nextStatus });
    return adminObj;
};
