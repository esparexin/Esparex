"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueByCategory = exports.getRevenueSummary = exports.getTimeSeriesAnalytics = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const RevenueAnalytics_1 = __importDefault(require("@core/models/RevenueAnalytics"));
/**
 * Technical service for admin analytics and reporting.
 * Handles heavy DB aggregations and ROI calculations.
 */
const getTimeSeriesAnalytics = async (months = 6) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    // 1. Parallel Aggregation
    const [revenueAgg, userAgg, adAgg] = await Promise.all([
        RevenueAnalytics_1.default.find({
            date: {
                $gte: startDate.toISOString().split('T')[0],
                $lte: endDate.toISOString().split('T')[0]
            }
        }).lean(),
        User_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        Ad_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
    ]);
    // 2. Format Data for Delivery
    const result = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < months; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (months - 1 - i));
        const monthIdx = d.getMonth();
        const year = d.getFullYear();
        const monthName = monthNames[monthIdx];
        const dateStrPrefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        const monthRevenue = revenueAgg
            .filter(r => r.date.startsWith(dateStrPrefix))
            .reduce((acc, curr) => acc + curr.totalRevenue, 0);
        const isMatch = (agg) => (agg._id.month === (monthIdx + 1) && agg._id.year === year);
        const userMatch = userAgg.find(isMatch);
        const adMatch = adAgg.find(isMatch);
        result.push({
            name: monthName,
            amt: monthRevenue,
            users: userMatch ? userMatch.count : 0,
            ads: adMatch ? adMatch.count : 0,
            cost: monthRevenue * 0.2, // ROI business rule
            year: year
        });
    }
    return result;
};
exports.getTimeSeriesAnalytics = getTimeSeriesAnalytics;
const getRevenueSummary = async (startDate, endDate) => {
    const query = {};
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = startDate;
        if (endDate)
            query.date.$lte = endDate;
    }
    return RevenueAnalytics_1.default.find(query).sort({ date: -1 }).limit(30).lean();
};
exports.getRevenueSummary = getRevenueSummary;
const getRevenueByCategory = async (startDate, endDate) => {
    const query = {};
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = startDate;
        if (endDate)
            query.date.$lte = endDate;
    }
    const stats = await RevenueAnalytics_1.default.find(query).lean();
    const categoryMap = {};
    stats.forEach(day => {
        if (day.categoryBreakdown) {
            const cb = day.categoryBreakdown instanceof Map
                ? Object.fromEntries(day.categoryBreakdown)
                : day.categoryBreakdown;
            Object.entries(cb).forEach(([cat, data]) => {
                if (!categoryMap[cat]) {
                    categoryMap[cat] = { revenue: 0, count: 0 };
                }
                categoryMap[cat].revenue += data.revenue;
                categoryMap[cat].count += data.count;
            });
        }
    });
    return categoryMap;
};
exports.getRevenueByCategory = getRevenueByCategory;
//# sourceMappingURL=AnalyticsService.js.map