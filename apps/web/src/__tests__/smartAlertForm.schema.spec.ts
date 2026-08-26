import { describe, expect, it } from "vitest";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import { smartAlertCriteriaBaseSchema, smartAlertBodyBaseSchema } from "@esparex/contracts";

describe("smartAlertFormSchema", () => {
    it("initializes without throwing top-level module evaluation errors", () => {
        expect(smartAlertFormSchema).toBeDefined();
    });

    it("accesses Base Schema shapes directly from @esparex/contracts", () => {
        expect(smartAlertCriteriaBaseSchema.shape).toBeDefined();
        expect(smartAlertCriteriaBaseSchema.shape.category).toBeDefined();
        expect(smartAlertCriteriaBaseSchema.shape.location).toBeDefined();

        expect(smartAlertBodyBaseSchema.shape).toBeDefined();
        expect(smartAlertBodyBaseSchema.shape.radiusKm).toBeDefined();
    });

    it("validates form data when model is selected (keywords optional)", () => {
        const validDataWithModel = {
            name: "iPhone Alerts",
            category: "mobiles",
            brand: "Apple",
            model: "iPhone 12",
            keywords: "",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(validDataWithModel);
        expect(result.success).toBe(true);
    });

    it("validates form data when model is empty but keywords provided", () => {
        const validDataWithKeywords = {
            name: "LED TV Alerts",
            category: "electronics",
            brand: "LG",
            model: "",
            keywords: "OLED 55 inch",
            location: "Mumbai",
            radiusKm: 50,
            notificationChannels: ["push"],
        };

        const result = smartAlertFormSchema.safeParse(validDataWithKeywords);
        expect(result.success).toBe(true);
    });

    it("rejects when brand is missing", () => {
        const missingBrandData = {
            name: "Alert Test",
            category: "mobiles",
            brand: "",
            keywords: "iPhone",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(missingBrandData);
        expect(result.success).toBe(false);
    });

    it("rejects when no model is selected AND keywords are empty", () => {
        const missingBothData = {
            name: "Alert Test",
            category: "mobiles",
            brand: "Apple",
            model: "",
            keywords: "",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(missingBothData);
        expect(result.success).toBe(false);
    });

    it("rejects gibberish search keywords using @esparex/shared textValidator", () => {
        const gibberishData = {
            name: "iPhone Alerts",
            keywords: "bcdfghjklmnpqrstvwxyz", // Consonant mash
            category: "mobiles",
            brand: "Apple",
            model: "",
            location: "Bengaluru",
            radiusKm: 25,
            notificationChannels: ["email"],
        };

        const result = smartAlertFormSchema.safeParse(gibberishData);
        expect(result.success).toBe(false);
    });
});
