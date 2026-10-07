import { ReportReasonValue, type AdReportPayload } from "@esparex/contracts";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export interface BuildAdReportPayloadInput {
    adId: string | number;
    adTitle: string;
    reason: ReportReasonValue;
    additionalInfo?: string;
}

/**
 * Phase 3a (§5): relocated to `@esparex/contracts` (canonical owner per
 * DECISION-GATE §3); re-exported here so existing importers keep working.
 * Deletion of this shim is Phase 4 (§10).
 */
export type { AdReportPayload };

export const normalizeReportTargetId = (adId: string | number): string | null => {
    const normalized = normalizeOptionalObjectId(adId);
    if (!normalized || !OBJECT_ID_PATTERN.test(normalized)) {
        return null;
    }
    return normalized;
};

export const buildAdReportPayload = ({
    adId,
    adTitle,
    reason,
    additionalInfo = "",
}: BuildAdReportPayloadInput): AdReportPayload | null => {
    const targetId = normalizeReportTargetId(adId);
    if (!targetId) {
        return null;
    }

    const trimmedDetails = additionalInfo.trim();

    return {
        targetType: "ad",
        targetId,
        adId: targetId,
        adTitle,
        reason,
        ...(trimmedDetails
            ? {
                  additionalDetails: trimmedDetails,
                  description: trimmedDetails,
              }
            : {}),
    };
};
