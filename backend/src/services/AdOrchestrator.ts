import mongoose from 'mongoose';
import Ad, { IAd } from '../models/Ad';
import { getUserConnection } from '../config/db';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

// Specialized Services
import { AdDuplicateService, logDuplicateEvent, buildDuplicateFingerprint } from './AdDuplicateService';
import { analyzeFraudRisk, FraudContext } from './FraudDetectionService';
import { AdCreationService } from './AdCreationService';
import { ListingSubmissionPolicy } from './ListingSubmissionPolicy';
import { mutateStatus } from './StatusMutationService';
import { computeActiveExpiry } from './adStatusService';
import { enqueueImageOptimization } from '../queues/imageQueue';
import { validateSellerTypeThreshold } from './AdValidationService';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import { AD_STATUS } from '../../../shared/enums/adStatus';

export interface AdOrchestrationContext {
    authUserId: string; // The authenticated subject (JWT)
    sellerId: string;   // The canonical marketplace owner
    actor: 'USER' | 'ADMIN';
    idempotencyKey?: string;
    requestId?: string;
    fraudRisk?: string;
    fraudScore?: number;
    allowQuotaBypass?: boolean;
    riskState?: string;
}

/**
 * AdOrchestrator
 * The Single Source of Truth for Ad mutations.
 * Enforces transaction boundaries and domain coordination.
 */
export const createAd = async (data: any, context: AdOrchestrationContext): Promise<IAd | null> => {
    const start = Date.now();
    const isOrchestratorEnabled = await isEnabled(FeatureFlag.ENABLE_AD_ORCHESTRATOR);
    
    if (!isOrchestratorEnabled) {
        // Fallback to legacy path during gradual rollout (if adService still exists)
        const adService = await import('./AdService');
        return adService.createAd(data, {
            ...context,
            allowSuspendedUser: false,
        } as any);
    }

    const connection = getUserConnection();
    const session = await connection.startSession();
    
    const adId = new mongoose.Types.ObjectId();
    let createdAd: IAd | null = null;

    try {
        await session.withTransaction(async () => {
            // 1. Atomic Slot Deduction
            if (context.actor === 'USER' && !context.allowQuotaBypass) {
                const slotResult = await ListingSubmissionPolicy.reserveSlot({
                    userId: context.sellerId,
                    listingType: LISTING_TYPE.AD,
                    listingId: adId.toString(),
                    session,
                    actor: 'user',
                });
                if (slotResult.source === 'idempotency_hit') {
                    logger.info('AdOrchestrator: Idempotency hit for slot consumption', { adId: adId.toString() });
                }
            }

            // 1.5 Threshold Validation (Pro-Seller Policy)
            if (context.actor === 'USER' && !context.allowQuotaBypass) {
                const thresholdResult = await validateSellerTypeThreshold(
                    context.sellerId,
                    (data.listingType as any) || LISTING_TYPE.AD
                );
                if (!thresholdResult.ok) {
                    throw new AppError(thresholdResult.reason || 'Threshold exceeded', 400, thresholdResult.code);
                }
            }

            // 2. Prepare Payload (Normalization & Snapshotting)
            const payload = await AdCreationService.preparePayload(data, context as any, false, undefined, adId.toString());
            (payload as any)._id = adId;

            // 3. Duplicate Detection
            const duplicateCheck = await AdDuplicateService.checkDuplicate(
                payload as any,
                context.sellerId,
                (payload as any).imageHashes,
                session as any
            );

            if (duplicateCheck.isDuplicate) {
                await logDuplicateEvent({
                    sellerId: context.sellerId,
                    matchedAdId: duplicateCheck.matchedAdId,
                    action: 'blocked',
                    reason: duplicateCheck.reason,
                    duplicateFingerprint: buildDuplicateFingerprint(payload as any, context.sellerId),
                    details: { checkResult: duplicateCheck }
                }, session as any);

                const { createDuplicateError } = await import('./AdValidationService');
                throw createDuplicateError(duplicateCheck.reason);
            }

            // 4. Fraud Analysis
            // Map orchestration context to FraudContext
            const fraudContext: FraudContext = {
                userId: new mongoose.Types.ObjectId(context.authUserId),
                ip: (context as any).ip || '0.0.0.0', // Extract from context if injected by controller
                deviceFingerprint: (context as any).deviceFingerprint,
                action: 'POST_AD',
                price: payload.price,
                description: payload.description,
                adId
            };
            
            const fraudResult = await analyzeFraudRisk(fraudContext);
            payload.fraudScore = fraudResult.totalScore;

            // 5. Apply Moderation based on Fraud Result
            if (fraudResult.riskLevel === 'moderation' || fraudResult.riskLevel === 'block' || context.riskState === 'SAFE_MODE') {
                payload.moderationStatus = 'held_for_review';
                payload.moderationReason = fraudResult.riskLevel === 'block' 
                    ? 'Blocked: High risk fraud score detected' 
                    : context.riskState === 'SAFE_MODE' ? 'SYSTEM_FRAUD_TIMEOUT: Entering Safe Mode' : 'Flagged for moderation by fraud scoring';
                
                // If in Safe Mode or High Risk, ensure status is PENDING regardless of actor
                payload.status = 'pending'; 
            }

            // 6. Media Processing (Already done in preparePayload, but if needed specifically)
            // Note: AdCreationService.preparePayload already calls internal processImages.
            // If we want to use AdMediaService explicitly:
            // if (data.files) {
            //    const imageMeta = await AdMediaService.processImages(adId.toString(), data.files, session);
            //    payload.images = imageMeta.map(m => m.url);
            //    payload.imageHashes = imageMeta.map(m => m.hash);
            // }

            // 7. Persistence
            const shouldAutoApprove = context.actor === 'ADMIN' && payload.moderationStatus !== 'held_for_review';
            if (shouldAutoApprove) {
                payload.status = AD_STATUS.PENDING;
                payload.moderationStatus = 'held_for_review';
                payload.expiresAt = undefined;
            }

            const ads = await Ad.create([payload], { session });
            if (ads && ads.length > 0) {
                createdAd = ads[0] as unknown as IAd;
            }

            // 8. Final Approval (Only if actor is ADMIN and not held for review)
            if (createdAd && shouldAutoApprove) {
                const approvedAt = new Date();
                await mutateStatus({
                    domain: 'ad',
                    entityId: (createdAd as any)._id.toString(),
                    toStatus: AD_STATUS.LIVE,
                    actor: {
                        type: 'admin',
                        id: context.authUserId,
                    },
                    reason: 'Approved during admin create flow',
                    metadata: {
                        action: 'moderation_approve',
                        sourceRoute: 'AdOrchestrator.createAd',
                        listingType: (createdAd as any).listingType || 'ad',
                    },
                    patch: {
                        moderatorId: context.authUserId,
                        approvedAt,
                        approvedBy: context.authUserId,
                        expiresAt: await computeActiveExpiry((createdAd as any).listingType || 'ad'),
                        moderationStatus: 'manual_approved',
                        rejectionReason: undefined,
                        $push: {
                            timeline: {
                                status: AD_STATUS.LIVE,
                                timestamp: approvedAt,
                                reason: 'Approved during admin create flow',
                            },
                        },
                    },
                    session,
                });

                createdAd = await Ad.findById((createdAd as any)._id).session(session) as IAd | null;
            }

            // 9. Dispatch Image Optimization
            if (createdAd && Array.isArray(createdAd.images) && createdAd.images.length > 0) {
                // Must not fail the transaction if queue push fails
                enqueueImageOptimization(
                    (createdAd as any)._id.toString(),
                    'ad',
                    createdAd.images
                ).catch(err => {
                    logger.error('Failed to enqueue image optimization from AdOrchestrator', err);
                });
            }
        });

        if (!createdAd) {
            return null;
        }

        const duration = Date.now() - start;
        logger.info('AdOrchestrator: createAd successful', {
            adId: adId.toString(),
            duration: `${duration}ms`,
            authUserId: context.authUserId,
            sellerId: context.sellerId
        });

        return createdAd;
    } catch (error) {
        const duration = Date.now() - start;
        logger.error('AdOrchestrator: createAd failed', {
            authUserId: context.authUserId,
            sellerId: context.sellerId,
            adId: adId.toString(),
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    } finally {
        session.endSession();
    }
};
