/**
 * Phase 3a (§5) — canonical posting-balance DTOs.
 *
 * Relocated from `apps/web/src/app/(private)/post-ad/page.tsx:13,19`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payloads with no contract home). The page now imports these symbols.
 */
export interface PostingBalancePayload {
    totalRemaining?: number;
    freeRemaining?: number;
    paidCredits?: number;
}

export interface PostingBalanceResponse {
    success?: boolean;
    data?: PostingBalancePayload;
    error?: string;
}
