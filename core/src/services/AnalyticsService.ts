import User from '../models/User';
import Ad from '../models/Ad';
import RevenueAnalytics from '../models/RevenueAnalytics';

interface AggregationBucket {
    _id: {
        month: number;
        year: number;
    };
    count: number;
}

interface CategoryBreakdownEntry {
    revenue: number;
    count: number;
}

/**
 * Technical service for admin analytics and reporting.
 * Handles heavy DB aggregations and ROI calculations.
 */
export const getTimeSeriesAnalytics = async (months: number = 6) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // 1. Parallel Aggregation
    const [revenueAgg, userAgg, adAgg] = await Promise.all([
        RevenueAnalytics.find({
            date: {
                $gte: startDate.toISOString().split('T')[0],
                $lte: endDate.toISOString().split('T')[0]
            }
        }).lean(),
        User.aggregate<AggregationBucket>([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        Ad.aggregate<AggregationBucket>([
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

        const isMatch = (agg: AggregationBucket) => (
            agg._id.month === (monthIdx + 1) && agg._id.year === year
        );
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

export const getRevenueSummary = async (startDate?: string, endDate?: string) => {
    const query: { date?: { $gte?: string; $lte?: string } } = {};

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    return RevenueAnalytics.find(query).sort({ date: -1 }).limit(30).lean();
};

export const getRevenueByCategory = async (startDate?: string, endDate?: string) => {
    const query: { date?: { $gte?: string; $lte?: string } } = {};

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    const stats = await RevenueAnalytics.find(query).lean();
    const categoryMap: Record<string, { revenue: number, count: number }> = {};

    stats.forEach(day => {
        if (day.categoryBreakdown) {
            const cb = day.categoryBreakdown instanceof Map
                ? Object.fromEntries(day.categoryBreakdown)
                : day.categoryBreakdown;

            Object.entries(cb as Record<string, CategoryBreakdownEntry>).forEach(([cat, data]) => {
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
