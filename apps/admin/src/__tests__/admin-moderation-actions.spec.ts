import { describe, it, expect } from "vitest";

describe("Admin Moderation Actions & Batch Workflows SSOT", () => {
    it("should format rejection reason with and without optional comment correctly", () => {
        const formatRejectionReason = (reason: string, comment?: string): string => {
            const normalized = (comment || "").trim();
            if (!normalized) return reason;
            return `${reason}: ${normalized}`;
        };

        expect(formatRejectionReason("Spam")).toBe("Spam");
        expect(formatRejectionReason("Fraud", "   ")).toBe("Fraud");
        expect(formatRejectionReason("Prohibited Item", "Fake invoice attached")).toBe(
            "Prohibited Item: Fake invoice attached"
        );
    });

    it("should properly normalize moderation status filters", () => {
        const allowedStatuses = new Set([
            "pending",
            "live",
            "rejected",
            "deactivated",
            "sold",
            "expired",
            "all",
        ]);

        const normalizeStatus = (status: string | null | undefined): string => {
            if (!status) return "pending";
            return allowedStatuses.has(status) ? status : "all";
        };

        expect(normalizeStatus("pending")).toBe("pending");
        expect(normalizeStatus("live")).toBe("live");
        expect(normalizeStatus("rejected")).toBe("rejected");
        expect(normalizeStatus("invalid_status")).toBe("all");
        expect(normalizeStatus(null)).toBe("pending");
    });

    it("should handle batch selection set calculations correctly", () => {
        const allItemIds = ["ad_1", "ad_2", "ad_3", "ad_4"];
        let selectedIds = new Set<string>(["ad_1", "ad_2"]);

        // Toggle single item off
        const toggleItem = (set: Set<string>, id: string): Set<string> => {
            const next = new Set(set);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        };

        selectedIds = toggleItem(selectedIds, "ad_2");
        expect(Array.from(selectedIds)).toEqual(["ad_1"]);

        // Toggle single item on
        selectedIds = toggleItem(selectedIds, "ad_3");
        expect(Array.from(selectedIds).sort()).toEqual(["ad_1", "ad_3"]);

        // Toggle select all
        const toggleSelectAll = (set: Set<string>, allIds: string[]): Set<string> => {
            return set.size === allIds.length ? new Set() : new Set(allIds);
        };

        selectedIds = toggleSelectAll(selectedIds, allItemIds);
        expect(selectedIds.size).toBe(4);

        selectedIds = toggleSelectAll(selectedIds, allItemIds);
        expect(selectedIds.size).toBe(0);
    });
});
