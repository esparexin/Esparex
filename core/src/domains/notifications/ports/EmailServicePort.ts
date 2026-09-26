export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface EmailPayload {
    to: string | EmailRecipient;
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content?: string | Buffer; path?: string }>;
}

export interface EmailDispatchResult {
    success: boolean;
    provider: string;
    messageId?: string;
    skippedReason?: 'UNCONFIGURED' | 'DISABLED_BY_USER' | 'INVALID_RECIPIENT' | 'SEND_ERROR';
}

export interface EmailServicePort {
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
    send(payload: EmailPayload): Promise<EmailDispatchResult>;
    isConfigured(): Promise<boolean>;
}
