import type { EmailServicePort, EmailPayload, EmailDispatchResult } from '@esparex/core';

export class NoopEmailServiceAdapter implements EmailServicePort {
    public isConfigured(): boolean {
        return false;
    }

    public async sendEmail(_payload: EmailPayload): Promise<EmailDispatchResult> {
        // Soft success log when email service is unconfigured
        return {
            success: true,
            provider: 'NOOP_PROVIDER',
            skippedReason: 'UNCONFIGURED'
        };
    }
}
