import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { extractDeviceFingerprint } from '../utils/deviceFingerprint';
import { analyzeFraudRisk, FraudContext, FraudDecision, RiskLevel } from '../services/FraudDetectionService';
import { detectSpam } from '../services/SpamDetectorService';
import { detectAiSpam } from '../utils/aiSpamDetector';
import logger from '../utils/logger';
import { getUserConnection } from '../config/db';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import { env } from '../config/env';

export interface FraudRequest extends Request {
    fraudRisk?: RiskLevel;
    fraudScore?: number;
    riskState?: string;
}

const FRAUD_DECISION_TIMEOUT_MS = env.FRAUD_DECISION_TIMEOUT_MS;
const SHADOW_ONLY_PREFIXES = ['/api/v1/auth/', '/api/v1/health', '/health'];

const shouldRunInShadowMode = (req: Request): boolean => {
    const url = req.originalUrl || req.url || '';
    return SHADOW_ONLY_PREFIXES.some((prefix) => url.startsWith(prefix));
};

const isFraudDatastoreReady = (): boolean => (getUserConnection().readyState as number) === 1;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
            reject(new Error(`Fraud decision timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((value) => {
                clearTimeout(timeoutHandle);
                resolve(value);
            })
            .catch((error: unknown) => {
                clearTimeout(timeoutHandle);
                reject(error instanceof Error ? error : new Error(String(error)));
            });
    });

export const fraudMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fraudReq = req as FraudRequest;
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const deviceFingerprint = extractDeviceFingerprint(req);

        // Clone body to remove huge base64 images before text spam scanning
        const bodyRaw = req.body as Record<string, unknown>;
        const bodyClone: Record<string, unknown> = { ...bodyRaw };
        if (Array.isArray(bodyClone.images)) bodyClone.images = '[REDACTED_IMAGES]';
        if (typeof bodyClone.image === 'string') bodyClone.image = '[REDACTED_IMAGE]';

        // Ensure string extracts regardless of payload structure
        const bodyStr = JSON.stringify(bodyClone);
        const descriptionObj = bodyRaw.description ?? bodyRaw.text ?? '';
        const description = typeof descriptionObj === 'string' ? descriptionObj : '';
        const priceObj = bodyRaw.price;
        const price = typeof priceObj === 'number' ? priceObj : undefined;

        // Perform parallel text validations
        const spamCheck = detectSpam(bodyStr); // Full depth scan
        const descAiCheck = detectAiSpam(description); // AI density scan

        const context: FraudContext = {
            userId: req.user?._id ? (typeof req.user._id === 'string' ? new mongoose.Types.ObjectId(req.user._id) : req.user._id) : undefined,
            ip,
            deviceFingerprint,
            action: `${req.method}_${req.originalUrl}`,
            description,
            price,
            isAiSpam: descAiCheck.isAiSpam,
            aiSpamScore: descAiCheck.score,
            isTextSpam: spamCheck.isSpam,
            textSpamScore: spamCheck.score
        };

        const runFraudDecision = async (): Promise<FraudDecision> => {
            if (!isFraudDatastoreReady()) {
                throw new Error('Fraud datastore is not ready');
            }
            return withTimeout(analyzeFraudRisk(context), FRAUD_DECISION_TIMEOUT_MS);
        };

        if (shouldRunInShadowMode(req)) {
            setImmediate(() => {
                runFraudDecision().catch((error: unknown) => {
                    logger.warn('[Fraud Middleware] Shadow execution skipped', {
                        route: req.originalUrl,
                        method: req.method,
                        error: error instanceof Error ? error.message : String(error)
                    });
                });
            });
            return next();
        }

        const decision = await runFraudDecision();

        // Score 41-60 → CAPTCHA requirement
        if (decision.riskLevel === 'captcha') {
            logger.warn('[Fraud Middleware] Captcha required', { ...context, score: decision.totalScore });
            res.status(403).json({
                success: false,
                error: 'Suspicious activity detected. Please complete the CAPTCHA.',
                code: 'REQUIRES_CAPTCHA',
                riskScore: decision.totalScore
            });
            return;
        }

        // Score 61-80 → Moderation Queue enforcement
        if (decision.riskLevel === 'moderation') {
            logger.warn('[Fraud Middleware] Request queued for moderation', { ...context, score: decision.totalScore });
            // Attach a request property so the controller creates ad as 'pending' + held_for_review automatically
            fraudReq.fraudRisk = decision.riskLevel;
            fraudReq.fraudScore = decision.totalScore;
            return next();
        }

        // Score 81+ → Hard Block
        if (decision.riskLevel === 'block') {
            logger.error('[Fraud Middleware] Request explicitly blocked', { ...context, score: decision.totalScore });
            res.status(400).json({
                success: false,
                error: "We couldn’t submit your ad. Please check your content and try again.",
                code: 'ACTION_BLOCKED',
                riskScore: decision.totalScore
            });
            return;
        }

        // Score 21-40 -> Flag
        if (decision.riskLevel === 'flag') {
            fraudReq.fraudRisk = decision.riskLevel;
            fraudReq.fraudScore = decision.totalScore;
        }

        return next();
    } catch (err) {
        const isFailSafeEnabled = await isEnabled(FeatureFlag.ENABLE_FAILSAFE_FRAUD);
        
        logger.warn('[Fraud Middleware] Service dependency failure / timeout', {
            route: req.originalUrl,
            method: req.method,
            failSafeActive: isFailSafeEnabled,
            error: err instanceof Error ? err.message : String(err)
        });

        if (isFailSafeEnabled) {
            // FAIL-SAFE: If fraud service is down, we don't skip check.
            // We force the request into a "Restricted" state (Moderation Queue).
            fraudReq.fraudRisk = 'moderation';
            fraudReq.riskState = 'UNKNOWN';
            fraudReq.fraudScore = 0;
            return next();
        }

        // Legacy/Fail-Open fallback (not recommended for production)
        next();
    }
};
