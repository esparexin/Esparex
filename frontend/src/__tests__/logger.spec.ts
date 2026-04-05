import { afterEach, describe, expect, it, vi } from "vitest";

import { createUniversalLogger } from "../../../shared/observability/logger";

describe("UniversalLogger", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("serializes Error metadata instead of logging empty objects", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const logger = createUniversalLogger("frontend");
        const error = Object.assign(new Error("Boom"), { code: "VALIDATION_FAILED" });

        logger.error("Failed to create listing", error);

        expect(spy).toHaveBeenCalledTimes(1);
        const [formatted] = spy.mock.calls[0] ?? [];
        expect(String(formatted)).toContain("Boom");
        expect(String(formatted)).toContain("VALIDATION_FAILED");
    });
});
