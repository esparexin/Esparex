import { Request, Response } from 'express';
import { 
    sendSuccessResponse, 
    sendAdminError 
} from '../../utils/adminBaseController';
import {
    getSystemConfigForRead,
    updateSystemConfigSections
} from '@esparex/core/services/SystemConfigService';
import { logAdminAction } from '../../utils/adminLogger';

type AuthenticatedRequest = Request & { user?: { _id?: string } };



/**
 * Mask sensitive fields in the configuration object
 */
const maskSecrets = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>; // Deep clone

    const sensitiveKeys = [
        'openaiApiKey',
        'password',
        'apiKey',
        'apiSecret',
        'keySecret',
        'secretKey',
        'mapboxAccessToken',
        'bypassToken'
    ];

    const recurse = (current: Record<string, unknown>) => {
        for (const key in current) {
            if (sensitiveKeys.includes(key) && typeof current[key] === 'string' && (current[key]).length > 0) {
                const val = current[key];
                if (val.length > 8) {
                    current[key] = `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
                } else {
                    current[key] = '****';
                }
            } else if (typeof current[key] === 'object' && current[key] !== undefined) {
                recurse(current[key] as Record<string, unknown>);
            }
        }
    };

    recurse(masked);
    return masked;
};

/**
 * Get the system configuration (Singleton)
 * Creates default if not exists.
 */
export const getSystemConfig = async (req: Request, res: Response) => {
    try {
        const defaults = {
            ai: {
                moderation: {
                    enabled: true,
                    autoFlag: true,
                    autoBlock: false,
                    confidenceThreshold: 85,
                    thresholds: {
                        scamDetection: 75,
                        inappropriateContent: 80,
                        spamDetection: 70,
                        counterfeits: 85,
                        prohibitedItems: 90
                    }
                },
                seo: {
                    enableTitleSEO: true, enableDescriptionSEO: true,
                    titleProvider: 'openai', descriptionProvider: 'openai',
                    model: 'gpt-4o', temperature: 0.7, maxTokens: 500
                }
            },
            security: {
                twoFactor: { enabled: false, issuer: 'Esparex Admin' },
                sessionTimeoutMinutes: 60,
                maxLoginAttempts: 5
            },
            notifications: {
                email: { enabled: true, provider: 'smtp', senderName: 'Esparex Team', senderEmail: 'noreply@esparex.com' },
                push: { enabled: false, provider: 'firebase' }
            },
            platform: {
                maintenance: { enabled: false, message: 'Under Maintenance' },
                branding: { primaryColor: '#0E8345' }
            }
        };

        const config = await getSystemConfigForRead(defaults);
        const maskedConfig = maskSecrets(config.toJSON ? config.toJSON() : config);

        sendSuccessResponse(res, maskedConfig);
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Update system configuration
 * Merges provided fields with existing config.
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
    try {
        const updates = (req.body ?? {}) as Record<string, unknown>;
        const adminIdRaw = (req as AuthenticatedRequest).user?._id;
        const adminId = adminIdRaw ? String(adminIdRaw) : undefined;
        const { config, updatedSections } = await updateSystemConfigSections(updates, adminId);

        await logAdminAction(req, 'UPDATE_SYSTEM_CONFIG', 'Config', 'global', { sections: updatedSections });

        const maskedConfig = maskSecrets(config.toJSON ? config.toJSON() : config);
        sendSuccessResponse(res, maskedConfig, 'System configuration updated successfully');
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Send a diagnostic verification probe to test active SMTP settings
 */
export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        const { recipientEmail } = (req.body ?? {}) as { recipientEmail?: string };
        const target = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';
        if (!target || !target.includes('@')) {
            return sendAdminError(req, res, 'Valid recipient email address is required', 400);
        }

        const { emailService } = await import('@esparex/core/domains/notifications/application/EmailService');

        // Probe the SMTP server before attempting a send — surfaces auth/TLS errors immediately
        const verifyResult = await emailService.verify();
        if (!verifyResult.ok) {
            const diagnostic = verifyResult.error || 'SMTP credentials are not configured or email is disabled in settings';
            return sendAdminError(req, res, `SMTP connection failed: ${diagnostic}`, 400);
        }

        const { renderEmailLayout } = await import('@esparex/core/domains/notifications/templates/EmailLayout');
        const testHtml = renderEmailLayout({
            title: 'Esparex SMTP Diagnostic Probe',
            preheader: 'This is a test email confirming that your Esparex SMTP service is active.',
            contentHtml: `
                <p>Hello Administrator,</p>
                <p>This automated test message confirms that your SMTP delivery credentials and connection parameters are correctly configured on Esparex.</p>
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #166534;">
                    <strong>Status:</strong> Active &amp; Operational<br/>
                    <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
                    <strong>Dispatched To:</strong> ${target}
                </div>
            `,
            footerNote: 'Sent from Admin Dashboard > Settings > Notifications.',
        });

        const result = await emailService.send({
            to: target,
            subject: 'Esparex SMTP Connection Test — Successful',
            html: testHtml,
        });

        if (!result.success) {
            const detail = result.errorMessage || result.skippedReason || 'Delivery failure';
            return sendAdminError(req, res, `SMTP send failed: ${detail}`, 502);
        }

        await logAdminAction(req, 'TEST_SMTP_EMAIL', 'Config', 'notifications.email', { recipient: target, messageId: result.messageId });
        sendSuccessResponse(res, { messageId: result.messageId, recipient: target }, `Test email sent successfully to ${target}`);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

