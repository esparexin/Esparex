import { Request } from 'express';
import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export const isAdminUser = (req: Request): boolean =>
    Boolean(req.user && ['admin', 'super_admin'].includes(req.user.role));

export const getRequiredPlanId = (req: Request): string => {
    const rawId = req.params.id;
    if (typeof rawId !== 'string' || !rawId.trim()) {
        throw new Error('Invalid plan ID');
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

export const PLAN_ALLOWED_FIELDS = [
    'name',
    'description',
    'price',
    'durationDays',
    'features',
    'type',
    'maxAds',
    'formattedFeatures',
    'active',
    'userType',
    'highlight',
    'spotlightCredits',
    'smartAlerts'
] as const;

export const buildPlanPayload = (body: Record<string, unknown>) => {
    const safeBody: Record<string, unknown> = {};
    PLAN_ALLOWED_FIELDS.forEach((key) => {
        if (body[key] !== undefined) safeBody[key] = body[key];
    });
    return safeBody;
};
