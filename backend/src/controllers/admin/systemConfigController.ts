import logger from '../../utils/logger';
import { Request, Response } from 'express';
import SystemConfig from '../../models/SystemConfig';
import { sendSuccessResponse } from './adminBaseController';
import { logAdminAction } from '../../utils/adminLogger';
import nodemailer from 'nodemailer';
import {
    ensureSystemConfig,
    invalidateSystemConfigCache,
    SYSTEM_CONFIG_KEY
} from '../../utils/systemConfigHelper';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import {
    getSystemConfigForRead,
    updateSystemConfigSections
} from '../../services/SystemConfigService';

type AuthenticatedRequest = Request & { user?: { _id?: string } };

const sendSystemConfigError = (req: Request, res: Response, error: unknown) => {
    const knownError = error as { statusCode?: number; code?: string };
    if (knownError?.statusCode && knownError.statusCode >= 400 && knownError.statusCode < 500) {
        const message = error instanceof Error ? error.message : 'Invalid system config payload';
        return sendContractErrorResponse(req, res, knownError.statusCode, message, {
            code: knownError.code || 'SYSTEM_CONFIG_BAD_REQUEST'
        });
    }
    const message = error instanceof Error ? error.message : 'System config operation failed';
    return sendContractErrorResponse(req, res, 500, message);
};

/**
 * Mask sensitive fields in the configuration object
 */
const maskSecrets = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = JSON.parse(JSON.stringify(obj)); // Deep clone

    const sensitiveKeys = [
        'openaiApiKey',
        'password',
        'apiKey',
        'apiSecret',
        'keySecret',
        'secretKey',
        'mapboxAccessToken'
    ];

    const recurse = (current: any) => {
        for (const key in current) {
            if (sensitiveKeys.includes(key) && typeof current[key] === 'string' && current[key].length > 0) {
                const val = current[key];
                if (val.length > 8) {
                    current[key] = `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
                } else {
                    current[key] = '****';
                }
            } else if (typeof current[key] === 'object' && current[key] !== null) {
                recurse(current[key]);
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
        logger.error('❌ CRITICAL: Error fetching system config:', error);
        sendSystemConfigError(req, res, error);
    }
};

/**
 * Update system configuration
 * Merges provided fields with existing config.
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
    try {
        const updates = req.body ?? {};
        const adminIdRaw = (req as AuthenticatedRequest).user?._id;
        const adminId = adminIdRaw ? String(adminIdRaw) : undefined;
        const { config, updatedSections } = await updateSystemConfigSections(updates, adminId);

        await logAdminAction(req, 'UPDATE_SYSTEM_CONFIG', 'Config', 'global', { sections: updatedSections });

        const maskedConfig = maskSecrets(config.toJSON ? config.toJSON() : config);
        sendSuccessResponse(res, maskedConfig, 'System configuration updated successfully');
    } catch (error) {
        logger.error('Error updating system config:', error);
        sendSystemConfigError(req, res, error);
    }
};

/**
 * Reset system configuration to defaults
 * Can reset specific sections or everything.
 */
export const resetSystemConfig = async (req: Request, res: Response) => {
    try {
        const { sections } = req.body; // Array of sections to reset ['ai', 'security']

        let config = await SystemConfig.findOne({ singletonKey: SYSTEM_CONFIG_KEY });
        if (!config) config = await ensureSystemConfig();
        const configRecord = config as unknown as Record<string, unknown>;

        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            // Full reset (delete and recreate)
            await SystemConfig.deleteMany({ singletonKey: SYSTEM_CONFIG_KEY });
            await invalidateSystemConfigCache();
            const newConfig = await ensureSystemConfig();
            sendSuccessResponse(res, newConfig, 'System configuration fully reset');
            return;
        }

        // Partial reset
        const defaultConfig = new SystemConfig({ singletonKey: SYSTEM_CONFIG_KEY }); // instance to get defaults
        const defaultRecord = defaultConfig as unknown as Record<string, unknown>;

        sections.forEach((section: string) => {
            const value = defaultRecord[section];
            if (value !== undefined) {
                configRecord[section] = value;
            }
        });

        await config.save();
        await invalidateSystemConfigCache();

        await logAdminAction(req, 'RESET_SYSTEM_CONFIG', 'Config', 'global', { sections });

        sendSuccessResponse(res, config, `System configuration sections [${sections.join(', ')}] reset`);

    } catch (error) {
        logger.error('Error resetting system config:', error);
        sendSystemConfigError(req, res, error);
    }
};

/**
 * Test email connection settings
 */
export const testEmailConnection = async (req: Request, res: Response) => {
    try {
        const { host, port, username, password, encryption } = req.body;

        if (!host || !port || !username || !password) {
            return sendContractErrorResponse(req, res, 400, 'Missing required SMTP fields');
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: encryption === 'ssl',
            auth: {
                user: username,
                pass: password,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        await transporter.verify();

        sendSuccessResponse(res, null, 'Email connection successful');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to connect to SMTP server';
        logger.error('Email test failed:', error);
        sendContractErrorResponse(req, res, 500, message);
    }
};
