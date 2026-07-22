import User from '../../../../models/User';
import Ad from '../../../../models/Ad';
import RevenueAnalytics from '../../../../models/RevenueAnalytics';

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

    const records = await RevenueAnalytics.find(query).lean();

    const totalRevenue = records.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const categoryBreakdown: Record<string, CategoryBreakdownEntry> = {};

    records.forEach(r => {
        const rec = r as unknown as Record<string, unknown>;
        const breakdown = rec.categoryBreakdown || rec.byCategory;
        if (breakdown && typeof breakdown === 'object') {
            const entries = breakdown instanceof Map ? Array.from(breakdown.entries()) : Object.entries(breakdown);
            entries.forEach(([cat, val]) => {
                if (!categoryBreakdown[cat]) {
                    categoryBreakdown[cat] = { revenue: 0, count: 0 };
                }
                const entry = val as CategoryBreakdownEntry;
                categoryBreakdown[cat].revenue += entry?.revenue || 0;
                categoryBreakdown[cat].count += entry?.count || 0;
            });
        }
    });

    return {
        totalRevenue,
        recordsCount: records.length,
        categoryBreakdown
    };
};

export const getRevenueByCategory = async (startDate?: string, endDate?: string) => {
    const summary = await getRevenueSummary(startDate, endDate);
    return summary.categoryBreakdown;
};
