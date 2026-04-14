import { Request } from 'express';
import { PlanModel, UserPlanModel } from '../../services/PlanService';
import { AppError } from '../../utils/AppError';

export { PlanModel, UserPlanModel };

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export const getRequiredPlanId = (req: Request): string => {
    const rawId = req.params.id;
    if (typeof rawId !== 'string' || !rawId.trim()) {
        throw new AppError('Invalid plan ID', 400, 'INVALID_PLAN_ID');
    }
    return rawId;
};

export const PLAN_SCALAR_FIELDS = [
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
] as const;

export const buildPlanPayload = (body: Record<string, unknown>, adminId?: string) => {
    const safeBody: Record<string, unknown> = {};

    if (adminId) safeBody.createdByAdmin = adminId;

    // Scalar fields
    PLAN_SCALAR_FIELDS.forEach((key) => {
        if (body[key] !== undefined) safeBody[key] = body[key];
    });

    // Nested: limits
    if (body.limits && typeof body.limits === 'object' && !Array.isArray(body.limits)) {
        const l = body.limits as Record<string, unknown>;
        const limits: Record<string, unknown> = {};
        ['maxAds', 'maxServices', 'maxParts', 'smartAlerts', 'spotlightCredits'].forEach((k) => {
            if (l[k] !== undefined) limits[k] = Number(l[k]);
        });
        if (Object.keys(limits).length) safeBody.limits = limits;
    }

    // Nested: features
    if (body.features && typeof body.features === 'object' && !Array.isArray(body.features)) {
        const f = body.features as Record<string, unknown>;
        const features: Record<string, unknown> = {};
        if (f.priorityWeight !== undefined) features.priorityWeight = Number(f.priorityWeight);
        if (f.businessBadge !== undefined) features.businessBadge = Boolean(f.businessBadge);
        if (f.canEditAd !== undefined) features.canEditAd = Boolean(f.canEditAd);
        if (f.showOnHomePage !== undefined) features.showOnHomePage = Boolean(f.showOnHomePage);
        if (Object.keys(features).length) safeBody.features = features;
    }

    // Nested: smartAlertConfig (only relevant for SMART_ALERT type)
    if (body.smartAlertConfig && typeof body.smartAlertConfig === 'object' && !Array.isArray(body.smartAlertConfig)) {
        const s = body.smartAlertConfig as Record<string, unknown>;
        safeBody.smartAlertConfig = {
            maxAlerts: Number(s.maxAlerts ?? 0),
            matchFrequency: s.matchFrequency ?? 'daily',
            radiusLimitKm: Number(s.radiusLimitKm ?? 50),
            notificationChannels: Array.isArray(s.notificationChannels) ? s.notificationChannels : ['push'],
        };
    }

    return safeBody;
};
