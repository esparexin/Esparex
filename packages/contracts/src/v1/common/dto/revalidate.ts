/**
 * Phase 3a (§5) — canonical internal revalidate-route payload.
 *
 * Relocated from `apps/web/src/app/internal/revalidate/route.ts:4`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payload with no contract home). This is the POST body contract of the
 * internal revalidation route.
 */
export interface RevalidatePayload {
    tag?: string;
    path?: string;
    secret?: string;
}
