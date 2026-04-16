import { Request, Response } from 'express';
import { 
    sendSuccessResponse, 
    sendAdminError 
} from './adminBaseController';
import {
    getSystemConfigForRead,
    updateSystemConfigSections
} from '../../services/SystemConfigService';
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
            } else if (typeof current[key] === 'object' && current[key] !== null) {
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
