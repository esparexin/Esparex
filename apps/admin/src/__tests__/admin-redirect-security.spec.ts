import { describe, it, expect } from "vitest";
import { normalizeAdminRedirectUrl } from "../lib/normalizeAdminRedirect";

describe("normalizeAdminRedirectUrl", () => {
    it("returns /dashboard for null/undefined/empty input", () => {
        expect(normalizeAdminRedirectUrl(null)).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl(undefined)).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl("")).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl("   ")).toBe("/dashboard");
    });

    it("accepts valid internal paths", () => {
        expect(normalizeAdminRedirectUrl("/ads")).toBe("/ads");
        expect(normalizeAdminRedirectUrl("/users/123")).toBe("/users/123");
        expect(normalizeAdminRedirectUrl("/settings")).toBe("/settings");
    });

    it("preserves query strings and hash fragments", () => {
        expect(normalizeAdminRedirectUrl("/ads?status=pending")).toBe("/ads?status=pending");
        expect(normalizeAdminRedirectUrl("/users#section")).toBe("/users#section");
    });

    it("rejects non-absolute paths (no leading /)", () => {
        expect(normalizeAdminRedirectUrl("ads")).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl("https://evil.com/ads")).toBe("/dashboard");
    });

    it("rejects protocol-relative URLs (//)", () => {
        expect(normalizeAdminRedirectUrl("//evil.com")).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl("//evil.com/ads")).toBe("/dashboard");
    });

    it("rejects URLs with CRLF (header injection)", () => {
        expect(normalizeAdminRedirectUrl("/ads\r\nSet-Cookie: hacked=true")).toBe("/dashboard");
        expect(normalizeAdminRedirectUrl("/ads\nX-Injected: true")).toBe("/dashboard");
    });

    it("normalizes double slashes in path", () => {
        expect(normalizeAdminRedirectUrl("//")).toBe("/dashboard");
    });

    it("handles encoded URLs safely", () => {
        // URL constructor decodes %3F to ? and %3D to = during normalization
        expect(normalizeAdminRedirectUrl("/ads%3Fstatus%3Dpending")).toBe("/ads?status=pending");
    });
});
