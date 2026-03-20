import User from '../models/User';
import Admin from '../models/Admin';
import Ad from '../models/Ad';
import AdminMetrics from '../models/AdminMetrics';
import mongoose from 'mongoose';
import { USER_STATUS } from '../../../shared/enums/userStatus';
import { Role } from '../../../shared/enums/roles';
import { hashPassword } from '../utils/auth';

export interface UserFilters {
    search?: string;
    status?: string;
    role?: string;
    isVerified?: boolean;
}

/**
 * Service for advanced admin-only user management and metrics.
 */
export const getUsers = async (filters: UserFilters = {}, pagination: { skip: number, limit: number }) => {
    const { search, status, role, isVerified } = filters;
    const { skip, limit } = pagination;

    const query: Record<string, any> = { status: { $ne: USER_STATUS.DELETED } };
    
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } }
        ];
    }
    
    if (status && status !== 'all') {
        query.status = status;
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
        ? await Ad.aggregate([
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
        const plain = user.toObject() as any;
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

    const [newUsersToday, suspendedUsers, bannedUsers] = await Promise.all([
        User.countDocuments({
            status: { $ne: USER_STATUS.DELETED },
            createdAt: { $gte: startOfDay }
        }),
        User.countDocuments({ status: USER_STATUS.SUSPENDED }),
        User.countDocuments({ status: USER_STATUS.BANNED })
    ]);

    const payload = (cachedMetrics && typeof cachedMetrics.payload === 'object' && cachedMetrics.payload !== null)
        ? cachedMetrics.payload as Record<string, unknown>
        : {};

    const toNumberIfFinite = (value: unknown): number | undefined =>
        typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    let totalUsers = toNumberIfFinite(payload.totalUsers);
    let activeUsers = toNumberIfFinite(payload.activeUsers);
    let verifiedUsers = toNumberIfFinite(payload.verifiedUsers);

    if (totalUsers === undefined || activeUsers === undefined || verifiedUsers === undefined) {
        const [liveTotalUsers, liveActiveUsers, liveVerifiedUsers] = await Promise.all([
            User.countDocuments({ status: { $ne: USER_STATUS.DELETED } }),
            User.countDocuments({ status: USER_STATUS.ACTIVE }),
            User.countDocuments({ status: USER_STATUS.ACTIVE, isVerified: true })
        ]);

        totalUsers = totalUsers ?? liveTotalUsers;
        activeUsers = activeUsers ?? liveActiveUsers;
        verifiedUsers = verifiedUsers ?? liveVerifiedUsers;
    }

    totalUsers = totalUsers ?? 0;
    activeUsers = activeUsers ?? 0;
    verifiedUsers = verifiedUsers ?? 0;

    const newUsersThisWeek = toNumberIfFinite(payload.newUsersThisWeek) ?? 0;
    const businessUsers = toNumberIfFinite(payload.businessUsers) ?? 0;

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

export const createAdminUser = async (data: any, actorId: string) => {
    const { name, email, mobile, password, isVerified } = data;

    const exists = await User.findOne({ $or: [{ mobile }, ...(email ? [{ email }] : [])] });
    if (exists) {
        throw new Error('User with this mobile or email already exists');
    }

    const userData: Record<string, any> = {
        name,
        mobile,
        role: Role.USER,
        email,
        isVerified: !!isVerified,
        isPhoneVerified: !!isVerified,
        isEmailVerified: !!isVerified && !!email,
        status: USER_STATUS.ACTIVE,
        createdBy: actorId
    };

    if (password && password.trim().length > 0) {
        userData.password = await hashPassword(password);
    }

    const newUser = await User.create(userData);
    const userObj = newUser.toObject() as any;
    delete userObj.password;
    return userObj;
};

export const updateAdminUser = async (userId: string, data: any, actorId: string) => {
    const { name, email, mobile } = data;

    if (email || mobile) {
        const query: any = { _id: { $ne: userId }, $or: [] };
        if (email) query.$or.push({ email });
        if (mobile) query.$or.push({ mobile });

        if (query.$or.length > 0) {
            const exists = await User.findOne(query);
            if (exists) {
                throw new Error('Email or Mobile already in use by another user');
            }
        }
    }

    const updateData: Record<string, any> = {
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
        throw new Error('User not found');
    }

    return user;
};
