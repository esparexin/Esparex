import type { ReportReasonValue } from '../../reports/enums/reportReason';

/**
 * Phase 3a (§5) — canonical listing-reporting / lifecycle-event DTOs.
 *
 * Relocated from `apps/web/src/lib/listings/adReportPayload.ts:13`
 * (`AdReportPayload`) and
 * `core/src/domains/listings/application/lifecycle/LifecyclePolicyGuard.ts:79`
 * (`ListingApprovedEventPayload`) — DECISION-GATE §5; evidence
 * `areas/04-contract-ssot.md` Finding 3 (unique API payloads with no contract home).
 */
export interface AdReportPayload {
    targetType: 'ad';
    targetId: string;
    adId: string;
    adTitle: string;
    reason: ReportReasonValue;
    additionalDetails?: string;
    description?: string;
}

export interface ListingApprovedEventPayload {
    listingId: string;
    listingType: string;
    approvedAt: string;
    actorType: string;
    actorId?: string;
    source: string;
}
