/**
 * ESPAREX — Chat API Contracts (SSOT)
 * Request + Response TypeScript interfaces shared between backend, frontend, and admin-frontend.
 */

import type { ChatReportReasonValue } from '../enums/chatStatus';

/* -------------------------------------------------------------------------- */
/* Minimal embedded references (avoid circular imports)                       */
/* -------------------------------------------------------------------------- */

export interface ChatUserRef {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatAdRef {
  id: string;
  title: string;
  thumbnail?: string;
  price?: number;
  listingType?: string;
  seoSlug?: string;
}

export interface ChatAttachment {
  url: string;
  mimeType: string;
  size: number; // bytes
  name?: string;
}

/* -------------------------------------------------------------------------- */
/* Conversation                                                                */
/* -------------------------------------------------------------------------- */

export interface IConversationDTO {
  id: string;
  ad: ChatAdRef;
  buyer: ChatUserRef;
  seller: ChatUserRef;
  lastMessage?: string;
  lastMessageAt?: string; // ISO
  unreadBuyer: number;
  unreadSeller: number;
  isBlocked: boolean;
  isAdClosed: boolean;
  isArchivedForViewer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IConversationListResponse {
  success: true;
  data: IConversationDTO[];
  nextCursor?: string; // ISO lastMessageAt for next page
  total?: number;
}

export interface IConversationResponse {
  success: true;
  data: IConversationDTO;
}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

export interface IMessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: ChatAttachment[];
  readAt?: string; // ISO
  isSystemMessage?: boolean;
  createdAt: string;
}

export interface IMessageListResponse {
  success: true;
  data: IMessageDTO[];
  nextCursor?: string; // ISO createdAt for prev page (older messages)
}

/* -------------------------------------------------------------------------- */
/* API Request Payloads                                                        */
/* -------------------------------------------------------------------------- */

export interface IChatStartPayload {
  adId: string;
}

export interface IChatStartResponse {
  success: true;
  conversationId: string;
  isNew: boolean;
}

export interface IChatSendPayload {
  conversationId: string;
  text: string;
  attachments?: ChatAttachment[];
}

export interface IChatSendResponse {
  success: true;
  message: IMessageDTO;
}

export interface IChatReadPayload {
  conversationId: string;
}

export interface IChatBlockPayload {
  conversationId: string;
  reason?: string;
}

export interface IChatReportPayload {
  conversationId: string;
  messageId?: string;
  reason: ChatReportReasonValue;
  description?: string;
}

export interface IChatUploadUrlPayload {
  conversationId: string;
  contentType: string;
  filename?: string;
}

export interface IChatUploadUrlResponse {
  success: true;
  data: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
    method: 'PUT';
  };
}

/* -------------------------------------------------------------------------- */
/* Admin Payloads                                                              */
/* -------------------------------------------------------------------------- */

export interface IAdminChatListQuery {
  filter?: 'reported' | 'high_risk' | 'blocked' | 'closed' | 'all';
  riskMin?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface IAdminMutePayload {
  reason?: string;
}

export interface IAdminDeleteMessagePayload {
  reason?: string;
}
