import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import logger from '../../../utils/logger';
import { getSystemConfigDoc } from '../../../utils/systemConfigHelper';
import { env } from '../../../config/env';

import type { EmailServicePort, EmailPayload, EmailDispatchResult, EmailVerifyResult } from '../ports/EmailServicePort';

export class EmailService implements EmailServicePort {
    private transporter: Transporter | null = null;
    private configSignature = '';

    constructor() {
        // Runtime config is loaded lazily from SystemConfig on send.
    }

    private async resolveConfig() {
        const config = await getSystemConfigDoc();
        const emailConfig = config?.notifications?.email;

        return {
            enabled: emailConfig?.enabled ?? true,
            provider: emailConfig?.provider || 'smtp',
            senderName: emailConfig?.senderName?.trim() || 'Esparex Admin',
            senderEmail: emailConfig?.senderEmail?.trim() || env.SMTP_FROM || 'noreply@esparex.in',
            host: emailConfig?.host?.trim() || env.SMTP_HOST || '',
            port: Number(emailConfig?.port || env.SMTP_PORT || 587),
            username: emailConfig?.username?.trim() || env.SMTP_USER || '',
            password: emailConfig?.password?.trim() || env.SMTP_PASSWORD || '',
            encryption: emailConfig?.encryption || 'tls',
        };
    }

    private async ensureTransporter() {
        const config = await this.resolveConfig();

        if (!config.enabled) {
            this.transporter = null;
            this.configSignature = '';
            return { config, available: false };
        }

        if (config.provider !== 'smtp') {
            logger.warn('Email provider is not implemented; SMTP is required for runtime delivery', {
                provider: config.provider
            });
            return { config, available: false };
        }

        if (!config.host || !config.username || !config.password) {
            logger.warn('Email service not configured - missing SMTP credentials', {
                hostConfigured: Boolean(config.host),
                usernameConfigured: Boolean(config.username)
            });
            return { config, available: false };
        }

        const signature = JSON.stringify([
            config.host,
            config.port,
            config.username,
            config.password,
            config.encryption,
        ]);

        if (!this.transporter || this.configSignature !== signature) {
            this.transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.encryption === 'ssl' || config.port === 465,
                auth: {
                    user: config.username,
                    pass: config.password,
                },
            });
            this.configSignature = signature;
            logger.info('Email service configured', { transport: 'SMTP', host: config.host });
        }

        return { config, available: true };
    }

    public async isConfigured(): Promise<boolean> {
        const { available } = await this.ensureTransporter();
        return available;
    }

    public async send(payload: EmailPayload): Promise<EmailDispatchResult> {
        const to = typeof payload.to === 'string' ? payload.to : payload.to.email;
        if (!to || !to.includes('@')) {
            return {
                success: false,
                provider: 'smtp',
                skippedReason: 'INVALID_RECIPIENT',
            };
        }

        const { config, available } = await this.ensureTransporter();
        if (!config.enabled) {
            logger.info('Email skipped because notifications.email.enabled is false', { to, subject: payload.subject });
            return {
                success: false,
                provider: 'smtp',
                skippedReason: 'DISABLED_BY_USER',
            };
        }

        if (!available || !this.transporter) {
            logger.warn('Email not sent because SMTP runtime settings are incomplete', { to, subject: payload.subject });
            return {
                success: false,
                provider: 'smtp',
                skippedReason: 'UNCONFIGURED',
            };
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${config.senderName}" <${config.senderEmail}>`,
                to,
                subject: payload.subject,
                html: payload.html,
                attachments: payload.attachments,
            }) as { messageId?: string };

            logger.info('Email sent successfully', { messageId: info.messageId, to });
            return {
                success: true,
                provider: 'smtp',
                messageId: info.messageId,
            };
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message : String(error);
            // Sanitize: strip any credentials that nodemailer may embed in error strings
            const sanitized = rawMessage.replace(/pass(?:word)?\s*[:=]\s*\S+/gi, '[redacted]');
            logger.error('Failed to send email', { error: sanitized, to });
            return {
                success: false,
                provider: 'smtp',
                skippedReason: 'SEND_ERROR',
                errorMessage: sanitized,
            };
        }
    }

    public async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        const result = await this.send({ to, subject, html });
        return result.success;
    }

    /**
     * Probes the configured SMTP server without sending a message.
     * Returns ok=true when the server accepts the connection and credentials.
     * Returns ok=false with a sanitized error string on any failure.
     */
    public async verify(): Promise<EmailVerifyResult> {
        const { config, available } = await this.ensureTransporter();

        if (!config.enabled) {
            return { ok: false, error: 'Email notifications are disabled in system config.' };
        }

        if (!available || !this.transporter) {
            return { ok: false, error: 'SMTP credentials are incomplete. Check host, username, and password.' };
        }

        try {
            await this.transporter.verify();
            return { ok: true };
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message : String(error);
            const sanitized = rawMessage.replace(/pass(?:word)?\s*[:=]\s*\S+/gi, '[redacted]');
            logger.warn('[EmailService] SMTP verify failed', { error: sanitized, host: config.host });
            return { ok: false, error: sanitized };
        }
    }
}

export const emailService = new EmailService();
