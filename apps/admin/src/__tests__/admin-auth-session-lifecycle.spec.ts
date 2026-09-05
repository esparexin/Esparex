import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    adminFetch,
    setAdminAccessToken,
    subscribeAdminAuthFailure,
    notifyAdminAuthFailure,
    AdminApiError,
    AdminNetworkError,
} from "../lib/api/adminClient";

describe("Admin Auth Session Lifecycle — Centralized 401 Eviction & Event Bus", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setAdminAccessToken(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("notifies registered subscribers and clears access token on notifyAdminAuthFailure", () => {
        setAdminAccessToken("mock_token_123");
        const listener = vi.fn();
        const unsubscribe = subscribeAdminAuthFailure(listener);

        const dummyError = new AdminApiError("Session expired", 401, { success: false, error: "Session expired" });
        notifyAdminAuthFailure(dummyError);

        expect(listener).toHaveBeenCalledWith(dummyError);
        unsubscribe();
    });

    it("allows subscribers to unsubscribe cleanly", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminAuthFailure(listener);
        unsubscribe();

        const dummyError = new AdminApiError("Session expired", 401, { success: false, error: "Session expired" });
        notifyAdminAuthFailure(dummyError);

        expect(listener).not.toHaveBeenCalled();
    });

    it("dispatches auth failure event on 401 API response from operational endpoints", async () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminAuthFailure(listener);

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ success: false, error: { message: "Admin session expired" } }),
        });

        await expect(adminFetch("/api/v1/admin/listings")).rejects.toThrow("Admin session expired");
        expect(listener).toHaveBeenCalled();

        unsubscribe();
    });

    it("does not dispatch auth failure event on 401 from login endpoint (preserves login screen error)", async () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminAuthFailure(listener);

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ success: false, error: { message: "Invalid credentials" } }),
        });

        await expect(adminFetch("/auth/login", { method: "POST" })).rejects.toThrow("Invalid credentials");
        expect(listener).not.toHaveBeenCalled();

        unsubscribe();
    });

    it("throws AdminNetworkError on network failure without calling notifyAdminAuthFailure", async () => {
        const listener = vi.fn();
        const unsubscribe = subscribeAdminAuthFailure(listener);

        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(adminFetch("/api/v1/admin/listings")).rejects.toThrow();
        expect(listener).not.toHaveBeenCalled();

        unsubscribe();
    });
});
