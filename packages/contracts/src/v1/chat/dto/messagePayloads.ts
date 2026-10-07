import type { ChatAttachment } from './chat.contracts';

/**
 * Phase 3a (§5) — canonical send-message payloads.
 *
 * CONFLICT (recorded, not merged — DECISION-GATE §10 forbids silent merges):
 * two same-named local `SendMessagePayload` declarations with different shapes:
 * - `apps/web/src/lib/api/chatApi.ts:21` — { conversationId, text, attachments? }
 * - `apps/mobile/src/features/chat/presentation/hooks/useSendMessage.ts:5` —
 *   { conversationId, text, senderId?, tempId? }
 * Canonicalized under distinct names below; each local file re-exports its
 * historic name as an alias. A future gate decision may unify them.
 */
export interface ChatSendMessagePayload {
    conversationId: string;
    text: string;
    attachments?: ChatAttachment[];
}

export interface MobileChatSendMessagePayload {
    conversationId: string;
    text: string;
    senderId?: string;
    tempId?: string;
}
