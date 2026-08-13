import SmartAlert from '../../../models/SmartAlert';

/**
 * Smart Alert Query Service
 * Handles read-only operations for Smart Alerts
 */
export const getAllSmartAlerts = async (skip: number, limit: number, query?: string) => {
    const filter: Record<string, unknown> = {};
    if (query && query.trim().length > 0) {
        const searchRegex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { name: { $regex: searchRegex } },
            { 'criteria.keywords': { $regex: searchRegex } },
            { 'criteria.location': { $regex: searchRegex } },
            { userId: searchRegex.test(query.trim()) && query.trim().length === 24 ? query.trim() : { $regex: searchRegex } },
        ];
    }

    const [alerts, total] = await Promise.all([
        SmartAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SmartAlert.countDocuments(filter),
    ]);
    return { alerts, total };
};

export const getSmartAlertsForUser = async (userId?: string) => {
    const query = userId ? { userId } : {};
    return SmartAlert.find(query).sort({ createdAt: -1 }).lean();
};
