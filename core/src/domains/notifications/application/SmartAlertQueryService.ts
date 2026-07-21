import SmartAlert from '../../../models/SmartAlert';

/**
 * Smart Alert Query Service
 * Handles read-only operations for Smart Alerts
 */
export const getAllSmartAlerts = async (skip: number, limit: number) => {
    const [alerts, total] = await Promise.all([
        SmartAlert.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SmartAlert.countDocuments({}),
    ]);
    return { alerts, total };
};

export const getSmartAlertsForUser = async (userId?: string) => {
    const query = userId ? { userId } : {};
    return SmartAlert.find(query).sort({ createdAt: -1 }).lean();
};
