
export interface ChatRepositoryPort {
    findConversationById(conversationId: string): Promise<any>;
    createReport(data: any): Promise<any>;
    getAdChatInfo(adId: string): Promise<any>;
    checkBlockRelationship(buyerId: string, sellerId: string): Promise<boolean>;
    findExistingConversation(adId: string, buyerId: string): Promise<any>;
    removeUserFromDeleted(conversationId: string, userId: string): Promise<void>;
    createConversation(data: any): Promise<any>;
    listConversations(userId: string, before?: string, view?: 'active' | 'archived'): Promise<any[]>;
    getPopulatedConversation(conversationId: string, userId: string): Promise<any>;
    blockConversation(conversationId: string, userId: string): Promise<void>;
    addUserToDeleted(conversationId: string, userId: string): Promise<void>;
    findMessages(conversationId: string, userId: string, before?: string, after?: string): Promise<{ msgs: any[], nextCursor?: string }>;
    updateConversationAdClosedStatus(conversationId: string, isAdClosed: boolean): Promise<void>;
    createMessage(data: any): Promise<any>;
    updateConversationPreview(conversationId: string, unreadField: string, senderId: string, preview: string, messageDate: Date): Promise<void>;
    createSystemMessage(data: any): Promise<void>;
    markMessagesRead(conversationId: string, userId: string): Promise<void>;
    resetUnreadCount(conversationId: string, unreadField: string): Promise<void>;
}
