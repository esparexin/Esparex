import { Request, Response } from 'express';
import { logAdminAction } from '../../../utils/adminLogger';
import { respond } from "../../../utils/respond";
import { sendErrorResponse } from "../../../utils/errorResponse";
import { AppError } from '@esparex/core/utils/AppError';
import { escapeRegExp } from '@esparex/core/utils/stringUtils';
import { buildPlanPayload, getErrorMessage, getRequiredPlanId } from './shared';
import {
    adminCreatePlan,
    adminUpdatePlan,
    adminGetPlans,
    adminGetPlanById,
    adminArchivePlan,
    adminRestorePlan,
} from '@esparex/core/domains/payments/application/PlanService';

export const createPlan = async (req: Request, res: Response) => {
    try {
        const adminId = req.user?._id ? String(req.user._id) : undefined;
        const safeBody = buildPlanPayload(req.body as Record<string, unknown>, adminId);

        const plan = await adminCreatePlan(safeBody);
        const planId = plan._id;
        await logAdminAction(req, 'CREATE_PLAN', 'Plan', planId == undefined ? undefined : String(planId));
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

        const plan = await adminUpdatePlan(planId, safeBody);
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
        const rawSearch = typeof req.query.q === 'string' ? req.query.q.trim() : '';
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

        const plans = await adminGetPlans(query);
        res.json(respond({ success: true, data: plans }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getPlanById = async (req: Request, res: Response) => {
    try {
        const planId = getRequiredPlanId(req);
        const plan = await adminGetPlanById(planId);
        if (!plan) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        res.json(respond({ success: true, data: plan }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : undefined;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};

export const togglePlan = async (req: Request, res: Response) => {
    try {
        const planId = getRequiredPlanId(req);
        const existing = await adminGetPlanById(planId);
        if (!existing) throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        const nextActive = !existing.active;
        const nextStatus = nextActive ? 'ACTIVE' : 'INACTIVE';
        const updated = await adminUpdatePlan(planId, { active: nextActive, status: nextStatus });
        await logAdminAction(req, 'TOGGLE_PLAN_STATUS', 'Plan', planId, { isActive: nextActive, status: nextStatus });
        res.json(respond({ success: true, data: updated }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : null;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};

export const archivePlan = async (req: Request, res: Response) => {
    try {
        const planId = getRequiredPlanId(req);
        const adminId = req.user?._id ? String(req.user._id) : 'system';
        const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;

        const plan = await adminArchivePlan(planId, adminId, reason);
        await logAdminAction(req, 'PLAN_ARCHIVED', 'Plan', planId, {
            archivedBy: adminId,
            archivedAt: (plan as unknown as Record<string, unknown>).archivedAt,
            reason,
        });
        res.json(respond({ success: true, data: plan, message: 'Plan archived successfully' }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : null;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};

export const restorePlan = async (req: Request, res: Response) => {
    try {
        const planId = getRequiredPlanId(req);
        const adminId = req.user?._id ? String(req.user._id) : 'system';

        const plan = await adminRestorePlan(planId, adminId);
        await logAdminAction(req, 'PLAN_RESTORED', 'Plan', planId, {
            restoredBy: adminId,
            restoredAt: (plan as unknown as Record<string, unknown>).restoredAt,
        });
        res.json(respond({ success: true, data: plan, message: 'Plan restored successfully' }));
    } catch (error: unknown) {
        const appError = error instanceof AppError ? error : null;
        sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error));
    }
};
