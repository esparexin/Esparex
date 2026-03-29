import { calculateUserPlan } from "../../services/PlanEngine";

describe("PlanEngine", () => {
    it("does not double count AD_PACK credits when both legacy credits and canonical limits exist", () => {
        const result = calculateUserPlan([
            {
                type: "AD_PACK",
                credits: 2,
                limits: {
                    maxAds: 2,
                },
            },
        ]);

        expect(result.maxAds).toBe(2);
    });

    it("does not double count SMART_ALERT credits when both legacy credits and canonical limits exist", () => {
        const result = calculateUserPlan([
            {
                type: "SMART_ALERT",
                credits: 50,
                limits: {
                    smartAlerts: 50,
                },
            },
        ]);

        expect(result.smartAlerts).toBe(50);
    });

    it("does not double count SPOTLIGHT credits when both legacy credits and canonical limits exist", () => {
        const result = calculateUserPlan([
            {
                type: "SPOTLIGHT",
                credits: 3,
                limits: {
                    spotlightCredits: 3,
                },
            },
        ]);

        expect(result.spotlightCredits).toBe(3);
    });
});
