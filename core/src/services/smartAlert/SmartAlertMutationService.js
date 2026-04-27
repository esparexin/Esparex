"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSmartAlertStatusMutation = exports.deleteSmartAlertMutation = exports.updateSmartAlertMutation = exports.createSmartAlertMutation = void 0;
const planStatus_1 = require("@core/constants/enums/planStatus");
const PlanEngine_1 = require("../PlanEngine");
const PlanService_1 = require("../PlanService");
const WalletService_1 = require("../WalletService");
const SmartAlertService_1 = require("../SmartAlertService");
const masterDataResolver_1 = require("@core/utils/masterDataResolver");
const AppError_1 = require("@core/utils/AppError");
const constants_1 = require("@core/config/constants");
const LocationNormalizer_1 = require("@core/services/location/LocationNormalizer");
const SMART_ALERT_MUTABLE_FIELDS = [
    'criteria',
    'frequency',
    'name',
    'coordinates',
    'radiusKm',
    'notificationChannels',
];
const buildAlertExpiry = () => new Date(Date.now() + constants_1.GOVERNANCE.SMART_ALERT.EXPIRY_DAYS * constants_1.MS_IN_DAY);
const pickMutableFields = (body) => {
    const safeBody = {};
    const mutableSafeBody = safeBody;
    SMART_ALERT_MUTABLE_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
            mutableSafeBody[field] = body[field];
        }
    });
    return safeBody;
};
const normalizeSmartAlertLocationPayload = async (payload) => {
    const criteria = payload.criteria && typeof payload.criteria === 'object'
        ? { ...payload.criteria }
        : {};
    const normalized = await (0, LocationNormalizer_1.normalizeLocation)({
        locationId: criteria.locationId,
        city: criteria.location,
        state: criteria.state,
        display: criteria.location,
        coordinates: payload.coordinates,
    });
    const explicitCoords = (0, LocationNormalizer_1.normalizeCoordinates)(payload.coordinates);
    const effectiveCoords = explicitCoords || normalized?.coordinates;
    if (!effectiveCoords || (effectiveCoords.coordinates[0] === 0 && effectiveCoords.coordinates[1] === 0)) {
        throw new AppError_1.AppError('Valid map coordinates are required for Smart Alerts.', 400, 'INVALID_COORDINATES');
    }
    payload.coordinates = effectiveCoords;
    criteria.coordinates = payload.coordinates;
    if (normalized?.locationId) {
        criteria.locationId = normalized.locationId;
    }
    if (normalized?.display) {
        criteria.location = normalized.display;
    }
    payload.criteria = criteria;
};
const resolveSmartAlertCriteriaIds = async (criteria) => {
    if (!criteria)
        return;
    const resIds = await (0, masterDataResolver_1.resolveMasterDataIds)({
        category: criteria.category,
        brand: criteria.brand,
        model: criteria.model,
    });
    if (resIds.categoryId)
        criteria.categoryId = resIds.categoryId;
    if (resIds.brandId)
        criteria.brandId = resIds.brandId;
    if (resIds.modelId)
        criteria.modelId = resIds.modelId;
};
const getRequestUserId = (user) => user ? (user.id || user._id)?.toString() : undefined;
const getAdminId = (admin) => admin ? (admin.id || admin._id)?.toString() : undefined;
const requireOwnedAlert = async ({ alertId, user, admin, allowAdmin = false, }) => {
    const requestUserId = getRequestUserId(user);
    const adminId = allowAdmin ? getAdminId(admin) : undefined;
    if (!requestUserId && !adminId) {
        throw new AppError_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const alert = await SmartAlertService_1.SmartAlertModel.findById(alertId);
    if (!alert) {
        throw new AppError_1.AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }
    if (!adminId && requestUserId && alert.userId.toString() !== requestUserId) {
        throw new AppError_1.AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    return {
        alert,
        ownerId: alert.userId.toString(),
    };
};
const resolvePlanLimit = async (userId) => {
    const activeUserPlans = await PlanService_1.UserPlanModel.find({
        userId,
        status: planStatus_1.PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();
    const plans = await PlanService_1.PlanModel.find({ _id: { $in: activeUserPlans.map((up) => up.planId) } }).lean();
    const userRights = (0, PlanEngine_1.calculateUserPlan)(plans);
    return userRights.smartAlerts || 0;
};
const createSmartAlertMutation = async ({ user, body, }) => {
    const userId = getRequestUserId(user);
    if (!userId) {
        throw new AppError_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const activeUserPlans = await PlanService_1.UserPlanModel.find({
        userId,
        status: planStatus_1.PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).lean();
    const plans = await PlanService_1.PlanModel.find({ _id: { $in: activeUserPlans.map((up) => up.planId) } }).lean();
    const userRights = (0, PlanEngine_1.calculateUserPlan)(plans);
    const wallet = await WalletService_1.WalletModel.findOne({ userId }).lean();
    const walletSlots = wallet?.smartAlertSlots || 0;
    const planLimit = userRights.smartAlerts || 0;
    const alertsUsed = await SmartAlertService_1.SmartAlertModel.countDocuments({
        userId,
        isActive: true,
    });
    const requiresWalletSlot = alertsUsed >= planLimit;
    if (requiresWalletSlot && walletSlots <= 0) {
        const totalLimit = planLimit + walletSlots;
        throw new AppError_1.AppError(`Smart Alert limit reached (${alertsUsed}/${totalLimit}). Upgrade plan or buy slots.`, 403, 'SMART_ALERT_LIMIT_REACHED');
    }
    const safeBody = pickMutableFields(body);
    await normalizeSmartAlertLocationPayload(safeBody);
    await resolveSmartAlertCriteriaIds(safeBody.criteria);
    if (requiresWalletSlot) {
        await (0, WalletService_1.consumeCredit)({
            userId,
            creditType: 'smartAlertSlots',
            amount: 1,
            reason: 'Smart Alert slot consumed',
            metadata: { action: 'create_smart_alert' },
        });
    }
    return SmartAlertService_1.SmartAlertModel.create({
        ...safeBody,
        userId,
        isActive: true,
        expiresAt: buildAlertExpiry(),
    });
};
exports.createSmartAlertMutation = createSmartAlertMutation;
const updateSmartAlertMutation = async ({ alertId, user, body, }) => {
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
exports.updateSmartAlertMutation = updateSmartAlertMutation;
const deleteSmartAlertMutation = async ({ alertId, user, admin, }) => {
    const { alert, ownerId } = await requireOwnedAlert({
        alertId,
        user,
        admin,
        allowAdmin: true,
    });
    if (alert.isActive) {
        await (0, WalletService_1.credit)({
            userId: ownerId,
            amount: { smartAlertSlots: 1 },
            reason: 'Smart Alert slot restored',
            metadata: { action: 'delete_smart_alert', alertId },
        });
    }
    await SmartAlertService_1.SmartAlertModel.findByIdAndDelete(alertId);
    return { id: alertId, deleted: true };
};
exports.deleteSmartAlertMutation = deleteSmartAlertMutation;
const toggleSmartAlertStatusMutation = async ({ alertId, user, }) => {
    const { alert, ownerId } = await requireOwnedAlert({ alertId, user });
    const activeAlertCount = await SmartAlertService_1.SmartAlertModel.countDocuments({
        userId: ownerId,
        isActive: true,
    });
    const planLimit = await resolvePlanLimit(ownerId);
    if (alert.isActive) {
        alert.isActive = false;
        if (activeAlertCount > planLimit) {
            await (0, WalletService_1.credit)({
                userId: ownerId,
                amount: { smartAlertSlots: 1 },
                reason: 'Smart Alert slot restored',
                metadata: { action: 'deactivate_smart_alert', alertId },
            });
        }
    }
    else {
        if (activeAlertCount >= planLimit) {
            await (0, WalletService_1.consumeCredit)({
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
exports.toggleSmartAlertStatusMutation = toggleSmartAlertStatusMutation;
//# sourceMappingURL=SmartAlertMutationService.js.map