export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface EmailPayload {
    to: EmailRecipient;
    templateId: string;
    variables: Record<string, unknown>;
    attachments?: Array<{ filename: string; url: string }>;
}

export interface EmailDispatchResult {
    success: boolean;
    provider: string;
    messageId?: string;
    skippedReason?: 'UNCONFIGURED' | 'DISABLED_BY_USER' | 'INVALID_RECIPIENT';
}

export interface EmailServicePort {
    sendEmail(payload: EmailPayload): Promise<EmailDispatchResult>;
    isConfigured(): boolean;
}
