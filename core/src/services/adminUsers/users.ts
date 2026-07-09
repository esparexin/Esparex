import User from '../../models/User';
import Ad from '../../models/Ad';
import AdminMetrics from '../../models/AdminMetrics';
import { USER_STATUS, Role } from '@esparex/shared';
import { hashPassword } from '../../utils/auth';
import { AppError } from '../../utils/AppError';
import type { AdminLogFn } from '../AdminListingsService';
import type { UserFilters } from './types';
import { ACTIVE_USER_STATUS_QUERY, buildUserStatusFilter, normalizeAdminManagedUser } from './helpers';

export const getUsers = async (filters: UserFilters = {}, pagination: { skip: number; limit: number }) => {
    const { search, status, role, isVerified } = filters;
    const { skip, limit } = pagination;
    const query: Record<string, unknown> = { status: { $ne: USER_STATUS.DELETED }, userType: 'marketplace' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { mobile: { $regex: search, $options: 'i' } }];
    const sq = buildUserStatusFilter(status);
    if (sq) query.status = sq;
    if (role && role !== 'all') query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified;
    const [users, total] = await Promise.all([User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(query)]);
    const userIds = users.map((u) => u._id);
    const adCounts = userIds.length > 0 ? await Ad.aggregate<{ _id: unknown; totalAdsPosted: number }>([{ $match: { sellerId: { $in: userIds }, isDeleted: { $ne: true } } }, { $group: { _id: '$sellerId', totalAdsPosted: { $sum: 1 } } }]) : [];
    const adsByUserId = new Map(adCounts.map((e) => [String(e._id), Number(e.totalAdsPosted) || 0]));
    const data = users.map((u) => { const p = normalizeAdminManagedUser(u.toObject ? u.toObject() as any : { ...(u as any) }); p.totalAdsPosted = adsByUserId.get(String(u._id)) || 0; return p; });
    return { data, total };
};

export const getUserManagementOverview = async () => {
    const cachedMetrics = await AdminMetrics.findOne({ metricModule: 'USERS_OVERVIEW' }).sort({ aggregationDate: -1 }).lean();
    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const payload = (cachedMetrics && typeof cachedMetrics.payload === 'object' && cachedMetrics.payload) || {};
    const tn = (v: unknown): number | undefined => typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    const [newUsersToday, suspendedUsers, bannedUsers, liveTotalUsers, liveActiveUsers, liveVerifiedUsers, individuals, businesses, verifiedBusinesses, blockedUsers] = await Promise.all([
        User.countDocuments({ userType: 'marketplace', status: { $ne: USER_STATUS.DELETED }, createdAt: { $gte: startOfDay } }),
        User.countDocuments({ userType: 'marketplace', status: USER_STATUS.SUSPENDED }),
        User.countDocuments({ userType: 'marketplace', status: USER_STATUS.BANNED }),
        tn(payload.totalUsers) ?? User.countDocuments({ userType: 'marketplace', status: { $ne: USER_STATUS.DELETED } }),
        tn(payload.activeUsers) ?? User.countDocuments({ userType: 'marketplace', status: ACTIVE_USER_STATUS_QUERY }),
        tn(payload.verifiedUsers) ?? (tn(payload.totalUsers) !== undefined && tn(payload.unverifiedUsers) !== undefined ? Math.max(tn(payload.totalUsers)! - tn(payload.unverifiedUsers)!, 0) : User.countDocuments({ userType: 'marketplace', status: { $ne: USER_STATUS.DELETED }, isVerified: true })),
        User.countDocuments({ userType: 'marketplace', role: Role.USER, status: { $ne: USER_STATUS.DELETED } }),
        User.countDocuments({ userType: 'marketplace', role: Role.BUSINESS, status: { $ne: USER_STATUS.DELETED } }),
        User.countDocuments({ userType: 'marketplace', role: Role.BUSINESS, isVerified: true, status: { $ne: USER_STATUS.DELETED } }),
        User.countDocuments({ userType: 'marketplace', status: { $in: [USER_STATUS.SUSPENDED, USER_STATUS.BANNED] } }),
    ]);
    const totalUsers = liveTotalUsers;
    const activeUsers = liveActiveUsers;
    const verifiedUsers = liveVerifiedUsers;
    return { totalUsers, activeUsers, activeUsersPercentage: totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0, verifiedUsers, verifiedUsersPercentage: totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(1)) : 0, businessUsers: tn(payload.businessUsers) ?? 0, newUsersThisWeek: tn(payload.newUsersThisWeek) ?? 0, weekGrowth: '', newUsersToday, suspendedUsers, bannedUsers, individuals, businesses, verifiedBusinesses, blockedUsers };
};

export const createAdminUser = async (data: Record<string, unknown>, actorId: string, logFn: AdminLogFn) => {
    const name = data.name as string | undefined; const mobile = data.mobile as string | undefined; const email = data.email as string | undefined; const password = data.password as string | undefined; const isVerified = data.isVerified;
    if (!mobile || !name) throw new AppError('Name and Mobile are required', 400);
    const exists = await User.findOne({ $or: [{ mobile }, ...(email ? [{ email }] : [])] });
    if (exists) throw new AppError('User with this mobile or email already exists', 409, 'USER_ALREADY_EXISTS');
    const userData: Record<string, unknown> = { name, mobile, role: Role.USER, email, isVerified: !!isVerified, isPhoneVerified: !!isVerified, isEmailVerified: !!isVerified && !!email, status: USER_STATUS.LIVE, createdBy: actorId };
    if (password?.trim()) userData.password = await hashPassword(password);
    const newUser = await User.create(userData);
    const uo = normalizeAdminManagedUser(newUser.toObject ? newUser.toObject() as any : { ...(newUser as any) }); delete uo.password;
    await logFn('CREATE_USER', 'User', String(uo._id), { name, mobile, role: Role.USER }); return uo;
};
