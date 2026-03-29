import { Request } from 'express';
import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import { AppError } from '../../utils/AppError';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export const getRequiredPlanId = (req: Request): string => {
    const rawId = req.params.id;
    if (typeof rawId !== 'string' || !rawId.trim()) {
        throw new AppError('Invalid plan ID', 400, 'INVALID_PLAN_ID');
    }
    return rawId;
};

export const PlanModel = Plan as unknown as {
    create: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | Record<string, unknown>[]>;
    findByIdAndUpdate: (id: string, payload: Record<string, unknown>, options: { new: boolean }) => Promise<unknown>;
    find: (query: Record<string, unknown>) => {
        sort: (sort: Record<string, 1 | -1>) => Promise<unknown[]>;
        lean: () => Promise<unknown[]>;
    };
    findById: (id: string) => Promise<{ active: boolean; save: () => Promise<unknown> } | null>;
    findOne: (query: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
};

export const UserPlanModel = UserPlan as unknown as {
    find: (query: Record<string, unknown>) => {
        lean: () => Promise<Array<{ planId: unknown }>>;
    } & PromiseLike<unknown>;
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

export const buildPlanPayload = (body: Record<string, unknown>) => {
    const safeBody: Record<string, unknown> = {};

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
