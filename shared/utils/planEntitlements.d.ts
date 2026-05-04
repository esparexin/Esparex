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
export declare function getNormalizedPlanLimits(plan: PlanEntitlementsLike | null | undefined): NormalizedPlanLimits;
export declare function getPrimaryPlanCreditCount(plan: PlanEntitlementsLike | null | undefined): number;
export {};
//# sourceMappingURL=planEntitlements.d.ts.map