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
        // 1. Accumulate Limits (Stackable)
        const val = plan.credits || 0;
        if (plan.type === 'AD_PACK') acc.maxAds += val;
        if (plan.type === 'SMART_ALERT') acc.smartAlerts += val;
        if (plan.type === 'SPOTLIGHT') acc.spotlightCredits += val;

        // Legacy/Fallback check if limits structure exists
        if (plan.limits) {
            acc.maxAds += plan.limits.maxAds || 0;
            acc.maxServices += plan.limits.maxServices || 0;
            acc.maxParts += plan.limits.maxParts || 0;
            acc.smartAlerts += plan.limits.smartAlerts || 0;
            acc.spotlightCredits += plan.limits.spotlightCredits || 0;
        }

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
