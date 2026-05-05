export const CHAT_STATUS = {
    ACTIVE: 'active',
    CLOSED: 'closed',
    BLOCKED: 'blocked',
} as const;

export type ChatStatus = (typeof CHAT_STATUS)[keyof typeof CHAT_STATUS];
