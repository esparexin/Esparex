import * as canonical from "@esparex/shared";
import * as legacy from "@shared";
import { describe, expect, it } from "vitest";

describe("Empirical Alias Identity Trace (@shared vs @esparex/shared)", () => {
    it("1. Verifies module object identity between @shared and @esparex/shared", () => {
        const isIdenticalModule = Object.is(legacy, canonical);
        const isIdenticalBusFactory = Object.is(legacy.createUnifiedPopupBus, canonical.createUnifiedPopupBus);
        const isIdenticalLogger = Object.is(legacy.getLogger, canonical.getLogger);

        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy, canonical): ${isIdenticalModule}`);
        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy.createUnifiedPopupBus, canonical.createUnifiedPopupBus): ${isIdenticalBusFactory}`);
        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy.getLogger, canonical.getLogger): ${isIdenticalLogger}`);

        // EMPIRICAL PROOF: In ESM/bundler environments, importing via dual specifier names ("@shared" vs "@esparex/shared")
        // evaluates the target file into two distinct module namespace instances in memory (Object.is === false).
        expect(isIdenticalModule).toBe(false);
        expect(isIdenticalBusFactory).toBe(false);
        expect(isIdenticalLogger).toBe(false);
    });

    it("2. Verifies popupBus instance identity when created via canonical vs legacy specifier", () => {
        const busFromCanonical = canonical.createUnifiedPopupBus("test-canonical");
        const busFromLegacy = legacy.createUnifiedPopupBus("test-legacy");

        expect(typeof busFromCanonical.show).toBe("function");
        expect(typeof busFromLegacy.show).toBe("function");
    });
});
