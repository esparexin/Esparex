"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNormalizedPlanLimits = getNormalizedPlanLimits;
exports.getPrimaryPlanCreditCount = getPrimaryPlanCreditCount;
const toNonNegativeInt = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }
    return Math.max(0, Math.trunc(value));
};
const preferCanonical = (canonical, fallback) => {
    const normalizedCanonical = toNonNegativeInt(canonical);
    if (normalizedCanonical !== null) {
        return normalizedCanonical;
    }
    return toNonNegativeInt(fallback) ?? 0;
};
function getNormalizedPlanLimits(plan) {
    const limits = plan?.limits;
    const legacyCredits = plan?.credits;
    return {
        maxAds: plan?.type === "AD_PACK"
            ? preferCanonical(limits?.maxAds, legacyCredits)
            : (toNonNegativeInt(limits?.maxAds) ?? 0),
        maxServices: toNonNegativeInt(limits?.maxServices) ?? 0,
        maxParts: toNonNegativeInt(limits?.maxParts) ?? 0,
        smartAlerts: plan?.type === "SMART_ALERT"
            ? preferCanonical(limits?.smartAlerts, legacyCredits)
            : (toNonNegativeInt(limits?.smartAlerts) ?? 0),
        spotlightCredits: plan?.type === "SPOTLIGHT"
            ? preferCanonical(limits?.spotlightCredits, legacyCredits)
            : (toNonNegativeInt(limits?.spotlightCredits) ?? 0),
    };
}
function getPrimaryPlanCreditCount(plan) {
    const normalized = getNormalizedPlanLimits(plan);
    switch (plan?.type) {
        case "AD_PACK":
            return normalized.maxAds;
        case "SMART_ALERT":
            return normalized.smartAlerts;
        case "SPOTLIGHT":
            return normalized.spotlightCredits;
        default:
            return toNonNegativeInt(plan?.credits) ?? 0;
    }
}
//# sourceMappingURL=planEntitlements.js.map