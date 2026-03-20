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
        const walletSlots = wallet?.smartAlertSlots || 0;
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
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const id = getRequiredAlertId(req);
        const alert = await SmartAlertModel.findById(id);
        if (!alert) {
            sendErrorResponse(req, res, 404, 'Alert not found');
            return;
        }

        if (alert.userId.toString() !== (user.id || user._id).toString()) {
            sendErrorResponse(req, res, 403, 'Unauthorized');
            return;
        }

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
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const id = getRequiredAlertId(req);
        const alert = await SmartAlertModel.findById(id);
        if (!alert) {
            sendErrorResponse(req, res, 404, 'Alert not found');
            return;
        }

        if (alert.userId.toString() !== (user.id || user._id).toString()) {
            sendErrorResponse(req, res, 403, 'Unauthorized');
            return;
        }

        const activeAlertCount = await SmartAlertModel.countDocuments({
            userId: user.id || user._id,
            isActive: true
        });
        const activePlanIds = await UserPlanModel.find({
            userId: user.id || user._id,
            status: PLAN_STATUS.ACTIVE,
            $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
        }).lean();
        const plans = await PlanModel.find({ _id: { $in: activePlanIds.map((up) => up.planId) } }).lean();
        const userRights = calculateUserPlan(plans);
        const planLimit = userRights.smartAlerts || 0;

        if (alert.isActive) {
            alert.isActive = false;
        } else {
            if (activeAlertCount >= planLimit) {
                await consumeCredit({
                    userId: (user.id || user._id).toString(),
                    creditType: 'smartAlertSlots',
                    amount: 1,
                    reason: 'Smart Alert slot consumed',
                    metadata: { action: 'activate_smart_alert', alertId: id }
                });
            }
            alert.isActive = true;
        }

        if (!alert.isActive && activeAlertCount > planLimit) {
            await creditWallet({
                userId: (user.id || user._id).toString(),
                amount: { smartAlertSlots: 1 },
                reason: 'Smart Alert slot restored',
                metadata: { action: 'deactivate_smart_alert', alertId: id }
            });
        }
        await alert.save();

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Alert status toggled',
            data: toAlertContract(alert)
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};
