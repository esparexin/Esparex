"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePlan = exports.getPlans = exports.updatePlan = exports.createPlan = void 0;
const adminLogger_1 = require("@core/utils/adminLogger");
const respond_1 = require("@core/utils/respond");
const errorResponse_1 = require("@core/utils/errorResponse");
const AppError_1 = require("@core/utils/AppError");
const stringUtils_1 = require("@core/utils/stringUtils");
const shared_1 = require("./shared");
const PlanService_1 = require("@core/services/PlanService");
const createPlan = async (req, res) => {
    try {
        const adminId = req.user?._id ? String(req.user._id) : undefined;
        const safeBody = (0, shared_1.buildPlanPayload)(req.body, adminId);
        const plan = await (0, PlanService_1.adminCreatePlan)(safeBody);
        const planId = plan._id;
        await (0, adminLogger_1.logAdminAction)(req, 'CREATE_PLAN', 'Plan', planId == null ? undefined : String(planId));
        res.status(201).json((0, respond_1.respond)({ success: true, data: plan }));
    }
    catch (error) {
        const err = error;
        (0, errorResponse_1.sendErrorResponse)(req, res, 400, err.message);
    }
};
exports.createPlan = createPlan;
const updatePlan = async (req, res) => {
    try {
        const planId = (0, shared_1.getRequiredPlanId)(req);
        const safeBody = (0, shared_1.buildPlanPayload)(req.body);
        const plan = await (0, PlanService_1.adminUpdatePlan)(planId, safeBody);
        if (!plan) {
            throw new AppError_1.AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        }
        await (0, adminLogger_1.logAdminAction)(req, 'UPDATE_PLAN', 'Plan', planId, { updates: safeBody });
        res.json((0, respond_1.respond)({ success: true, data: plan }));
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : null;
        (0, errorResponse_1.sendErrorResponse)(req, res, appError?.statusCode ?? 400, (0, shared_1.getErrorMessage)(error));
    }
};
exports.updatePlan = updatePlan;
const getPlans = async (req, res) => {
    try {
        const rawSearch = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const rawType = typeof req.query.type === 'string' ? req.query.type.trim() : '';
        const query = {};
        if (rawType && rawType !== 'all') {
            query.type = rawType.toUpperCase();
        }
        if (rawSearch) {
            const safeSearch = (0, stringUtils_1.escapeRegExp)(rawSearch);
            query.$or = [
                { code: { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
            ];
        }
        const plans = await (0, PlanService_1.adminGetPlans)(query);
        res.json((0, respond_1.respond)({ success: true, data: plans }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, (0, shared_1.getErrorMessage)(error));
    }
};
exports.getPlans = getPlans;
const togglePlan = async (req, res) => {
    try {
        const planId = (0, shared_1.getRequiredPlanId)(req);
        const plan = await (0, PlanService_1.adminGetPlanById)(planId);
        if (!plan)
            throw new AppError_1.AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
        plan.active = !plan.active;
        await plan.save();
        await (0, adminLogger_1.logAdminAction)(req, 'TOGGLE_PLAN_STATUS', 'Plan', planId, { isActive: plan.active });
        res.json((0, respond_1.respond)({ success: true, data: plan }));
    }
    catch (error) {
        const appError = error instanceof AppError_1.AppError ? error : null;
        (0, errorResponse_1.sendErrorResponse)(req, res, appError?.statusCode ?? 400, (0, shared_1.getErrorMessage)(error));
    }
};
exports.togglePlan = togglePlan;
//# sourceMappingURL=planAdminController.js.map