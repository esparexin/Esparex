"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlanPayload = exports.PLAN_SCALAR_FIELDS = exports.getRequiredPlanId = exports.getErrorMessage = exports.UserPlanModel = exports.PlanModel = void 0;
const PlanService_1 = require("@esparex/core/services/PlanService");
Object.defineProperty(exports, "PlanModel", { enumerable: true, get: function () { return PlanService_1.PlanModel; } });
Object.defineProperty(exports, "UserPlanModel", { enumerable: true, get: function () { return PlanService_1.UserPlanModel; } });
const AppError_1 = require("@esparex/core/utils/AppError");
const getErrorMessage = (error) => error instanceof Error ? error.message : 'Unexpected error';
exports.getErrorMessage = getErrorMessage;
const getRequiredPlanId = (req) => {
    const rawId = req.params.id;
    if (typeof rawId !== 'string' || !rawId.trim()) {
        throw new AppError_1.AppError('Invalid plan ID', 400, 'INVALID_PLAN_ID');
    }
    return rawId;
};
exports.getRequiredPlanId = getRequiredPlanId;
exports.PLAN_SCALAR_FIELDS = [
    'code',
    'name',
    'description',
    'price',
    'currency',
    'durationDays',
    'type',
    'userType',
    'credits',
    'active',
    'isDefault',
];
const buildPlanPayload = (body, adminId) => {
    const safeBody = {};
    if (adminId)
        safeBody.createdByAdmin = adminId;
    // Scalar fields
    exports.PLAN_SCALAR_FIELDS.forEach((key) => {
        if (body[key] !== undefined)
            safeBody[key] = body[key];
    });
    // Nested: limits
    if (body.limits && typeof body.limits === 'object' && !Array.isArray(body.limits)) {
        const l = body.limits;
        const limits = {};
        ['maxAds', 'maxServices', 'maxParts', 'smartAlerts', 'spotlightCredits'].forEach((k) => {
            if (l[k] !== undefined)
                limits[k] = Number(l[k]);
        });
        if (Object.keys(limits).length)
            safeBody.limits = limits;
    }
    // Nested: features
    if (body.features && typeof body.features === 'object' && !Array.isArray(body.features)) {
        const f = body.features;
        const features = {};
        if (f.priorityWeight !== undefined)
            features.priorityWeight = Number(f.priorityWeight);
        if (f.businessBadge !== undefined)
            features.businessBadge = Boolean(f.businessBadge);
        if (f.canEditAd !== undefined)
            features.canEditAd = Boolean(f.canEditAd);
        if (f.showOnHomePage !== undefined)
            features.showOnHomePage = Boolean(f.showOnHomePage);
        if (Object.keys(features).length)
            safeBody.features = features;
    }
    // Nested: smartAlertConfig (only relevant for SMART_ALERT type)
    if (body.smartAlertConfig && typeof body.smartAlertConfig === 'object' && !Array.isArray(body.smartAlertConfig)) {
        const s = body.smartAlertConfig;
        safeBody.smartAlertConfig = {
            maxAlerts: Number(s.maxAlerts ?? 0),
            matchFrequency: s.matchFrequency ?? 'daily',
            radiusLimitKm: Number(s.radiusLimitKm ?? 50),
            notificationChannels: Array.isArray(s.notificationChannels) ? s.notificationChannels : ['push'],
        };
    }
    return safeBody;
};
exports.buildPlanPayload = buildPlanPayload;
//# sourceMappingURL=shared.js.map