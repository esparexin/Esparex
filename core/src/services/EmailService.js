"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
const appUrl_1 = require("@core/utils/appUrl");
const env_1 = require("@core/config/env");
// interface EmailOptions {
//     to: string;
//     subject: string;
//     html: string;
// }
class EmailService {
    transporter = null;
    configSignature = '';
    constructor() {
        // Runtime config is loaded lazily from SystemConfig on send.
    }
    async resolveConfig() {
        const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        const emailConfig = config?.notifications?.email;
        return {
            enabled: emailConfig?.enabled ?? true,
            provider: emailConfig?.provider || 'smtp',
            senderName: emailConfig?.senderName?.trim() || 'Esparex Admin',
            senderEmail: emailConfig?.senderEmail?.trim() || env_1.env.SMTP_FROM || 'noreply@esparex.com',
            host: emailConfig?.host?.trim() || env_1.env.SMTP_HOST || '',
            port: Number(emailConfig?.port || env_1.env.SMTP_PORT || 587),
            username: emailConfig?.username?.trim() || env_1.env.SMTP_USER || '',
            password: emailConfig?.password?.trim() || env_1.env.SMTP_PASSWORD || '',
            encryption: emailConfig?.encryption || 'tls',
        };
    }
    async ensureTransporter() {
        const config = await this.resolveConfig();
        if (!config.enabled) {
            this.transporter = null;
            this.configSignature = '';
            return { config, available: false };
        }
        if (config.provider !== 'smtp') {
            logger_1.default.warn('Email provider is not implemented; SMTP is required for runtime delivery', {
                provider: config.provider
            });
            return { config, available: false };
        }
        if (!config.host || !config.username || !config.password) {
            logger_1.default.warn('Email service not configured - missing SMTP credentials', {
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
            this.transporter = nodemailer_1.default.createTransport({
                host: config.host,
                port: config.port,
                secure: config.encryption === 'ssl' || config.port === 465,
                auth: {
                    user: config.username,
                    pass: config.password,
                },
            });
            this.configSignature = signature;
            logger_1.default.info('Email service configured', { transport: 'SMTP', host: config.host });
        }
        return { config, available: true };
    }
    async sendEmail(to, subject, html) {
        const { config, available } = await this.ensureTransporter();
        if (!config.enabled) {
            logger_1.default.info('Email skipped because notifications.email.enabled is false', { to, subject });
            return false;
        }
        if (!available || !this.transporter) {
            logger_1.default.warn('Email not sent because SMTP runtime settings are incomplete', { to, subject });
            return false;
        }
        try {
            const info = await this.transporter.sendMail({
                from: `"${config.senderName}" <${config.senderEmail}>`,
                to,
                subject,
                html,
            });
            logger_1.default.info('Email sent successfully', { messageId: info.messageId, to });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to send email', { error: error instanceof Error ? error.message : String(error), to });
            return false;
        }
    }
    // Template for Risk Alert
    generateRiskAlertTemplate(stats) {
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

                <p>Please review the issues in the <a href="${(0, appUrl_1.getAdminAppUrl)()}/admin/system">Admin Dashboard</a>.</p>
            </div>
        `;
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=EmailService.js.map