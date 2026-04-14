import { Request, Response } from 'express';
import { calculateUserPlan } from '../../services/PlanEngine';
import { resolveMasterDataIds } from '../../utils/masterDataResolver';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import {
    buildAlertExpiry,
    getErrorMessage,
    getRequiredAlertId,
    normalizeSmartAlertLocationPayload,
    SmartAlertModel,
    SmartAlertPayload,
    PlanModel,
    UserPlanModel,
    WalletModel,
    toAlertContract
} from './shared';
import { consumeCredit, credit as creditWallet } from '../../services/WalletService';
import { PLAN_STATUS } from '../../../../shared/enums/planStatus';

const requireOwnedAlert = async (req: Request, res: Response, options: { allowAdmin?: boolean } = {}) => {
    const user = req.user;
    const admin = options.allowAdmin ? (req as Request & { admin?: { id?: string; _id?: string } }).admin : undefined;
    
    if (!user && !admin) {
        sendErrorResponse(req, res, 401, 'Unauthorized');
        return null;
    }

    const id = getRequiredAlertId(req);
    const alert = await SmartAlertModel.findById(id);
    if (!alert) {
        sendErrorResponse(req, res, 404, 'Alert not found');
        return null;
    }

    const requestUserId = user ? (user.id || user._id).toString() : null;
    const isAdminRequest = Boolean(admin);

    if (!isAdminRequest && requestUserId && alert.userId.toString() !== requestUserId) {
        sendErrorResponse(req, res, 403, 'Unauthorized');
        return null;
    }

    return { alert, id, ownerId: alert.userId.toString() };
};

const resolvePlanLimit = async (userId: string) => {
    const activePlanIds = await UserPlanModel.find({
        userId,
        status: PLAN_STATUS.ACTIVE,
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
    }).lean();
    const plans = await PlanModel.find({ _id: { $in: activePlanIds.map((up) => up.planId) } }).lean();
    const userRights = calculateUserPlan(plans);
    return userRights.smartAlerts || 0;
};

export const createSmartAlert = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }
        const userId = user.id || user._id;

        const activeUserPlans = await UserPlanModel.find({
            userId,
            status: PLAN_STATUS.ACTIVE,
            $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
        }).lean();

        const planIds = activeUserPlans.map((up) => up.planId);
        const plans = await PlanModel.find({ _id: { $in: planIds } }).lean();
        const userRights = calculateUserPlan(plans);

        const wallet = await WalletModel.findOne({ userId }).lean();
        const walletSlots = (wallet?.smartAlertSlots as number | undefined) || 0;
        const planLimit = userRights.smartAlerts || 0;

        const alertsUsed = await SmartAlertModel.countDocuments({
            userId,
            isActive: true
        });

        const requiresWalletSlot = alertsUsed >= planLimit;

        if (requiresWalletSlot && walletSlots <= 0) {
            const totalLimit = planLimit + walletSlots;
            sendErrorResponse(
                req,
                res,
                403,
                `Smart Alert limit reached (${alertsUsed}/${totalLimit}). Upgrade plan or buy slots.`
            );
            return;
        }

        const allowedFields = ['criteria', 'frequency', 'name', 'coordinates', 'radiusKm', 'notificationChannels'];
        const safeBody: SmartAlertPayload = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) safeBody[field] = req.body[field];
        });

        await normalizeSmartAlertLocationPayload(safeBody);

        const createCriteria = safeBody.criteria;
        if (createCriteria) {
            const resIds = await resolveMasterDataIds({
                category: createCriteria.category,
                brand: createCriteria.brand,
                model: createCriteria.model
            });
            if (resIds.categoryId) createCriteria.categoryId = resIds.categoryId;
            if (resIds.brandId) createCriteria.brandId = resIds.brandId;
            if (resIds.modelId) createCriteria.modelId = resIds.modelId;
        }

        if (requiresWalletSlot) {
            await consumeCredit({
                userId: userId.toString(),
                creditType: 'smartAlertSlots',
                amount: 1,
                reason: 'Smart Alert slot consumed',
                metadata: { action: 'create_smart_alert' }
            });
        }

        const alert = await SmartAlertModel.create({
            ...safeBody,
            userId,
            isActive: true,
            expiresAt: buildAlertExpiry()
        });

        res.status(201).json(respond<ApiResponse<unknown>>({
            success: true,
            data: toAlertContract(alert)
        }));

    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};

export const updateSmartAlert = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedAlert(req, res);
        if (!auth) return;
        const { alert } = auth;

        const allowedFields = ['criteria', 'frequency', 'name', 'coordinates', 'radiusKm', 'notificationChannels'];
        const safeBody: SmartAlertPayload = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) safeBody[field] = req.body[field];
        });

        if (safeBody.criteria || safeBody.coordinates) {
            await normalizeSmartAlertLocationPayload(safeBody);
        }

        const updateCriteria = safeBody.criteria;
        if (updateCriteria) {
            const resIds = await resolveMasterDataIds({
                category: updateCriteria.category,
                brand: updateCriteria.brand,
                model: updateCriteria.model
            });
            if (resIds.categoryId) updateCriteria.categoryId = resIds.categoryId;
            if (resIds.brandId) updateCriteria.brandId = resIds.brandId;
            if (resIds.modelId) updateCriteria.modelId = resIds.modelId;
        }

        Object.assign(alert, safeBody);
        await alert.save();

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Alert updated successfully',
            data: toAlertContract(alert)
        }));

    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};

export const deleteSmartAlert = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedAlert(req, res, { allowAdmin: true });
        if (!auth) return;
        const { alert, id, ownerId } = auth;
        const activeAlertCount = await SmartAlertModel.countDocuments({
            userId: ownerId,
            isActive: true
        });
        const planLimit = await resolvePlanLimit(ownerId);

        if (alert.isActive) {
            await creditWallet({
                userId: ownerId,
                amount: { smartAlertSlots: 1 },
                reason: 'Smart Alert slot restored',
                metadata: { action: 'delete_smart_alert', alertId: id }
            });
        }

        await (SmartAlertModel as unknown as { findByIdAndDelete: (alertId: string) => Promise<unknown> }).findByIdAndDelete(id);

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Alert deleted successfully',
            data: { id, deleted: true }
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};

export const toggleSmartAlertStatus = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedAlert(req, res);
        if (!auth) return;
        const { alert, id, ownerId: userId } = auth;

        const activeAlertCount = await SmartAlertModel.countDocuments({
            userId,
            isActive: true
        });
        const planLimit = await resolvePlanLimit(userId);

        if (alert.isActive) {
            alert.isActive = false;
            if (activeAlertCount > planLimit) {
                await creditWallet({
                    userId,
                    amount: { smartAlertSlots: 1 },
                    reason: 'Smart Alert slot restored',
                    metadata: { action: 'deactivate_smart_alert', alertId: id }
                });
            }
        } else {
            if (activeAlertCount >= planLimit) {
                await consumeCredit({
                    userId,
                    creditType: 'smartAlertSlots',
                    amount: 1,
                    reason: 'Smart Alert slot consumed',
                    metadata: { action: 'activate_smart_alert', alertId: id }
                });
            }
            alert.isActive = true;
        }

        await alert.save();

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: `Alert ${alert.isActive ? 'activated' : 'deactivated'} successfully`,
            data: toAlertContract(alert)
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};
