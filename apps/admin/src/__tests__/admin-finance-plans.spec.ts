import { describe, it, expect } from "vitest";

describe("Admin Finance & Subscription Plans SSOT", () => {
    it("should recognize all valid plan types and fallback cleanly", () => {
        const PLAN_TYPES = new Set([
            "all",
            "FREE_DEFAULT",
            "AD_PACK",
            "BOOST_AD",
            "SPOTLIGHT",
            "SMART_ALERT",
        ]);

        const validatePlanType = (type: string | null | undefined): string => {
            if (!type) return "all";
            return PLAN_TYPES.has(type) ? type : "all";
        };

        expect(validatePlanType("FREE_DEFAULT")).toBe("FREE_DEFAULT");
        expect(validatePlanType("AD_PACK")).toBe("AD_PACK");
        expect(validatePlanType("BOOST_AD")).toBe("BOOST_AD");
        expect(validatePlanType("SPOTLIGHT")).toBe("SPOTLIGHT");
        expect(validatePlanType("SMART_ALERT")).toBe("SMART_ALERT");
        expect(validatePlanType("INVALID")).toBe("all");
        expect(validatePlanType(null)).toBe("all");
    });

    it("should correctly determine plan protection rules for default and system plans", () => {
        type PlanStub = {
            id: string;
            name: string;
            active: boolean;
            status?: string;
            isDefault?: boolean;
            isSystemPlan?: boolean;
        };

        const isPlanProtected = (plan: PlanStub): boolean => {
            const status = plan.status ?? (plan.active ? "ACTIVE" : "INACTIVE");
            const isActive = status === "ACTIVE";
            return Boolean((plan.isDefault && isActive) || plan.isSystemPlan);
        };

        const defaultActivePlan: PlanStub = {
            id: "plan_free",
            name: "Free Basic",
            active: true,
            isDefault: true,
        };
        expect(isPlanProtected(defaultActivePlan)).toBe(true);

        const systemProtectedPlan: PlanStub = {
            id: "plan_sys",
            name: "Internal System Plan",
            active: false,
            isSystemPlan: true,
        };
        expect(isPlanProtected(systemProtectedPlan)).toBe(true);

        const regularAdPack: PlanStub = {
            id: "plan_ad_10",
            name: "10 Ad Pack",
            active: true,
            isDefault: false,
            isSystemPlan: false,
        };
        expect(isPlanProtected(regularAdPack)).toBe(false);
    });
});
