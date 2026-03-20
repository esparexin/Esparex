import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// interface EmailOptions {
//     to: string;
//     subject: string;
//     html: string;
// }

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured = false;

    constructor() {
        this.init();
    }

    private init() {
        // Check for SMTP Credentials
        const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT } = process.env;

        if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT) || 587,
                secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASSWORD,
                },
            });
            this.isConfigured = true;
            logger.info('Email service configured', { transport: 'SMTP' });
        } else {
            logger.warn('Email service not configured - emails will be mocked', { reason: 'Missing SMTP credentials' });
            this.isConfigured = false;
        }
    }

    public async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        if (!this.isConfigured || !this.transporter) {
            logger.info('Mock email sent (SMTP not configured)', { to, subject });
            return true; // Pretend success
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Esparex Admin" <noreply@esparex.com>',
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

                <p>Please review the issues in the <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/system/code-health">Code Health Dashboard</a>.</p>
            </div>
        `;
    }
}

export const emailService = new EmailService();
