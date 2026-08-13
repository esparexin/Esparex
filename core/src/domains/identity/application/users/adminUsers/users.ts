import User from '../../../../../models/User';
import Ad from '../../../../../models/Ad';
import { USER_STATUS, Role } from '@esparex/contracts';
import { hashPassword } from '../../auth/auth';
import { AppError } from '../../../../../utils/AppError';
import type { AdminLogFn } from '../../../../../services/AdminListingsService';
import type { UserFilters } from './types';
import { buildUserStatusFilter, normalizeAdminManagedUser } from './helpers';

import { escapeRegExp } from '../../../../../utils/stringUtils';

export const getUsers = async (filters: UserFilters = {}, pagination: { skip: number; limit: number }) => {
    const search = typeof filters.search === 'string' ? filters.search.trim() : '';
    const status = typeof filters.status === 'string' ? filters.status.trim() : undefined;
    const role = typeof filters.role === 'string' ? filters.role.trim() : undefined;
    const isVerified = typeof filters.isVerified === 'boolean' ? filters.isVerified : undefined;
    const { skip, limit } = pagination;

    const query: Record<string, unknown> = {
        status: { $ne: USER_STATUS.DELETED },
        userType: { $eq: 'marketplace' },
    };

    if (search) {
        const safeSearch = escapeRegExp(search);
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { mobile: { $regex: searchRegex } },
        ];
    }

    const sq = buildUserStatusFilter(status);
    if (sq) query.status = sq;
    if (role && role !== 'all') {
        if (role === Role.USER) {
            query.role = { $in: [Role.USER, null, undefined] };
        } else {
            query.role = { $eq: String(role) };
        }
    }
    if (isVerified !== undefined) {
        query.isVerified = { $eq: Boolean(isVerified) };
    }

    const [users, total] = await Promise.all([
        User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(query),
    ]);

    const userIds = users.map((u) => u._id);
    const adCounts = userIds.length > 0 ? await Ad.aggregate<{ _id: unknown; totalAdsPosted: number }>([{ $match: { sellerId: { $in: userIds }, isDeleted: { $ne: true } } }, { $group: { _id: '$sellerId', totalAdsPosted: { $sum: 1 } } }]) : [];
    const adsByUserId = new Map(adCounts.map((e) => [String(e._id), Number(e.totalAdsPosted) || 0]));
    const data = users.map((u) => { const p = normalizeAdminManagedUser(u); p.totalAdsPosted = adsByUserId.get(String(u._id)) || 0; return p; });
    return { data, total };
};

export const getUserManagementOverview = async () => {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const activeStatusQuery = [USER_STATUS.ACTIVE as string, USER_STATUS.LIVE as string];
    const nonDeletedMatch = { userType: 'marketplace', status: { $ne: USER_STATUS.DELETED } };

    const [facetResults] = await User.aggregate<{
        totalUsers: [{ count: number }];
        activeUsers: [{ count: number }];
        suspendedUsers: [{ count: number }];
        bannedUsers: [{ count: number }];
        verifiedUsers: [{ count: number }];
        individuals: [{ count: number }];
        businesses: [{ count: number }];
        verifiedBusinesses: [{ count: number }];
        blockedUsers: [{ count: number }];
        newUsersToday: [{ count: number }];
    }>([
        {
            $facet: {
                totalUsers: [{ $match: nonDeletedMatch }, { $count: 'count' }],
                activeUsers: [{ $match: { ...nonDeletedMatch, status: { $in: activeStatusQuery } } }, { $count: 'count' }],
                suspendedUsers: [{ $match: { userType: 'marketplace', status: USER_STATUS.SUSPENDED } }, { $count: 'count' }],
                bannedUsers: [{ $match: { userType: 'marketplace', status: USER_STATUS.BANNED } }, { $count: 'count' }],
                verifiedUsers: [{ $match: { ...nonDeletedMatch, isVerified: true } }, { $count: 'count' }],
                individuals: [{ $match: { ...nonDeletedMatch, $or: [{ role: Role.USER }, { role: { $exists: false } }, { role: null }] } }, { $count: 'count' }],
                businesses: [{ $match: { ...nonDeletedMatch, role: Role.BUSINESS } }, { $count: 'count' }],
                verifiedBusinesses: [{ $match: { ...nonDeletedMatch, role: Role.BUSINESS, isVerified: true } }, { $count: 'count' }],
                blockedUsers: [{ $match: { userType: 'marketplace', status: { $in: [USER_STATUS.SUSPENDED, USER_STATUS.BANNED] } } }, { $count: 'count' }],
                newUsersToday: [{ $match: { ...nonDeletedMatch, createdAt: { $gte: startOfDay } } }, { $count: 'count' }],
            }
        }
    ]);

    const totalUsers = facetResults?.totalUsers?.[0]?.count ?? 0;
    const activeUsers = facetResults?.activeUsers?.[0]?.count ?? 0;
    const suspendedUsers = facetResults?.suspendedUsers?.[0]?.count ?? 0;
    const bannedUsers = facetResults?.bannedUsers?.[0]?.count ?? 0;
    const verifiedUsers = facetResults?.verifiedUsers?.[0]?.count ?? 0;
    const individuals = facetResults?.individuals?.[0]?.count ?? 0;
    const businesses = facetResults?.businesses?.[0]?.count ?? 0;
    const verifiedBusinesses = facetResults?.verifiedBusinesses?.[0]?.count ?? 0;
    const blockedUsers = facetResults?.blockedUsers?.[0]?.count ?? 0;
    const newUsersToday = facetResults?.newUsersToday?.[0]?.count ?? 0;

    return {
        totalUsers,
        activeUsers,
        activeUsersPercentage: totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0,
        verifiedUsers,
        verifiedUsersPercentage: totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(1)) : 0,
        businessUsers: businesses,
        newUsersThisWeek: 0,
        weekGrowth: '',
        newUsersToday,
        suspendedUsers,
        bannedUsers,
        individuals,
        businesses,
        verifiedBusinesses,
        blockedUsers,
    };
};

export const createAdminUser = async (data: Record<string, unknown>, actorId: string, logFn: AdminLogFn) => {
    const name = data.name as string | undefined; const mobile = data.mobile as string | undefined; const email = data.email as string | undefined; const password = data.password as string | undefined; const isVerified = data.isVerified;
    if (!mobile || !name) throw new AppError('Name and Mobile are required', 400);
    const safeMobile = String(mobile).trim();
    const safeEmail = email ? String(email).trim().toLowerCase() : undefined;
    const exists = await User.findOne({ $or: [{ mobile: { $eq: safeMobile } }, ...(safeEmail ? [{ email: { $eq: safeEmail } }] : [])] });
    if (exists) throw new AppError('User with this mobile or email already exists', 409, 'USER_ALREADY_EXISTS');
    const userData: Record<string, unknown> = { name, mobile, role: Role.USER, email, isVerified: !!isVerified, isPhoneVerified: !!isVerified, isEmailVerified: !!isVerified && !!email, status: USER_STATUS.LIVE, createdBy: actorId };
    if (password?.trim()) userData.password = await hashPassword(password);
    const newUser = await User.create(userData);
    const uo = normalizeAdminManagedUser(newUser); delete uo.password;
    await logFn('CREATE_USER', 'User', String(uo._id), { name, mobile, role: Role.USER }); return uo;
};
