/**
 * ESPAREX — Chat API Client
 * Thin wrapper over apiClient that maps to backend chat routes.
 */
import { apiClient } from '@/lib/api/client';
import { USER_ROUTES } from "@/lib/api/routes";
import type {
  IChatStartResponse,
  IConversationResponse,
  IConversationListResponse,
  IMessageListResponse,
  IChatSendResponse,
} from '@shared/contracts/chat.contracts';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface SendMessagePayload {
  conversationId: string;
  text: string;
}

export type ConversationListView = 'active' | 'archived';

/* -------------------------------------------------------------------------- */
/* API Methods                                                                 */
/* -------------------------------------------------------------------------- */

export const chatApi = {
  /**
   * Start (or retrieve) a conversation for an ad.
   */
  start: (adId: string, options?: { silent?: boolean }): Promise<IChatStartResponse> =>
    apiClient.post<IChatStartResponse>(USER_ROUTES.CHAT_START, { adId }, options),

  /**
   * Paginated inbox — buyer & seller conversations.
   */
  list: (before?: string, view: ConversationListView = 'active'): Promise<IConversationListResponse> =>
    apiClient.get<IConversationListResponse>(
      `${USER_ROUTES.CHAT_LIST}?view=${encodeURIComponent(view)}${before ? `&before=${encodeURIComponent(before)}` : ''}`
    ),

  /**
   * Single conversation detail.
   */
  conversation: (conversationId: string): Promise<IConversationResponse> =>
    apiClient.get<IConversationResponse>(
      USER_ROUTES.CHAT_CONVERSATION(conversationId)
    ),

  /**
   * Fetch messages for a conversation (reverse cursor pagination).
   */
  messages: (
    conversationId: string,
    before?: string
  ): Promise<IMessageListResponse> =>
    apiClient.get<IMessageListResponse>(
      `${USER_ROUTES.CHAT_MESSAGES(conversationId)}${before ? `?before=${encodeURIComponent(before)}` : ''}`
    ),

  /**
   * Fetch only NEW messages after a given timestamp (polling).
   */
  poll: (
    conversationId: string,
    after: string
  ): Promise<IMessageListResponse> =>
    apiClient.get<IMessageListResponse>(
      `${USER_ROUTES.CHAT_MESSAGES(conversationId)}?after=${encodeURIComponent(after)}`
    ),

  /**
   * Send a message.
   */
  send: (payload: SendMessagePayload): Promise<IChatSendResponse> =>
    apiClient.post<IChatSendResponse>(USER_ROUTES.CHAT_SEND, payload),

  /**
   * Mark messages in a conversation as read.
   */
  markRead: (conversationId: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(USER_ROUTES.CHAT_READ, { conversationId }),

  /**
   * Block a conversation (self-service).
   */
  block: (conversationId: string, reason?: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(USER_ROUTES.CHAT_BLOCK, { conversationId, reason }),

  /**
   * Hide a conversation from your inbox.
   */
  hide: (conversationId: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(USER_ROUTES.CHAT_HIDE, { conversationId }),

  /**
   * Restore a hidden conversation back to the active inbox.
   */
  unhide: (conversationId: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(USER_ROUTES.CHAT_UNHIDE, { conversationId }),

  /**
   * Report a conversation or specific message.
   */
  report: (payload: {
    conversationId: string;
    reason: string;
    description?: string;
    messageId?: string;
  }): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(USER_ROUTES.CHAT_REPORT, payload),
};
