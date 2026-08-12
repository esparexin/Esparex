import type { ChatAttachment, ChatReportReasonValue } from '@esparex/contracts';

export interface ChatAdSummary {
    _id?: unknown;
    sellerId: unknown;
    status?: string;
    isDeleted?: boolean;
    isChatLocked?: boolean;
}

export interface PopulatedUser {
    _id?: unknown;
    id?: string;
    name?: string;
    avatar?: string;
    mobile?: string;
}

export interface PopulatedAd {
    _id?: unknown;
    id?: string;
    title?: string;
    images?: string[];
    price?: number;
    listingType?: string;
    seoSlug?: string;
    status?: string;
    isDeleted?: boolean;
    isChatLocked?: boolean;
}

export interface PopulatedConv {
    _id: unknown;
    buyerId: PopulatedUser | null;
    sellerId: PopulatedUser | null;
    adId: PopulatedAd | null;
    lastMessage?: string | { text?: string } | null;
    lastMessageAt?: Date | string;
    isBlocked?: boolean;
    isAdClosed?: boolean;
    unreadBuyer?: number;
    unreadSeller?: number;
    deletedFor?: unknown[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface ChatConversationEntity {
    _id: unknown;
    adId: unknown;
    buyerId: unknown;
    sellerId: unknown;
    lastMessage?: unknown;
    lastMessageAt?: Date | string;
    unreadBuyer?: number;
    unreadSeller?: number;
    isBlocked?: boolean;
    blockedBy?: unknown;
    isAdClosed?: boolean;
    deletedFor?: unknown[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface ChatMessageEntity {
    _id: unknown;
    id?: string;
    conversationId: unknown;
    senderId: unknown;
    receiverId: unknown;
    text: string;
    attachments?: ChatAttachment[];
    riskScore?: number;
    badWordDetected?: boolean;
    isSystemMessage?: boolean;
    readAt?: Date | null;
    deletedFor?: unknown[];
    createdAt: Date;
    updatedAt?: Date;
}

export interface ChatReportEntity {
    _id: unknown;
    conversationId: unknown;
    reporterId: unknown;
    reportedUserId: unknown;
    messageId?: unknown;
    reason: ChatReportReasonValue;
    description?: string;
    createdAt?: Date;
}

export interface CreateConversationData {
    adId: string;
    buyerId: string;
    sellerId: string;
    isAdClosed?: boolean;
}

export interface CreateMessageData {
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
    attachments?: ChatAttachment[];
    riskScore?: number;
    badWordDetected?: boolean;
}

export interface CreateSystemMessageData {
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
}

export interface CreateReportData {
    conversationId: string;
    reporterId: string;
    reportedUserId: string;
    messageId?: string;
    reason: ChatReportReasonValue;
    description?: string;
}

export interface ChatRepositoryPort {
    findConversationById(conversationId: string): Promise<ChatConversationEntity | null>;
    createReport(data: CreateReportData): Promise<ChatReportEntity>;
    getAdChatInfo(adId: string): Promise<ChatAdSummary | null>;
    checkBlockRelationship(buyerId: string, sellerId: string): Promise<boolean>;
    findExistingConversation(adId: string, buyerId: string): Promise<ChatConversationEntity | null>;
    removeUserFromDeleted(conversationId: string, userId: string): Promise<void>;
    createConversation(data: CreateConversationData): Promise<ChatConversationEntity>;
    listConversations(userId: string, before?: string, view?: 'active' | 'archived'): Promise<PopulatedConv[]>;
    getPopulatedConversation(conversationId: string, userId: string): Promise<PopulatedConv | null>;
    blockConversation(conversationId: string, userId: string): Promise<void>;
    addUserToDeleted(conversationId: string, userId: string): Promise<void>;
    findMessages(conversationId: string, userId: string, before?: string, after?: string): Promise<{ msgs: ChatMessageEntity[]; nextCursor?: string }>;
    updateConversationAdClosedStatus(conversationId: string, isAdClosed: boolean): Promise<void>;
    createMessage(data: CreateMessageData): Promise<ChatMessageEntity>;
    updateConversationPreview(conversationId: string, unreadField: string, senderId: string, preview: string, messageDate: Date): Promise<void>;
    createSystemMessage(data: CreateSystemMessageData): Promise<void>;
    markMessagesRead(conversationId: string, userId: string): Promise<void>;
    resetUnreadCount(conversationId: string, unreadField: string): Promise<void>;
}
