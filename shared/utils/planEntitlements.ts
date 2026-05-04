type NumericLike = number | null | undefined;

export type PlanEntitlementsLike = {
    type?: "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT" | string | null;
    credits?: NumericLike;
    limits?: {
        maxAds?: NumericLike;
        maxServices?: NumericLike;
        maxParts?: NumericLike;
        smartAlerts?: NumericLike;
        spotlightCredits?: NumericLike;
    } | null;
};

export type NormalizedPlanLimits = {
    maxAds: number;
    maxServices: number;
    maxParts: number;
    smartAlerts: number;
    spotlightCredits: number;
};

const toNonNegativeInt = (value: NumericLike): number | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }

    return Math.max(0, Math.trunc(value));
};

const preferCanonical = (canonical: NumericLike, fallback: NumericLike): number => {
    const normalizedCanonical = toNonNegativeInt(canonical);
    if (normalizedCanonical !== null) {
        return normalizedCanonical;
    }

    return toNonNegativeInt(fallback) ?? 0;
};

export function getNormalizedPlanLimits(plan: PlanEntitlementsLike | null | undefined): NormalizedPlanLimits {
    const limits = plan?.limits;
    const legacyCredits = plan?.credits;

    return {
        maxAds:
            plan?.type === "AD_PACK"
                ? preferCanonical(limits?.maxAds, legacyCredits)
                : (toNonNegativeInt(limits?.maxAds) ?? 0),
        maxServices: toNonNegativeInt(limits?.maxServices) ?? 0,
        maxParts: toNonNegativeInt(limits?.maxParts) ?? 0,
        smartAlerts:
            plan?.type === "SMART_ALERT"
                ? preferCanonical(limits?.smartAlerts, legacyCredits)
                : (toNonNegativeInt(limits?.smartAlerts) ?? 0),
        spotlightCredits:
            plan?.type === "SPOTLIGHT"
                ? preferCanonical(limits?.spotlightCredits, legacyCredits)
                : (toNonNegativeInt(limits?.spotlightCredits) ?? 0),
    };
}

export function getPrimaryPlanCreditCount(plan: PlanEntitlementsLike | null | undefined): number {
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
