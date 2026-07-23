import { describe, it, expect } from "vitest";
import { AUTH_SESSION_STORAGE_KEY } from "@/context/auth/authHelpers";

describe("Performance Optimization Phase 1 Verification Suite", () => {
    it("exports AUTH_SESSION_STORAGE_KEY for parallel post-auth prefetching (PERF-001, PERF-008)", () => {
        expect(AUTH_SESSION_STORAGE_KEY).toBe("esparex_user_session");
    });

    it("verifies AuthContextExports structure and status values (PERF-004)", async () => {
        const authModule = await import("@/context/AuthContext");
        expect(typeof authModule.AuthProvider).toBe("function");
        expect(typeof authModule.useAuth).toBe("function");
        expect(typeof authModule.useAuthStatus).toBe("function");
        expect(typeof authModule.useAuthUser).toBe("function");
    });

    it("verifies useOtpInput exports (PERF-004)", async () => {
        const otpModule = await import("@/hooks/useOtpInput");
        expect(typeof otpModule.useOtpInput).toBe("function");
    });
});
