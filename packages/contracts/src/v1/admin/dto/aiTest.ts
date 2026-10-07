/**
 * Phase 3a (§5) — canonical admin AI-test payload.
 *
 * Relocated from `apps/admin/src/lib/api/aiTestApi.ts:4` (DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 — unique API payload with
 * no contract home). The API module now re-exports this symbol.
 */
export interface AiTestPayload {
    providerName: string;
    capability: string;
    brand: string;
    model: string;
    condition: string;
}
