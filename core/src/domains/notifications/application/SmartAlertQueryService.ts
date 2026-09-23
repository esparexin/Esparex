import { Types } from 'mongoose';
import { NOTIFICATION_TYPE, PLAN_STATUS, PLATFORM_QUOTAS, type SmartAlertMatchesResponseDTO, type SmartAlertQuotaDTO } from '@esparex/contracts';
import SmartAlert from '../../../models/SmartAlert';
import Notification from '../../../models/Notification';
import Ad from '../../../models/Ad';
import UserWallet from '../../../models/UserWallet';
import Entitlement from '../../../models/Entitlement';
import { calculateUserPlan, UserPlanModel, PlanModel } from '../../payments';
import { syncWalletCycle } from '../../boosts/application/services/AdSlotService';

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

export interface GetSmartAlertMatchesOptions {
    page?: number;
    limit?: number;
    alertId?: string;
}

/**
 * Fetch delivered smart alert matches for a user with batched listing hydration
 */
export const getSmartAlertMatchesForUser = async (
    userId: string,
    options: GetSmartAlertMatchesOptions = {}
): Promise<SmartAlertMatchesResponseDTO> => {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(options.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    const filter: Record<string, unknown> = {
        userId: userObjectId,
        type: NOTIFICATION_TYPE.SMART_ALERT,
    };

    if (options.alertId && options.alertId.trim().length > 0) {
        filter['data.alertId'] = options.alertId.trim();
    }

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(filter),
    ]);

    const adIdStrings = notifications
        .map((n) => (n.data?.adId as string) || n.entityRef?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const validObjectIds = Array.from(new Set(adIdStrings.filter((id) => Types.ObjectId.isValid(id)))).map(
        (id) => new Types.ObjectId(id)
    );

    const ads = validObjectIds.length > 0
        ? await Ad.find({ _id: { $in: validObjectIds } })
            .select('title price currency images status location seoSlug listingType isSold')
            .lean()
        : [];

    const adMap = new Map<string, (typeof ads)[number]>();
    for (const ad of ads) {
        adMap.set(String(ad._id), ad);
    }

    const matches = notifications.map((n) => {
        const adId = ((n.data?.adId as string) || n.entityRef?.id || '').toString();
        const alertId = ((n.data?.alertId as string) || '').toString();

        let alertName = typeof n.data?.alertName === 'string' ? n.data.alertName : '';
        if (!alertName && n.message) {
            const match = n.message.match(/matches your alert:\s*(.+)$/i);
            if (match && match[1]) {
                alertName = match[1].trim();
            }
        }
        if (!alertName) {
            alertName = 'Smart Alert';
        }

        const adDoc = adId ? adMap.get(adId) : null;
        const adSummary = adDoc
            ? {
                id: String(adDoc._id),
                title: adDoc.title,
                price: adDoc.price,
                currency: adDoc.currency || 'USD',
                images: adDoc.images ?? [],
                status: adDoc.isSold ? 'sold' : adDoc.status,
                location: adDoc.location
                    ? {
                        city: adDoc.location.city,
                        state: adDoc.location.state,
                        display: adDoc.location.display,
                    }
                    : undefined,
                seoSlug: adDoc.seoSlug,
                listingType: adDoc.listingType,
            }
            : null;

        const actionUrl = n.actionUrl || (adId ? `/ads/${adId}` : undefined);

        return {
            id: String(n._id),
            alertId,
            alertName,
            deliveredAt: n.createdAt,
            isRead: !!n.isRead,
            adId,
            actionUrl,
            ad: adSummary,
        };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
        matches,
        total,
        page,
        limit,
        totalPages,
    };
};

/**
 * Authoritative Quota SSOT for Smart Alerts.
 * Returns monthly usage, limits, and remaining creation capacity.
 */
export const getSmartAlertQuotaForUser = async (userId: string): Promise<SmartAlertQuotaDTO> => {
    await syncWalletCycle(userId);

    const activeUserPlans = await UserPlanModel.find({
        userId,
        status: PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();

    const FREE_ALERT_BASE = PLATFORM_QUOTAS.FREE_SMART_ALERT_LIMIT;
    let basePlanLimit: number = FREE_ALERT_BASE;

    if (activeUserPlans.length > 0) {
        const planIds = activeUserPlans.map((up: { planId: unknown }) => up.planId);
        const plans = await PlanModel.find({ _id: { $in: planIds } }).lean();
        const userRights = calculateUserPlan(plans);
        basePlanLimit = userRights.smartAlerts || FREE_ALERT_BASE;
    }

    const [wallet, rawEntitlements] = await Promise.all([
        UserWallet.findOne({ userId }).lean(),
        Entitlement.find({
            userId,
            type: 'SMART_ALERT_SLOT',
            status: 'ACTIVE',
            remaining: { $gt: 0 },
            $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }],
        }).lean(),
    ]);

    const activePaidSlots = rawEntitlements.length > 0
        ? rawEntitlements.reduce((acc, e) => acc + (typeof e.remaining === 'number' ? e.remaining : 0), 0)
        : Math.max(0, ((wallet?.smartAlertSlots as number | undefined) || FREE_ALERT_BASE) - FREE_ALERT_BASE);

    const freeAlertsUsed = Number(wallet?.monthlyFreeAlertsUsed || 0);
    const freeRemaining = Math.max(0, basePlanLimit - freeAlertsUsed);
    const totalRemaining = freeRemaining + activePaidSlots;
    const totalLimit = basePlanLimit + activePaidSlots;

    const now = new Date();
    const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();

    return {
        limit: totalLimit,
        used: freeAlertsUsed,
        remaining: totalRemaining,
        resetsAt,
    };
};
