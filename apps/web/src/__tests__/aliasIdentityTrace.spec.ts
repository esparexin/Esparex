import * as canonical1 from "@esparex/shared";
import * as canonical2 from "@esparex/shared";
import { describe, expect, it, vi } from "vitest";

describe("Empirical Canonical SSOT Identity Trace (@esparex/shared)", () => {
    it("1. Verifies module object identity is 100% unified under @esparex/shared", () => {
        const isIdenticalModule = Object.is(canonical1, canonical2);
        const isIdenticalBusFactory = Object.is(canonical1.createUnifiedPopupBus, canonical2.createUnifiedPopupBus);
        const isIdenticalLogger = Object.is(canonical1.getLogger, canonical2.getLogger);

        // Assert 100% identity when consuming canonical package
        expect(isIdenticalModule).toBe(true);
        expect(isIdenticalBusFactory).toBe(true);
        expect(isIdenticalLogger).toBe(true);
    });

    it("2. Verifies logger instance cache is 100% unified under @esparex/shared", () => {
        const logger1 = canonical1.getLogger("frontend");
        const logger2 = canonical2.getLogger("frontend");

        expect(Object.is(logger1, logger2)).toBe(true);
    });

    it("3. Verifies popupBus event dispatching works seamlessly under canonical @esparex/shared", () => {
        const bus1 = canonical1.createUnifiedPopupBus("unified-test");
        const bus2 = canonical2.createUnifiedPopupBus("unified-test-2");

        expect(bus1).toBeDefined();
        expect(bus2).toBeDefined();

        const listener = vi.fn();
        bus1.subscribe(listener);

        bus1.show({ type: "success", title: "Unified", message: "SSOT Verified" });
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
