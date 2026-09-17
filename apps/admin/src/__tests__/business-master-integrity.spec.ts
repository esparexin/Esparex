import { describe, it, expect } from "vitest";
import { ADMIN_NAV_MODULES, getAdminModuleByPath } from "../components/layout/adminNavigation";

const DEFAULT_STATUS = "all";
const BUSINESS_MASTER_STATUSES = new Set(["all", "live", "suspended", "pending", "expired", "deactivated", "deleted"]);

const normalizeStatus = (status?: string | null): string => {
    if (!status || status === "all") return DEFAULT_STATUS;
    if (status === "approved" || status === "active") return "live";
    if (BUSINESS_MASTER_STATUSES.has(status)) return status;
    return DEFAULT_STATUS;
};

const simulateStatusTransition = (
    currentParams: Record<string, string | null>,
    nextStatus: string
): Record<string, string | null> => {
    return {
        ...currentParams,
        status: nextStatus === "all" ? null : nextStatus,
        page: null,
        expiringIn3Days: null,
        warningSent: null,
        warningNotSent: null,
    };
};

const simulateExpiringCardClick = (
    currentParams: Record<string, string | null>
): Record<string, string | null> => {
    const isAlreadyActive = currentParams.expiringIn3Days === "true";
    return {
        ...currentParams,
        expiringIn3Days: isAlreadyActive ? null : "true",
        page: null,
        warningSent: null,
        warningNotSent: null,
    };
};

describe("Business Master Integrity — Canonical Navigation & State Transitions", () => {
    describe("Navigation SSOT", () => {
        it("links Business Master to the canonical /businesses route without injecting status=pending", () => {
            const businessModule = ADMIN_NAV_MODULES.find((item) => item.key === "businessMaster");
            expect(businessModule).toBeDefined();
            expect(businessModule?.href).toBe("/businesses");
            expect(businessModule?.href).not.toContain("status=pending");
        });

        it("resolves /businesses correctly through getAdminModuleByPath", () => {
            const resolved = getAdminModuleByPath("/businesses");
            expect(resolved?.key).toBe("businessMaster");
        });
    });

    describe("Status Normalization & Query Resolution", () => {
        it('normalizes missing or empty status to "all" without defaulting to "live"', () => {
            expect(normalizeStatus(null)).toBe("all");
            expect(normalizeStatus("")).toBe("all");
            expect(normalizeStatus("all")).toBe("all");
        });

        it('normalizes historical "approved" and "active" to "live"', () => {
            expect(normalizeStatus("approved")).toBe("live");
            expect(normalizeStatus("active")).toBe("live");
        });

        it('preserves valid discrete statuses', () => {
            expect(normalizeStatus("live")).toBe("live");
            expect(normalizeStatus("pending")).toBe("pending");
            expect(normalizeStatus("suspended")).toBe("suspended");
            expect(normalizeStatus("expired")).toBe("expired");
            expect(normalizeStatus("deactivated")).toBe("deactivated");
            expect(normalizeStatus("deleted")).toBe("deleted");
        });

        it('falls back to "all" for unknown or arbitrary statuses to prevent query hijacking', () => {
            expect(normalizeStatus("expiring")).toBe("all");
            expect(normalizeStatus("unknown")).toBe("all");
            expect(normalizeStatus("hack")).toBe("all");
        });
    });

    describe("Filter Transitions & Sticky Trap Elimination", () => {
        it("switching status from All to Pending clears incompatible secondary filters", () => {
            const initialParams: Record<string, string | null> = {
                status: null,
                expiringIn3Days: "true",
                warningSent: "true",
                warningNotSent: null,
                page: "3",
            };

            const nextParams = simulateStatusTransition(initialParams, "pending");

            expect(nextParams.status).toBe("pending");
            expect(nextParams.expiringIn3Days).toBeNull();
            expect(nextParams.warningSent).toBeNull();
            expect(nextParams.warningNotSent).toBeNull();
            expect(nextParams.page).toBeNull();
        });

        it("switching to All from any status resets expiringIn3Days to prevent the 0-results trap", () => {
            const trappedParams: Record<string, string | null> = {
                status: "live",
                expiringIn3Days: "true",
                warningSent: null,
                warningNotSent: null,
                page: null,
            };

            const restoredParams = simulateStatusTransition(trappedParams, "all");

            expect(restoredParams.status).toBeNull();
            expect(restoredParams.expiringIn3Days).toBeNull();
            expect(normalizeStatus(restoredParams.status)).toBe("all");
        });

        it("toggling the Expiring (3d) card sets expiringIn3Days=true and clears warning filters", () => {
            const initialParams: Record<string, string | null> = {
                status: null,
                expiringIn3Days: null,
                warningSent: "true",
                warningNotSent: null,
                page: "2",
            };

            const activated = simulateExpiringCardClick(initialParams);
            expect(activated.expiringIn3Days).toBe("true");
            expect(activated.warningSent).toBeNull();
            expect(activated.page).toBeNull();

            const deactivated = simulateExpiringCardClick(activated);
            expect(deactivated.expiringIn3Days).toBeNull();
        });
    });
});
