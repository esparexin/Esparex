import type { CreditLedgerDTO } from './CreditLedgerDTO';

/**
 * Phase 3a (§5) — canonical credit-ledger history response.
 *
 * Relocated from `apps/web/src/hooks/useCreditLedgerHistory.ts:6`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payload with no contract home). The hook now imports this symbol.
 */
export interface PaginatedLedgerResponse {
    items: CreditLedgerDTO[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
