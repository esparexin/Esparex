/**
 * Phase 3a (§5) — canonical admin API-key DTOs.
 *
 * Relocated from `apps/admin/src/hooks/useApiKeys.ts:22,26` (DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 — unique API payloads with
 * no contract home). The hook now imports these symbols.
 */
export interface ApiKeysListResponse {
    items?: Array<Record<string, unknown>>;
}

export interface CreatedApiKeyResponse {
    key?: string;
}
