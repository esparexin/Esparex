import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';
import { getAdminAppUrl } from '../utils/appUrl';
import { env } from '../config/env';

// interface EmailOptions {
//     to: string;
//     subject: string;
//     html: string;
// }

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
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
            senderEmail: emailConfig?.senderEmail?.trim() || env.SMTP_FROM || 'noreply@esparex.com',
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

    public async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        const { config, available } = await this.ensureTransporter();

        if (!config.enabled) {
            logger.info('Email skipped because notifications.email.enabled is false', { to, subject });
            return false;
        }

        if (!available || !this.transporter) {
            logger.warn('Email not sent because SMTP runtime settings are incomplete', { to, subject });
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${config.senderName}" <${config.senderEmail}>`,
                to,
                subject,
                html,
            });
            logger.info('Email sent successfully', { messageId: info.messageId, to });
            return true;
        } catch (error) {
            logger.error('Failed to send email', { error: error instanceof Error ? error.message : String(error), to });
            return false;
        }
    }

    // Template for Risk Alert
    public generateRiskAlertTemplate(stats: { score: number, riskLevel: string, findings: number }) {
        const color = stats.riskLevel === 'critical' ? '#dc2626' : '#ea580c';
        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: ${color};">⚠️ Code Health Risk Alert</h2>
                <p>Your codebase health has dropped to a <strong>${stats.riskLevel.toUpperCase()}</strong> risk level.</p>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Health Score:</strong> ${stats.score}/100</p>
                    <p><strong>Total Issues:</strong> ${stats.findings}</p>
                    <p><strong>Risk Level:</strong> <span style="color: ${color}; font-weight: bold;">${stats.riskLevel}</span></p>
                </div>

                <p>Please review the issues in the <a href="${getAdminAppUrl()}/admin/system">Admin Dashboard</a>.</p>
            </div>
        `;
    }
}

export const emailService = new EmailService();
