import { Request, Response } from 'express';
import { logAdminAction } from '../../utils/adminLogger';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { AppError } from '../../utils/AppError';
import { escapeRegExp } from '../../utils/stringUtils';
import { buildPlanPayload, getErrorMessage, getRequiredPlanId, PlanModel } from './shared';

export const createPlan = async (req: Request, res: Response) => {
    try {
        const adminId = req.user?._id ? String(req.user._id) : undefined;
        const safeBody = buildPlanPayload(req.body as Record<string, unknown>, adminId);

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
        const planId = getRequiredPlanId(req);
        const safeBody = buildPlanPayload(req.body as Record<string, unknown>);

        const plan = await PlanModel.findByIdAndUpdate(planId, safeBody, { new: true });
        if (!plan) {
            throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        }
        await logAdminAction(req, 'UPDATE_PLAN', 'Plan', planId, { updates: safeBody });
        res.json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : null;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};

export const getPlans = async (req: Request, res: Response) => {
    try {
        const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const rawType = typeof req.query.type === 'string' ? req.query.type.trim() : '';
        const query: Record<string, unknown> = {};

        if (rawType && rawType !== 'all') {
            query.type = rawType.toUpperCase();
        }

        if (rawSearch) {
            const safeSearch = escapeRegExp(rawSearch);
            query.$or = [
                { code: { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const plans = await PlanModel.find(query).sort({ createdAt: -1 });
        res.json(respond({ success: true, data: plans }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const togglePlan = async (req: Request, res: Response) => {
    try {
        const planId = getRequiredPlanId(req);
        const plan = await PlanModel.findById(planId);
        if (!plan) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        plan.active = !plan.active;
        await plan.save();
        await logAdminAction(req, 'TOGGLE_PLAN_STATUS', 'Plan', planId, { isActive: plan.active });
        res.json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : null;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};
