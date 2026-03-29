import { getNormalizedPlanLimits } from '@shared/utils/planEntitlements';

interface PlanLike {
    credits?: number;
    type?: 'AD_PACK' | 'SMART_ALERT' | 'SPOTLIGHT' | string;
    limits?: {
        maxAds?: number;
        smartAlerts?: number;
        spotlightCredits?: number;
        maxServices?: number;
        maxParts?: number;
    };
    features?: {
        priorityWeight?: number;
        businessBadge?: boolean;
        canEditAd?: boolean;
    };
}

interface UserPlanPermissions {
    maxAds: number;
    maxServices: number;
    maxParts: number;
    smartAlerts: number;
    spotlightCredits: number;
    priorityScore: number;
    businessBadge: boolean;
    canEditAd: boolean;
}

export function calculateUserPlan(plans: Array<PlanLike | unknown>): UserPlanPermissions {
    return plans.reduce<UserPlanPermissions>((acc, rawPlan) => {
        const plan = (rawPlan || {}) as PlanLike;
        const normalizedLimits = getNormalizedPlanLimits(plan);

        // 1. Accumulate Limits (Stackable)
        acc.maxAds += normalizedLimits.maxAds;
        acc.maxServices += normalizedLimits.maxServices;
        acc.maxParts += normalizedLimits.maxParts;
        acc.smartAlerts += normalizedLimits.smartAlerts;
        acc.spotlightCredits += normalizedLimits.spotlightCredits;

        // 2. Priority Score (Take Max, e.g., Elite > Free)
        acc.priorityScore = Math.max(
            acc.priorityScore,
            plan.features?.priorityWeight || 0
        );

        // 3. Boolean Features (OR logic)
        acc.businessBadge = acc.businessBadge || Boolean(plan.features?.businessBadge);
        acc.canEditAd = acc.canEditAd || Boolean(plan.features?.canEditAd);

        return acc;
    }, {
        maxAds: 0,
        maxServices: 0,
        maxParts: 0,
        smartAlerts: 0,
        spotlightCredits: 0,
        priorityScore: 0,
        businessBadge: false,
        canEditAd: false
    });
}
