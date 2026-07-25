import * as canonical from "@esparex/shared";
import * as legacy from "@shared";
import { describe, expect, it, vi } from "vitest";

describe("Empirical Alias Identity Trace (@shared vs @esparex/shared)", () => {
    it("1. Verifies module object identity between @shared and @esparex/shared", () => {
        const isIdenticalModule = Object.is(legacy, canonical);
        const isIdenticalBusFactory = Object.is(legacy.createUnifiedPopupBus, canonical.createUnifiedPopupBus);
        const isIdenticalLogger = Object.is(legacy.getLogger, canonical.getLogger);

        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy, canonical): ${isIdenticalModule}`);
        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy.createUnifiedPopupBus, canonical.createUnifiedPopupBus): ${isIdenticalBusFactory}`);
        console.log(`[EMPIRICAL IDENTITY TRACE] Object.is(legacy.getLogger, canonical.getLogger): ${isIdenticalLogger}`);

        // EMPIRICAL PROOF 1: Module namespace objects and exported function references are distinct
        expect(isIdenticalModule).toBe(false);
        expect(isIdenticalBusFactory).toBe(false);
        expect(isIdenticalLogger).toBe(false);
    });

    it("2. Verifies singleton instance cache isolation between @shared and @esparex/shared", () => {
        // Fetch cached logger instance for category "frontend" via both specifiers
        const loggerLegacy = legacy.getLogger("frontend");
        const loggerCanonical = canonical.getLogger("frontend");

        const isIdenticalLoggerInstance = Object.is(loggerLegacy, loggerCanonical);
        console.log(`[EMPIRICAL SINGLETON TRACE] Object.is(loggerLegacy, loggerCanonical): ${isIdenticalLoggerInstance}`);

        // EMPIRICAL PROOF 2: The internal logger instance cache map is evaluated per module instance,
        // producing two separate cached logger instances in memory.
        expect(isIdenticalLoggerInstance).toBe(false);
    });

    it("3. Verifies popupBus event subscription listener isolation when built across specifiers", () => {
        const legacyBus = legacy.createUnifiedPopupBus("isolation-test");
        const canonicalBus = canonical.createUnifiedPopupBus("isolation-test");

        const listenerLegacy = vi.fn();
        const listenerCanonical = vi.fn();

        legacyBus.subscribe(listenerLegacy);
        canonicalBus.subscribe(listenerCanonical);

        // Emit on legacy bus
        legacyBus.show({ type: "info", title: "Legacy", message: "Test" });

        // Legacy listener called, Canonical listener NOT called due to bus instance isolation
        expect(listenerLegacy).toHaveBeenCalledTimes(1);
        expect(listenerCanonical).toHaveBeenCalledTimes(0);
    });
});
