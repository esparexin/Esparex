import { describe, expect, it } from "vitest";

import { shouldShowLocationFirstVisitPrompt } from "@/context/locationPrompt";

describe("shouldShowLocationFirstVisitPrompt", () => {
    it("shows the prompt after delay when the app is still on the default location", () => {
        expect(
            shouldShowLocationFirstVisitPrompt({
                status: "available",
                source: "default",
                promptDismissed: false,
                isPermissionBlocked: false,
                promptDelayElapsed: true,
            })
        ).toBe(true);
    });

    it("does not show the prompt before the delay elapses", () => {
        expect(
            shouldShowLocationFirstVisitPrompt({
                status: "available",
                source: "default",
                promptDismissed: false,
                isPermissionBlocked: false,
                promptDelayElapsed: false,
            })
        ).toBe(false);
    });

    it("does not show the prompt after a manual or detected location is applied", () => {
        expect(
            shouldShowLocationFirstVisitPrompt({
                status: "manual",
                source: "manual",
                promptDismissed: false,
                isPermissionBlocked: false,
                promptDelayElapsed: true,
            })
        ).toBe(false);

        expect(
            shouldShowLocationFirstVisitPrompt({
                status: "available",
                source: "auto",
                promptDismissed: false,
                isPermissionBlocked: false,
                promptDelayElapsed: true,
            })
        ).toBe(false);
    });
});
