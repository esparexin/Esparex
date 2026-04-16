import User from '../models/User';
import Admin from '../models/Admin';
import Ad from '../models/Ad';
import AdminMetrics from '../models/AdminMetrics';
import { USER_STATUS } from '../../../shared/enums/userStatus';
import { Role } from '../../../shared/enums/roles';
import { normalizeUserStatus } from '../../../shared/utils/userStatus';
import { hashPassword } from '../utils/auth';
import { AppError } from '../utils/AppError';

export interface UserFilters {
    search?: string;
    status?: string;
    role?: string;
    isVerified?: boolean;
}

const LEGACY_ACTIVE_STATUS = 'active';
const ACTIVE_USER_STATUS_QUERY = { $in: [USER_STATUS.LIVE, LEGACY_ACTIVE_STATUS] };

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

export const createAdminUser = async (data: Record<string, unknown>, actorId: string) => {
    const name = data.name as string | undefined;
    const email = data.email as string | undefined;
    const mobile = data.mobile as string | undefined;
    const password = data.password as string | undefined;
    const isVerified = data.isVerified;

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
    return userObj;
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

export const verifyUserById = async (id: string, isVerified: boolean) => {
    return User.findByIdAndUpdate(id, { isVerified }, { new: true }).select('-password');
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

export const createAdminAccount = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    password: string;
    role: string;
    permissions: string[];
}) => {
    return Admin.create({ ...data, status: USER_STATUS.ACTIVE });
};

export const updateAdminById = async (id: string, updateData: Record<string, unknown>) => {
    return Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
};

export const findAdminForUpdate = async (id: string) => {
    return Admin.findById(id);
};

export const softDeleteAdminById = async (id: string) => {
    const admin = await Admin.findById(id);
    if (!admin) return null;
    await (admin as unknown as { softDelete(): Promise<void> }).softDelete();
    return admin;
};

export const deactivateAdminById = async (id: string) => {
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    return Admin.findByIdAndUpdate(id, { status: USER_STATUS.INACTIVE }, { new: true }).select('-password');
};

export const saveAdminDocument = async (admin: { save: () => Promise<unknown> }) => {
    return admin.save();
};

export const updateAdminUser = async (userId: string, data: Record<string, unknown>, actorId: string) => {
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

    return normalizeAdminManagedUser(user as unknown as Record<string, unknown>);
};
