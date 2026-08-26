import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { notify } from "@/lib/feedback";
import { subscribeAdminPopupEvents } from "@/lib/popup/popupEvents";

describe("Admin Feedback Notify Helper Suite", () => {
    beforeAll(() => {
        const g = globalThis as Record<string, unknown>;
        if (typeof window === "undefined") {
            g.window = {};
        }
    });

    afterAll(() => {
        const g = globalThis as Record<string, unknown>;
        delete g.window;
    });

    it("emits success popup correctly through notify.success", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminPopupEvents(listener);

        notify.success("Admin Operation Successful");

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                title: "Success",
                message: "Admin Operation Successful",
                open: true,
            })
        );

        unsubscribe();
    });

    it("emits error popup correctly through notify.error", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminPopupEvents(listener);

        notify.error("Action failed", { title: "Custom Error" });

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                title: "Custom Error",
                message: "Action failed",
                open: true,
            })
        );

        unsubscribe();
    });

    it("emits warning and info popups", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminPopupEvents(listener);

        notify.warning("Caution required");
        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "warning",
                title: "Warning",
                message: "Caution required",
                open: true,
            })
        );

        notify.info("Informational notice");
        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "info",
                title: "Info",
                message: "Informational notice",
                open: true,
            })
        );

        unsubscribe();
    });
});
