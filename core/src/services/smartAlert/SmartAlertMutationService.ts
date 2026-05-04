import { PLAN_STATUS } from '@esparex/core/constants/enums/planStatus';
import { calculateUserPlan } from '../PlanEngine';
import { UserPlanModel, PlanModel } from '../PlanService';
import { consumeCredit, credit as creditWallet, WalletModel } from '../WalletService';
import { SmartAlertModel, type SmartAlertDocument } from '../SmartAlertService';
import { resolveMasterDataIds } from '@esparex/core/utils/masterDataResolver';
import { AppError } from '@esparex/core/utils/AppError';
import { GOVERNANCE, MS_IN_DAY } from '@esparex/core/config/constants';
import {
    normalizeCoordinates,
    normalizeLocation,
} from "@esparex/core/services/location/LocationNormalizer";

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

    const normalized = await normalizeLocation({
        locationId: (criteria as Record<string, unknown>).locationId,
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
    }

    if (normalized?.display) {
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

const resolvePlanLimit = async (userId: string) => {
    const activeUserPlans = await UserPlanModel.find({
        userId,
        status: PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();
    const plans = await PlanModel.find({ _id: { $in: activeUserPlans.map((up: unknown) => up.planId) } }).lean();
    const userRights = calculateUserPlan(plans);
    return userRights.smartAlerts || 0;
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

    const activeUserPlans = await UserPlanModel.find({
        userId,
        status: PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();

    const plans = await PlanModel.find({ _id: { $in: activeUserPlans.map((up: unknown) => up.planId) } }).lean();
    const userRights = calculateUserPlan(plans);

    const wallet = await WalletModel.findOne({ userId }).lean();
    const walletSlots = (wallet?.smartAlertSlots as number | undefined) || 0;
    const planLimit = userRights.smartAlerts || 0;

    const alertsUsed = await SmartAlertModel.countDocuments({
        userId,
        isActive: true,
    });

    const requiresWalletSlot = alertsUsed >= planLimit;
    if (requiresWalletSlot && walletSlots <= 0) {
        const totalLimit = planLimit + walletSlots;
        throw new AppError(
            `Smart Alert limit reached (${alertsUsed}/${totalLimit}). Upgrade plan or buy slots.`,
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
    const { alert } = await requireOwnedAlert({ alertId, user });
    const safeBody = pickMutableFields(body);

    if (safeBody.criteria || safeBody.coordinates) {
        await normalizeSmartAlertLocationPayload(safeBody);
    }

    await resolveSmartAlertCriteriaIds(safeBody.criteria);

    Object.assign(alert, safeBody);
    await alert.save();
    return alert;
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
    const { alert, ownerId } = await requireOwnedAlert({
        alertId,
        user,
        admin,
        allowAdmin: true,
    });

    if (alert.isActive) {
        await creditWallet({
            userId: ownerId,
            amount: { smartAlertSlots: 1 },
            reason: 'Smart Alert slot restored',
            metadata: { action: 'delete_smart_alert', alertId },
        });
    }

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
    const { alert, ownerId } = await requireOwnedAlert({ alertId, user });

    const activeAlertCount = await SmartAlertModel.countDocuments({
        userId: ownerId,
        isActive: true,
    });
    const planLimit = await resolvePlanLimit(ownerId);

    if (alert.isActive) {
        alert.isActive = false;
        if (activeAlertCount > planLimit) {
            await creditWallet({
                userId: ownerId,
                amount: { smartAlertSlots: 1 },
                reason: 'Smart Alert slot restored',
                metadata: { action: 'deactivate_smart_alert', alertId },
            });
        }
    } else {
        if (activeAlertCount >= planLimit) {
            await consumeCredit({
                userId: ownerId,
                creditType: 'smartAlertSlots',
                amount: 1,
                reason: 'Smart Alert slot consumed',
                metadata: { action: 'activate_smart_alert', alertId },
            });
        }
        alert.isActive = true;
    }

    await alert.save();
    return alert;
};
