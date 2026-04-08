import type { ReportReasonValue } from "@shared/enums/reportReason";

import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export interface BuildAdReportPayloadInput {
    adId: string | number;
    adTitle: string;
    reason: ReportReasonValue;
    additionalInfo?: string;
}

export interface AdReportPayload {
    targetType: "ad";
    targetId: string;
    adId: string;
    adTitle: string;
    reason: ReportReasonValue;
    additionalDetails?: string;
    description?: string;
}

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
