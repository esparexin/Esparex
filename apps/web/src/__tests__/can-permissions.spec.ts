import { describe, it, expect } from "vitest";
import { can } from "@/permissions/can";
import type { User } from "@/types/User";

describe("can() Permission Governance Test Suite", () => {
    const baseUser: User = {
        id: "user_1",
        role: "user",
        mobile: "9876543210",
        isPhoneVerified: true,
        businessStatus: "none",
    };

    it("should allow any user to post regular ads", () => {
        expect(can("postAd", baseUser)).toBe(true);
    });

    it("should block non-business user from postService and postParts", () => {
        expect(can("postService", baseUser)).toBe(false);
        expect(can("postParts", baseUser)).toBe(false);
        expect(can("accessBusinessDashboard", baseUser)).toBe(false);
    });

    it("should block pending business user from postService and postParts", () => {
        const pendingUser: User = { ...baseUser, businessStatus: "pending" };
        expect(can("postService", pendingUser)).toBe(false);
        expect(can("postParts", pendingUser)).toBe(false);
        expect(can("accessBusinessDashboard", pendingUser)).toBe(false);
    });

    it("should grant approved business user (businessStatus=live) access to postService and postParts without mutating role", () => {
        const approvedUser: User = { ...baseUser, role: "user", businessStatus: "live" };
        expect(can("postService", approvedUser)).toBe(true);
        expect(can("postParts", approvedUser)).toBe(true);
        expect(can("accessBusinessDashboard", approvedUser)).toBe(true);
        expect(approvedUser.role).toBe("user"); // Zero role mutation
    });

    it("should allow platform admin and super_admin to access all features regardless of businessStatus", () => {
        const adminUser: User = { ...baseUser, role: "admin", businessStatus: "none" };
        const superAdminUser: User = { ...baseUser, role: "super_admin", businessStatus: "none" };
        const moderatorUser: User = { ...baseUser, role: "moderator", businessStatus: "none" };

        expect(can("postService", adminUser)).toBe(true);
        expect(can("postParts", superAdminUser)).toBe(true);
        expect(can("accessBusinessDashboard", moderatorUser)).toBe(true);
    });
});
