"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemConfig = exports.getSystemConfig = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const SystemConfigService_1 = require("@esparex/core/services/SystemConfigService");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
/**
 * Mask sensitive fields in the configuration object
 */
const maskSecrets = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    const masked = JSON.parse(JSON.stringify(obj)); // Deep clone
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
    const recurse = (current) => {
        for (const key in current) {
            if (sensitiveKeys.includes(key) && typeof current[key] === 'string' && (current[key]).length > 0) {
                const val = current[key];
                if (val.length > 8) {
                    current[key] = `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
                }
                else {
                    current[key] = '****';
                }
            }
            else if (typeof current[key] === 'object' && current[key] !== null) {
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
const getSystemConfig = async (req, res) => {
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
        const config = await (0, SystemConfigService_1.getSystemConfigForRead)(defaults);
        const maskedConfig = maskSecrets(config.toJSON ? config.toJSON() : config);
        (0, adminBaseController_1.sendSuccessResponse)(res, maskedConfig);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getSystemConfig = getSystemConfig;
/**
 * Update system configuration
 * Merges provided fields with existing config.
 */
const updateSystemConfig = async (req, res) => {
    try {
        const updates = (req.body ?? {});
        const adminIdRaw = req.user?._id;
        const adminId = adminIdRaw ? String(adminIdRaw) : undefined;
        const { config, updatedSections } = await (0, SystemConfigService_1.updateSystemConfigSections)(updates, adminId);
        await (0, adminLogger_1.logAdminAction)(req, 'UPDATE_SYSTEM_CONFIG', 'Config', 'global', { sections: updatedSections });
        const maskedConfig = maskSecrets(config.toJSON ? config.toJSON() : config);
        (0, adminBaseController_1.sendSuccessResponse)(res, maskedConfig, 'System configuration updated successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateSystemConfig = updateSystemConfig;
//# sourceMappingURL=systemConfigController.js.map