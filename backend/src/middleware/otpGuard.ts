/**
 * OTP Configuration Guard & Validator
 * 
 * Enforces OTP provider configuration at startup and runtime.
 * Prevents login failures due to misconfigured SMS providers.
 * 
 * @module middleware/otpGuard
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import bootstrapLogger from '../utils/bootstrapLogger';

interface OtpGuardConfig {
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    msg91AuthKey?: string;
    msg91SenderId?: string;
    authBypassOtpLock?: string;
    useDefaultOtp?: boolean;
}

/**
 * OTP Guard State - populated at startup
 */
const otpGuardState: {
    isConfigured: boolean;
    warnings: string[];
    isSafeToProceed: boolean;
} = {
    isConfigured: false,
    warnings: [],
    isSafeToProceed: false
};

/**
 * Validate OTP provider configuration at startup
 * Called once during application bootstrap
 * 
 * @param config - OTP configuration from environment
 * @throws {Error} If critical OTP requirements not met in production
 */
export function validateOtpConfiguration(config: OtpGuardConfig): void {
    const { isProduction, isDevelopment, isTest, msg91AuthKey, msg91SenderId, authBypassOtpLock, useDefaultOtp } = config;

    otpGuardState.warnings = [];

    // Test environment: skip validation
    if (isTest) {
        otpGuardState.isSafeToProceed = true;
        otpGuardState.isConfigured = true;
        bootstrapLogger.info('✅ OTP Guard: Test environment detected - validation skipped');
        return;
    }

    // Development environment: warn but allow
    if (isDevelopment) {
        if (!msg91AuthKey || !msg91SenderId) {
            const warning = 'OTP provider (MSG91) not configured; SMS dispatch will be skipped in dev mode';
            otpGuardState.warnings.push(warning);
            bootstrapLogger.warn(`⚠️  ${warning}`);

            if (authBypassOtpLock === 'true') {
                bootstrapLogger.info('ℹ️  OTP lock bypass ENABLED for local development (AUTH_BYPASS_OTP_LOCK=true)');
            }
        } else {
            bootstrapLogger.info('✅ OTP Guard: SMS provider configured in development');
        }
        otpGuardState.isSafeToProceed = true;
        otpGuardState.isConfigured = true;
        return;
    }

    // Production environment: strict validation
    if (isProduction) {
        if (useDefaultOtp === true) {
            // DLT pending — allow startup with a loud warning.
            // AuthService already skips SMS dispatch when USE_DEFAULT_OTP=true.
            const warning = '⚠️  USE_DEFAULT_OTP=true in production. Static OTP active — disable after DLT/MSG91 approval.';
            bootstrapLogger.warn(warning);
            otpGuardState.warnings.push(warning);
            otpGuardState.isSafeToProceed = true;
            otpGuardState.isConfigured = true;
            return;
        }

        const missingKeys: string[] = [];

        if (!msg91AuthKey) {
            missingKeys.push('MSG91_AUTH_KEY');
        }
        if (!msg91SenderId) {
            missingKeys.push('MSG91_SENDER_ID');
        }

        if (missingKeys.length > 0) {
            const errorMsg = `🚨 CRITICAL: OTP provider not configured in production. Missing: ${missingKeys.join(', ')}. Users will not receive OTP SMS.`;
            bootstrapLogger.error(errorMsg);
            bootstrapLogger.info('💡 TIP: Set USE_DEFAULT_OTP=true in Render environment to allow startup with static OTP (123456) for testing.');
            
            // We set isConfigured to false and isSafeToProceed to false.
            // This prevents the server from crashing but ensures any code using 
            // otpConfigurationCheck will block requests.
            otpGuardState.isSafeToProceed = false;
            otpGuardState.isConfigured = false;
            
            // DO NOT THROW. Let the server start so other APIs (like Admin listing audit) can function.
            return;
        }

        if (authBypassOtpLock === 'true') {
            bootstrapLogger.error('🚨 SECURITY ERROR: AUTH_BYPASS_OTP_LOCK=true is set in production. This bypass is forbidden.');
            otpGuardState.isSafeToProceed = false;
            otpGuardState.isConfigured = false;
            return;
        }

        bootstrapLogger.info('✅ OTP Guard: Production SMS provider configured and validated');
        otpGuardState.isSafeToProceed = true;
        otpGuardState.isConfigured = true;
    }
}

/**
 * Middleware: Runtime OTP configuration check
 * Validates that OTP is safe to use before processing login requests
 * 
 * Can be applied to sensitive OTP routes to ensure configuration is valid
 */
export function otpConfigurationCheck(req: Request, res: Response, next: NextFunction): void {
    if (!otpGuardState.isConfigured) {
        logger.error('OTP system not properly configured at startup', {
            endpoint: req.path,
            method: req.method
        });
        res.status(503).json({
            success: false,
            error: 'OTP authentication service temporarily unavailable',
            code: 'OTP_SERVICE_UNAVAILABLE'
        });
        return;
    }

    if (!otpGuardState.isSafeToProceed) {
        logger.error('OTP system validation failed; refusing to process OTP requests', {
            endpoint: req.path,
            method: req.method,
            warnings: otpGuardState.warnings
        });
        res.status(503).json({
            success: false,
            error: 'OTP authentication service is not properly configured',
            code: 'OTP_MISCONFIGURED'
        });
        return;
    }

    next();
}

/**
 * Get current OTP guard state (for debugging/monitoring)
 */
export function getOtpGuardState() {
    return { ...otpGuardState };
}

/**
 * Health check endpoint for OTP system
 */
export function otpHealthCheck(): {
    status: 'healthy' | 'warning' | 'critical';
    isConfigured: boolean;
    isSafeToProceed: boolean;
    warnings: string[];
} {
    if (!otpGuardState.isSafeToProceed) {
        return {
            status: 'critical',
            isConfigured: otpGuardState.isConfigured,
            isSafeToProceed: otpGuardState.isSafeToProceed,
            warnings: otpGuardState.warnings
        };
    }

    if (otpGuardState.warnings.length > 0) {
        return {
            status: 'warning',
            isConfigured: otpGuardState.isConfigured,
            isSafeToProceed: otpGuardState.isSafeToProceed,
            warnings: otpGuardState.warnings
        };
    }

    return {
        status: 'healthy',
        isConfigured: otpGuardState.isConfigured,
        isSafeToProceed: otpGuardState.isSafeToProceed,
        warnings: []
    };
}
