import { describe, expect, it } from "vitest";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import { smartAlertCriteriaBaseSchema, smartAlertBodyBaseSchema } from "@esparex/contracts";

describe("smartAlertFormSchema", () => {
    it("initializes without throwing top-level module evaluation errors", () => {
        expect(smartAlertFormSchema).toBeDefined();
        expect(smartAlertFormSchema.shape).toBeDefined();
        expect(smartAlertFormSchema.shape.category).toBeDefined();
        expect(smartAlertFormSchema.shape.location).toBeDefined();
    });

    it("accesses Base Schema shapes directly from @esparex/contracts without ZodEffects introspection", () => {
        expect(smartAlertCriteriaBaseSchema.shape).toBeDefined();
        expect(smartAlertCriteriaBaseSchema.shape.category).toBeDefined();
        expect(smartAlertCriteriaBaseSchema.shape.location).toBeDefined();

        expect(smartAlertBodyBaseSchema.shape).toBeDefined();
        expect(smartAlertBodyBaseSchema.shape.radiusKm).toBeDefined();
    });

    it("validates form data correctly", () => {
        const validData = {
            name: "iPhone Alerts",
            keywords: "iPhone 15 Pro",
            category: "mobiles",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it("rejects invalid alert name length", () => {
        const invalidData = {
            name: "ab", // Less than 3 chars
            keywords: "iPhone",
            category: "mobiles",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
