import AdminLog from '@core/models/AdminLog';
import Ad from '@core/models/Ad';
import User from '@core/models/User';
import { AD_STATUS } from '@core/constants/enums/adStatus';
import { USER_STATUS } from '@core/constants/enums/userStatus';
import { MODERATION_STATUS } from '@core/constants/enums/moderationStatus';
import mongoose from 'mongoose';

export class AnalyticsService {
    /**
     * Get High-Level System Overview
     */
    static async getOverview() {
        const [totalAds, activeUsers, pendingAds, moderationBacklog] = await Promise.all([
            Ad.countDocuments({ isDeleted: false }),
            User.countDocuments({ status: USER_STATUS.LIVE, isDeleted: false }),
            Ad.countDocuments({ status: AD_STATUS.PENDING, isDeleted: false }),
            Ad.countDocuments({ moderationStatus: MODERATION_STATUS.HELD_FOR_REVIEW, isDeleted: false })
        ]);

        return {
            totalAds,
            activeUsers,
            pendingAds,
            moderationBacklog,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get Admin Performance Metrics
     * Computes approvals/rejections per admin based on Audit Logs
     */
    static async getAdminPerformance(timeRangeDays: number = 7) {
        const since = new Date();
        since.setDate(since.getDate() - timeRangeDays);

        const pipeline = [
            {
                $match: {
                    createdAt: { $gte: since },
                    adminId: { $exists: true, $ne: null },
                    action: { $in: ['APPROVE_AD', 'REJECT_AD', 'MODERATE_AD'] }
                }
            },
            {
                $group: {
                    _id: "$adminId",
                    totalActions: { $sum: 1 },
                    approvals: {
                        $sum: { $cond: [{ $eq: ["$action", "APPROVE_AD"] }, 1, 0] }
                    },
                    rejections: {
                        $sum: { $cond: [{ $eq: ["$action", "REJECT_AD"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    adminId: "$_id",
                    totalActions: 1,
                    approvals: 1,
                    rejections: 1,
                    rejectionRate: {
                        $cond: [
                            { $gt: ["$totalActions", 0] },
                            { $multiply: [{ $divide: ["$rejections", "$totalActions"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ];

        return AdminLog.aggregate(pipeline);
    }

    /**
     * Get System Health Metrics
     */
    static async getSystemHealth(timeRangeDays: number = 7) {
        const since = new Date();
        since.setDate(since.getDate() - timeRangeDays);

        // Analyze system errors captured in AdminLogs (from AlertService / errorMiddleware)
        const errorPipeline = [
            {
                $match: {
                    createdAt: { $gte: since },
                    action: 'SYSTEM_ERROR_CRITICAL'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } as any }
        ];

        const [errorsByDay, pendingAds, moderationBacklog] = await Promise.all([
            AdminLog.aggregate(errorPipeline),
            Ad.countDocuments({ status: AD_STATUS.PENDING, isDeleted: false }),
            Ad.countDocuments({ moderationStatus: MODERATION_STATUS.HELD_FOR_REVIEW, isDeleted: false })
        ]);

        return {
            errorsByDay: errorsByDay.map(e => ({
                date: `${e._id.year}-${String(e._id.month).padStart(2, '0')}-${String(e._id.day).padStart(2, '0')}`,
                count: e.count
            })),
            pendingAds,
            moderationBacklog,
            status: errorsByDay.reduce((acc, val) => acc + val.count, 0) > 50 ? 'DEGRADED' : 'HEALTHY'
        };
    }

    /**
     * Rule-based Anomaly Detection (Abuse Detection)
     */
    static async getAnomalies() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const anomalies = [];

        // 1. Detect Rapid Approvals (> 20 per hour per admin)
        const rapidApprovals = await AdminLog.aggregate([
            {
                $match: {
                    action: 'APPROVE_AD',
                    createdAt: { $gte: oneHourAgo },
                    adminId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$adminId",
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 20 } } }
        ]);

        for (const record of rapidApprovals) {
            anomalies.push({
                type: 'ADMIN_ABUSE',
                subType: 'RAPID_APPROVALS',
                adminId: record._id,
                severity: 'HIGH',
                message: `Admin performed ${record.count} approvals in the last hour.`
            });
        }

        // 2. Detect High Rejection Rate (> 90% rejections with at least 10 actions)
        const recentActions = await AdminLog.aggregate([
            {
                $match: {
                    action: { $in: ['APPROVE_AD', 'REJECT_AD'] },
                    createdAt: { $gte: oneHourAgo },
                    adminId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$adminId",
                    total: { $sum: 1 },
                    rejections: { $sum: { $cond: [{ $eq: ["$action", "REJECT_AD"] }, 1, 0] } }
                }
            },
            { $match: { total: { $gte: 10 } } },
            {
                $project: {
                    rejectionRate: { $divide: ["$rejections", "$total"] },
                    total: 1,
                    rejections: 1
                }
            },
            { $match: { rejectionRate: { $gt: 0.9 } } }
        ]);

        for (const record of recentActions) {
            anomalies.push({
                type: 'ADMIN_ABUSE',
                subType: 'HIGH_REJECTION_RATE',
                adminId: record._id,
                severity: 'MEDIUM',
                message: `Admin rejected ${Math.round(record.rejectionRate * 100)}% of ads (${record.rejections}/${record.total}) in the last hour.`
            });
        }

        return anomalies;
    }

    /**
     * Get time-series analytics data (Stub)
     */
    static async getTimeSeriesAnalytics(_months: number = 6) {
        return [];
    }

    /**
     * Get aggregated revenue summary (Stub)
     */
    static async getRevenueSummary(_startDate?: string, _endDate?: string) {
        return { total: 0, count: 0 };
    }

    /**
     * Get revenue breakdown by category (Stub)
     */
    static async getRevenueByCategory(_startDate?: string, _endDate?: string) {
        return {};
    }
}
