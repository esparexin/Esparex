import type { ChatReportReasonValue } from '@esparex/shared';

export interface ChatRepositoryPort {
    findConversationById(conversationId: string): Promise<Record<string, unknown> | null>;
    createReport(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    getAdChatInfo(adId: string): Promise<Record<string, unknown> | null>;
    checkBlockRelationship(buyerId: string, sellerId: string): Promise<boolean>;
    findExistingConversation(adId: string, buyerId: string): Promise<Record<string, unknown> | null>;
    removeUserFromDeleted(conversationId: string, userId: string): Promise<void>;
    createConversation(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    listConversations(userId: string, before?: string, view?: 'active' | 'archived'): Promise<Record<string, unknown>[]>;
    getPopulatedConversation(conversationId: string, userId: string): Promise<Record<string, unknown> | null>;
    blockConversation(conversationId: string, userId: string): Promise<void>;
    addUserToDeleted(conversationId: string, userId: string): Promise<void>;
    findMessages(conversationId: string, userId: string, before?: string, after?: string): Promise<{ msgs: Record<string, unknown>[]; nextCursor?: string }>;
    updateConversationAdClosedStatus(conversationId: string, isAdClosed: boolean): Promise<void>;
    createMessage(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    updateConversationPreview(conversationId: string, unreadField: string, senderId: string, preview: string, messageDate: Date): Promise<void>;
    createSystemMessage(data: Record<string, unknown>): Promise<void>;
    markMessagesRead(conversationId: string, userId: string): Promise<void>;
    resetUnreadCount(conversationId: string, unreadField: string): Promise<void>;
}
