import { describe, expect, it } from "vitest";
import { REPORT_REASON } from "@shared/enums/reportReason";

import { buildAdReportPayload, normalizeReportTargetId } from "@/lib/listings/adReportPayload";

describe("ad report payload", () => {
    it("builds a canonical ad report payload and preserves legacy compatibility fields", () => {
        const payload = buildAdReportPayload({
            adId: " 507f1f77bcf86cd799439011 ",
            adTitle: "iPhone 15 Pro Max",
            reason: REPORT_REASON.SCAM,
            additionalInfo: "  Asking for payment before showing the device.  ",
        });

        expect(payload).toEqual({
            targetType: "ad",
            targetId: "507f1f77bcf86cd799439011",
            adId: "507f1f77bcf86cd799439011",
            adTitle: "iPhone 15 Pro Max",
            reason: REPORT_REASON.SCAM,
            additionalDetails: "Asking for payment before showing the device.",
            description: "Asking for payment before showing the device.",
        });
    });

    it("omits optional description fields when no additional details are provided", () => {
        const payload = buildAdReportPayload({
            adId: "507f1f77bcf86cd799439011",
            adTitle: "MacBook Pro",
            reason: REPORT_REASON.SPAM,
            additionalInfo: "   ",
        });

        expect(payload).toEqual({
            targetType: "ad",
            targetId: "507f1f77bcf86cd799439011",
            adId: "507f1f77bcf86cd799439011",
            adTitle: "MacBook Pro",
            reason: REPORT_REASON.SPAM,
        });
    });

    it("rejects invalid report target ids", () => {
        expect(normalizeReportTargetId("listing-123")).toBeNull();
        expect(
            buildAdReportPayload({
                adId: "listing-123",
                adTitle: "Broken payload",
                reason: REPORT_REASON.OTHER,
            })
        ).toBeNull();
    });
});
