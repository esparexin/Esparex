"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserPlan = calculateUserPlan;
const planEntitlements_1 = require("@esparex/shared/utils/planEntitlements");
function calculateUserPlan(plans) {
    return plans.reduce((acc, rawPlan) => {
        const plan = (rawPlan || {});
        const normalizedLimits = (0, planEntitlements_1.getNormalizedPlanLimits)(plan);
        // 1. Accumulate Limits (Stackable)
        acc.maxAds += normalizedLimits.maxAds;
        acc.maxServices += normalizedLimits.maxServices;
        acc.maxParts += normalizedLimits.maxParts;
        acc.smartAlerts += normalizedLimits.smartAlerts;
        acc.spotlightCredits += normalizedLimits.spotlightCredits;
        // 2. Priority Score (Take Max, e.g., Elite > Free)
        acc.priorityScore = Math.max(acc.priorityScore, plan.features?.priorityWeight || 0);
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
//# sourceMappingURL=PlanEngine.js.map