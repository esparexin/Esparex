import { Request, Response } from 'express';
import { logAdminAction } from '../../utils/adminLogger';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { AppError } from '../../utils/AppError';
import { buildPlanPayload, getErrorMessage, getRequiredPlanId, isAdminUser, PlanModel } from './shared';

export const createPlan = async (req: Request, res: Response) => {
    try {
        if (!isAdminUser(req)) {
            sendErrorResponse(req, res, 403, 'Admin access required');
            return;
        }

        const safeBody = buildPlanPayload(req.body as Record<string, unknown>);

        const plan = await PlanModel.create(safeBody);
        const planId = Array.isArray(plan) ? plan[0]?._id : (plan as Record<string, unknown>)?._id;
        await logAdminAction(req, 'CREATE_PLAN', 'Plan', planId == null ? undefined : String(planId));
        res.status(201).json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        const err = error as Error;
        sendErrorResponse(req, res, 400, err.message);
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        if (!isAdminUser(req)) {
            sendErrorResponse(req, res, 403, 'Admin access required');
            return;
        }
        const planId = getRequiredPlanId(req);
        const safeBody = buildPlanPayload(req.body as Record<string, unknown>);

        const plan = await PlanModel.findByIdAndUpdate(planId, safeBody, { new: true });
        await logAdminAction(req, 'UPDATE_PLAN', 'Plan', planId, { updates: safeBody });
        res.json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};

export const getPlans = async (req: Request, res: Response) => {
    try {
        if (!isAdminUser(req)) {
            sendErrorResponse(req, res, 403, 'Admin access required');
            return;
        }
        const plans = await PlanModel.find({}).sort({ createdAt: -1 });
        res.json(respond({ success: true, data: plans }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const togglePlan = async (req: Request, res: Response) => {
    try {
        if (!isAdminUser(req)) {
            sendErrorResponse(req, res, 403, 'Admin access required');
            return;
        }
        const planId = getRequiredPlanId(req);
        const plan = await PlanModel.findById(planId);
        if (!plan) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        plan.active = !plan.active;
        await plan.save();
        await logAdminAction(req, 'TOGGLE_PLAN_STATUS', 'Plan', planId, { isActive: plan.active });
        res.json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 400, getErrorMessage(error));
    }
};
