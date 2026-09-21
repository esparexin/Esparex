import { PLAN_STATUS } from '@esparex/contracts';
import { calculateUserPlan } from '../../payments';
import { UserPlanModel, PlanModel } from '../../payments';
import { consumeCredit } from '../../payments';
import { SmartAlertModel, type SmartAlertDocument } from './SmartAlertService';
import UserWallet from '../../../models/UserWallet';
import Entitlement from '../../../models/Entitlement';
import { syncWalletCycle } from '../../boosts/application/services/AdSlotService';
import { resolveMasterDataIds } from '../../../utils/masterDataResolver';
import { AppError } from '../../../utils/AppError';
import { GOVERNANCE, MS_IN_DAY } from '../../../config/constants';
import { sanitizeMongoObjectId } from '@esparex/shared';
import {
    normalizeCoordinates,
    normalizeLocation,
} from "../../../services/location/LocationNormalizer";
import { UnifiedMutationEngine } from '../../../services/mutations/UnifiedMutationEngine';

export type SmartAlertCriteriaPayload = {
    keywords?: string;
    category?: string;
    brand?: string;
    model?: string;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    coordinates?: unknown;
} & Record<string, unknown>;

export type SmartAlertPayload = {
    criteria?: SmartAlertCriteriaPayload;
    frequency?: unknown;
    name?: unknown;
    coordinates?: unknown;
    radiusKm?: unknown;
    notificationChannels?: unknown;
} & Record<string, unknown>;

type AdminContext = { id?: string; _id?: string } | undefined;

const SMART_ALERT_MUTABLE_FIELDS = [
    'criteria',
    'frequency',
    'name',
    'coordinates',
    'radiusKm',
    'notificationChannels',
] as const;

const buildAlertExpiry = () =>
    new Date(Date.now() + GOVERNANCE.SMART_ALERT.EXPIRY_DAYS * MS_IN_DAY);

const pickMutableFields = (body: Record<string, unknown>): SmartAlertPayload => {
    const safeBody: SmartAlertPayload = {};
    const mutableSafeBody = safeBody as Record<string, unknown>;

    SMART_ALERT_MUTABLE_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
            mutableSafeBody[field] = body[field];
        }
    });

    return safeBody;
};

const normalizeSmartAlertLocationPayload = async (
    payload: SmartAlertPayload
) => {
    const criteria = payload.criteria && typeof payload.criteria === 'object'
        ? { ...payload.criteria }
        : {};

    const rawLocId = (criteria as Record<string, unknown>).locationId;
    const sanitizedLocId = sanitizeMongoObjectId(rawLocId);

    const normalized = await normalizeLocation({
        locationId: sanitizedLocId,
        city: (criteria as Record<string, unknown>).location,
        state: (criteria as Record<string, unknown>).state,
        display: (criteria as Record<string, unknown>).location,
        coordinates: payload.coordinates,
    });

    const explicitCoords = normalizeCoordinates(payload.coordinates);
    const effectiveCoords = explicitCoords || normalized?.coordinates;

    if (!effectiveCoords || (effectiveCoords.coordinates[0] === 0 && effectiveCoords.coordinates[1] === 0)) {
        throw new AppError('Valid map coordinates are required for Smart Alerts.', 400, 'INVALID_COORDINATES');
    }

    payload.coordinates = effectiveCoords;
    (criteria as Record<string, unknown>).coordinates = payload.coordinates;

    if (normalized?.locationId) {
        (criteria as Record<string, unknown>).locationId = normalized.locationId;
    } else if (sanitizedLocId) {
        (criteria as Record<string, unknown>).locationId = sanitizedLocId;
    } else {
        delete (criteria as Record<string, unknown>).locationId;
    }

    if (normalized?.display && normalized.display !== 'Unknown Location') {
        (criteria as Record<string, unknown>).location = normalized.display;
    }

    payload.criteria = criteria;
};

const resolveSmartAlertCriteriaIds = async (criteria?: SmartAlertCriteriaPayload) => {
    if (!criteria) return;

    const resIds = await resolveMasterDataIds({
        category: criteria.category,
        brand: criteria.brand,
        model: criteria.model,
    });

    if (resIds.categoryId) criteria.categoryId = resIds.categoryId;
    if (resIds.brandId) criteria.brandId = resIds.brandId;
    if (resIds.modelId) criteria.modelId = resIds.modelId;
};

const getRequestUserId = (user: { id?: string; _id?: string | { toString(): string } } | undefined) =>
    user ? (user.id || user._id)?.toString() : undefined;

const getAdminId = (admin: AdminContext) => admin ? (admin.id || admin._id)?.toString() : undefined;

const requireOwnedAlert = async ({
    alertId,
    user,
    admin,
    allowAdmin = false,
}: {
    alertId: string;
    user?: { id?: string; _id?: string | { toString(): string } };
    admin?: AdminContext;
    allowAdmin?: boolean;
}) => {
    const requestUserId = getRequestUserId(user);
    const adminId = allowAdmin ? getAdminId(admin) : undefined;

    if (!requestUserId && !adminId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const alert = await SmartAlertModel.findById(alertId);
    if (!alert) {
        throw new AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    if (!adminId && requestUserId && alert.userId.toString() !== requestUserId) {
        throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    return {
        alert,
        ownerId: alert.userId.toString(),
    };
};

const FREE_ALERT_BASE = 2;

const resolvePlanLimit = async (userId: string) => {
    const activeUserPlans = await UserPlanModel.find({
        userId,
        status: PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();
    if (activeUserPlans.length === 0) {
        return FREE_ALERT_BASE;
    }
    const plans = await PlanModel.find({ _id: { $in: activeUserPlans.map((up: { planId: unknown }) => up.planId) } }).lean();
    const userRights = calculateUserPlan(plans);
    return userRights.smartAlerts || FREE_ALERT_BASE;
};

export const createSmartAlertMutation = async ({
    user,
    body,
}: {
    user?: { id?: string; _id?: string | { toString(): string } };
    body: Record<string, unknown>;
}): Promise<SmartAlertDocument> => {
    const userId = getRequestUserId(user);
    if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const planLimit = await resolvePlanLimit(userId);
    await syncWalletCycle(userId);

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

    const monthlyUsed = Number(wallet?.monthlyFreeAlertsUsed || 0);
    const requiresWalletSlot = monthlyUsed >= planLimit;

    if (requiresWalletSlot && activePaidSlots <= 0) {
        const totalLimit = planLimit + activePaidSlots;
        throw new AppError(
            `Smart Alert monthly limit reached (${monthlyUsed}/${totalLimit}). Upgrade plan or buy slots.`,
            403,
            'SMART_ALERT_LIMIT_REACHED'
        );
    }

    const safeBody = pickMutableFields(body);

    await normalizeSmartAlertLocationPayload(safeBody);
    await resolveSmartAlertCriteriaIds(safeBody.criteria);

    if (requiresWalletSlot) {
        await consumeCredit({
            userId,
            creditType: 'smartAlertSlots',
            amount: 1,
            reason: 'Smart Alert slot consumed',
            metadata: { action: 'create_smart_alert' },
        });
    } else {
        await UserWallet.updateOne(
            { userId },
            { $inc: { monthlyFreeAlertsUsed: 1 } },
            { upsert: true }
        );
    }

    return SmartAlertModel.create({
        ...safeBody,
        userId,
        isActive: true,
        expiresAt: buildAlertExpiry(),
    });
};


export const updateSmartAlertMutation = async ({
    alertId,
    user,
    body,
}: {
    alertId: string;
    user?: { id?: string; _id?: string | { toString(): string } };
    body: Record<string, unknown>;
}): Promise<SmartAlertDocument> => {
    return UnifiedMutationEngine.execute<SmartAlertDocument>({
        model: SmartAlertModel as import('mongoose').Model<SmartAlertDocument>,
        entityId: alertId,
        context: {
            actor: 'USER',
            userId: getRequestUserId(user)
        },
        payload: body,
        config: {
            mutableFields: [...SMART_ALERT_MUTABLE_FIELDS],
        },
        hooks: {
            validateOwnership: (alert, context) => {
                if (!context.userId) {
                    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
                }
                if (alert.userId.toString() !== context.userId) {
                    throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
                }
            },
            beforeSave: async (alert, safeBody) => {
                const payload = safeBody as SmartAlertPayload;
                if (payload.criteria || payload.coordinates) {
                    await normalizeSmartAlertLocationPayload(payload);
                }
                await resolveSmartAlertCriteriaIds(payload.criteria);
            }
        }
    });
};

export const deleteSmartAlertMutation = async ({
    alertId,
    user,
    admin,
}: {
    alertId: string;
    user?: { id?: string; _id?: string | { toString(): string } };
    admin?: AdminContext;
}) => {
    await requireOwnedAlert({
        alertId,
        user,
        admin,
        allowAdmin: true,
    });

    // Consumed Smart Alert quota slots are non-refundable upon alert deletion.
    // Quota resets strictly via the monthly billing cycle (syncWalletCycle).
    await SmartAlertModel.findByIdAndDelete(alertId);
    return { id: alertId, deleted: true };
};

export const toggleSmartAlertStatusMutation = async ({
    alertId,
    user,
}: {
    alertId: string;
    user?: { id?: string; _id?: string | { toString(): string } };
}): Promise<SmartAlertDocument> => {
    const { alert } = await requireOwnedAlert({ alertId, user });

    if (alert.isActive) {
        alert.isActive = false;
    } else {
        alert.isActive = true;
        alert.expiryWarningSentAt = undefined;
        alert.expiryWarningCount = 0;
    }

    await alert.save();
    return alert;
};
