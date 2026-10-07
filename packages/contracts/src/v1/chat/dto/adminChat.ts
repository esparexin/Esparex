/**
 * Phase 3a (§5) — canonical home for admin chat-list DTOs.
 *
 * Relocated from `apps/admin/src/lib/api/adminChat.ts` (DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 — unique API payloads with
 * no contract home). The app module now re-exports these symbols.
 */
export interface AdminConvSummary {
    id: string;
    buyerName: string;
    sellerName: string;
    adTitle: string;
    lastMessage?: string;
    lastMessageAt?: string;
    isBlocked: boolean;
    isAdClosed: boolean;
    unreadBuyer: number;
    unreadSeller: number;
    updatedAt: string;
}

export interface AdminChatListResponse {
    success: boolean;
    data: AdminConvSummary[];
    total: number;
    page: number;
    limit: number;
}
