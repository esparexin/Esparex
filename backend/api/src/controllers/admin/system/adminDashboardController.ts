import { Request, Response } from 'express';
import { sendSuccessResponse, getPaginationParams, sendPaginatedResponse, sendAdminError } from '../../../utils/adminBaseController';
import { getSingleParam } from '../../../utils/requestParams';
import { escapeRegExp } from '@esparex/core/utils/stringUtils';

import redis from '@esparex/core/config/redis';
import { scanKeysByPattern } from '@esparex/core/utils/redisCache';
import { buildPublicAdFilter } from '@esparex/core/utils/FeedVisibilityGuard';
import {
    getDashboardOverviewStats,
    getDashboardCardStats,
    getRecentAdminLogs,
    getContactSubmissionsPaginated,
    updateContactSubmissionById,
    adminGetLocationAnalyticsData,
} from '@esparex/core/services/AdminDashboardService';

import * as adminAnalyticsController from '../adminAnalyticsController';

const sendDashboardError = (req: Request, res: Response, error: unknown) => {
    sendAdminError(req, res, error);
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const publicAdFilter = buildPublicAdFilter();
        const result =
            await getDashboardOverviewStats(publicAdFilter) as { totalUsers: number; unifiedStats: Array<Record<string, unknown>>; pendingModels: number; openReports: number; pendingBusinesses: number; totalRevenueAgg: Array<{ total: number }>; catalogHealth: unknown };
        const { totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg, catalogHealth } = result;

        const stats = unifiedStats[0] as unknown as { totalAds: Array<{ count: number }>; activeAds: Array<{ count: number }>; pendingAds: Array<{ count: number }>; totalServices: Array<{ count: number }>; activeServices: Array<{ count: number }>; pendingServices: Array<{ count: number }>; rejectedServices: Array<{ count: number }>; totalSpareParts: Array<{ count: number }>; activeSpareParts: Array<{ count: number }>; pendingSpareParts: Array<{ count: number }> };
        const totalAds = stats.totalAds[0]?.count || 0;
        const activeAds = stats.activeAds[0]?.count || 0;
        const pendingAds = stats.pendingAds[0]?.count || 0;

        const totalServices = stats.totalServices[0]?.count || 0;
        const activeServices = stats.activeServices[0]?.count || 0;
        const pendingServices = stats.pendingServices[0]?.count || 0;
        const rejectedServices = stats.rejectedServices[0]?.count || 0;

        const totalSpareParts = stats.totalSpareParts[0]?.count || 0;
        const activeSpareParts = stats.activeSpareParts[0]?.count || 0;
        const pendingSpareParts = stats.pendingSpareParts[0]?.count || 0;

        const totalRevenue = totalRevenueAgg[0]?.total || 0;
        sendSuccessResponse(res, {
            totalUsers,
            totalAds,
            activeAds,
            pendingAds,
            totalServices,
            activeServices,
            pendingServices,
            rejectedServices,
            totalSpareParts,
            activeSpareParts,
            pendingSpareParts,
            notifications: {
                pendingModels,
                reportedAds: openReports,
                pendingBusinesses: pendingBusinesses,
                pendingAds: pendingAds
            },
            revenue: totalRevenue,
            catalogHealth
        });
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const publicAdFilter = buildPublicAdFilter();
        const cardResult =
            await getDashboardCardStats(publicAdFilter) as { totalUsers: number; adStats: Array<Record<string, unknown>>; totalReports: number; totalBusinesses: number; totalRevenueAgg: Array<{ total: number }>; catalogHealth: unknown };
        const { totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg, catalogHealth } = cardResult;

        const activeAds = (adStats[0] as unknown as { live: Array<{ count: number }>; pending: Array<{ count: number }> }).live[0]?.count || 0;
        const pendingAds = (adStats[0] as unknown as { live: Array<{ count: number }>; pending: Array<{ count: number }> }).pending[0]?.count || 0;

        const revenue = totalRevenueAgg[0]?.total || 0;
        sendSuccessResponse(res, {
            totalUsers,
            activeAds,
            pendingAds,
            totalReports,
            totalBusinesses,
            revenue,
            catalogHealth
        });
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    return adminAnalyticsController.getTimeSeriesAnalytics(req, res);
};

export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const logs = await getRecentAdminLogs(10);

        const activity = logs.map(log => {
            const admin = (log.adminId || {}) as { firstName?: string; lastName?: string };
            return {
                title: (log.action as string).replace(/_/g, ' '),
                description: `${admin?.firstName || 'Admin'} ${admin?.lastName || ''} - ${log.targetType} ${String(log.targetId || '')}`,
                time: log.createdAt
            };
        });

        sendSuccessResponse(res, activity);
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

export const getContactSubmissions = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const { status, category, search } = req.query;

        const query: Record<string, unknown> & { $or?: Array<Record<string, unknown>> } = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            const safeSearch = escapeRegExp(search as string);
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { message: { $regex: safeSearch, $options: 'i' } },
                { subject: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const [submissions, total] = await getContactSubmissionsPaginated(query, skip, limit);
        sendPaginatedResponse(res, submissions, total, page, limit);
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

export const updateContactSubmissionStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid submission id' });
        if (!id) return;
        const { status } = req.body as { status: string };

        if (!['new', 'read', 'replied'].includes(status)) {
            return sendAdminError(req, res, 'Invalid status', 400);
        }

        const submission = await updateContactSubmissionById(id, status);

        if (!submission) {
            return sendAdminError(req, res, 'Submission not found', 404);
        }

        sendSuccessResponse(res, submission, 'Status updated successfully');
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

export const getRateLimitMetrics = async (req: Request, res: Response) => {
    try {
        const keys = await scanKeysByPattern("rl:*", { maxKeys: 5000 });
        const data = await Promise.all(keys.map(async (k: string) => ({ key: k, count: await redis.get(k) })));
        sendSuccessResponse(res, data);
    } catch {
        sendSuccessResponse(res, []);
    }
};

export const getLocationAnalytics = async (req: Request, res: Response) => {
    try {
        const data = await adminGetLocationAnalyticsData(req.query);
        sendSuccessResponse(res, data);
    } catch (error) {
        sendDashboardError(req, res, error);
    }
};
