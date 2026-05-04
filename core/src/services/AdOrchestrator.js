"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAd = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const db_1 = require("@core/config/db");
const logger_1 = __importDefault(require("@core/utils/logger"));
const AppError_1 = require("@core/utils/AppError");
// Specialized Services
const AdDuplicateService_1 = require("./AdDuplicateService");
const FraudDetectionService_1 = require("./FraudDetectionService");
const AdCreationService_1 = require("./AdCreationService");
const ListingSubmissionPolicy_1 = require("./ListingSubmissionPolicy");
const StatusMutationService_1 = require("./StatusMutationService");
const AdStatusService_1 = require("./AdStatusService");
const imageQueue_1 = require("@core/queues/imageQueue");
const AdValidationService_1 = require("./AdValidationService");
const listingType_1 = require("@core/constants/enums/listingType");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
/**
 * AdOrchestrator
 * The Single Source of Truth for Ad mutations.
 * Enforces transaction boundaries and domain coordination.
 */
const createAd = async (data, context) => {
    const start = Date.now();
    const connection = (0, db_1.getUserConnection)();
    const session = await connection.startSession();
    const adId = new mongoose_1.default.Types.ObjectId();
    let createdAd = null;
    try {
        const listingType = data.listingType || listingType_1.LISTING_TYPE.AD;
        await session.withTransaction(async () => {
            // 1. Atomic Slot Deduction
            if (context.actor === 'USER' && !context.allowQuotaBypass) {
                const slotResult = await ListingSubmissionPolicy_1.ListingSubmissionPolicy.reserveSlot({
                    userId: context.sellerId,
                    listingType: listingType,
                    listingId: adId.toString(),
                    session,
                    actor: 'user',
                });
                if (slotResult.source === 'idempotency_hit') {
                    logger_1.default.info('AdOrchestrator: Idempotency hit for slot consumption', { adId: adId.toString() });
                }
            }
            // 1.5 Threshold Validation (Pro-Seller Policy)
            if (context.actor === 'USER' && !context.allowQuotaBypass) {
                const thresholdResult = await (0, AdValidationService_1.validateSellerTypeThreshold)(context.sellerId, listingType);
                if (!thresholdResult.ok) {
                    throw new AppError_1.AppError(thresholdResult.reason || 'Threshold exceeded', 400, thresholdResult.code);
                }
            }
            // 2. Prepare Payload (Normalization & Snapshotting)
            const adContext = {
                actor: context.actor,
                authUserId: context.authUserId,
                sellerId: context.sellerId,
                idempotencyKey: context.idempotencyKey,
                requestId: context.requestId,
                allowQuotaBypass: context.allowQuotaBypass,
                fraudRisk: context.fraudRisk === 'allow' || context.fraudRisk === 'flag' || context.fraudRisk === 'captcha' || context.fraudRisk === 'moderation' || context.fraudRisk === 'block'
                    ? context.fraudRisk
                    : undefined,
                fraudScore: context.fraudScore,
            };
            const payload = await AdCreationService_1.AdCreationService.preparePayload(data, adContext, false, undefined, adId.toString());
            payload._id = adId;
            // 3. Duplicate Detection
            const duplicateCheck = await AdDuplicateService_1.AdDuplicateService.checkDuplicate(payload, context.sellerId, payload.imageHashes, session);
            if (duplicateCheck.isDuplicate) {
                await (0, AdDuplicateService_1.logDuplicateEvent)({
                    sellerId: context.sellerId,
                    matchedAdId: duplicateCheck.matchedAdId,
                    action: 'blocked',
                    reason: duplicateCheck.reason,
                    duplicateFingerprint: (0, AdDuplicateService_1.buildDuplicateFingerprint)(payload, context.sellerId),
                    details: { checkResult: duplicateCheck }
                }, session);
                const { createDuplicateError } = await Promise.resolve().then(() => __importStar(require('./AdValidationService')));
                throw createDuplicateError(duplicateCheck.reason);
            }
            // 4. Fraud Analysis
            // Map orchestration context to FraudContext
            const fraudContext = {
                userId: new mongoose_1.default.Types.ObjectId(context.authUserId),
                ip: context.ip || '0.0.0.0',
                deviceFingerprint: context.deviceFingerprint,
                action: 'POST_AD',
                price: payload.price,
                description: payload.description,
                adId
            };
            const fraudResult = await (0, FraudDetectionService_1.analyzeFraudRisk)(fraudContext);
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
            // Image optimization is dispatched below after the Ad document is created.
            // 7. Persistence
            const shouldAutoApprove = context.actor === 'ADMIN' && payload.moderationStatus !== 'held_for_review';
            if (shouldAutoApprove) {
                payload.status = listingStatus_1.LISTING_STATUS.PENDING;
                payload.moderationStatus = 'held_for_review';
                payload.expiresAt = undefined;
            }
            const ads = await Ad_1.default.create([payload], { session });
            if (ads && ads.length > 0) {
                createdAd = ads[0];
            }
            // 8. Final Approval (Only if actor is ADMIN and not held for review)
            if (createdAd && shouldAutoApprove) {
                const approvedAt = new Date();
                await (0, StatusMutationService_1.mutateStatus)({
                    domain: 'ad',
                    entityId: createdAd._id.toString(),
                    toStatus: listingStatus_1.LISTING_STATUS.LIVE,
                    actor: {
                        type: 'admin',
                        id: context.authUserId,
                    },
                    reason: 'Approved during admin create flow',
                    metadata: {
                        action: 'moderation_approve',
                        sourceRoute: 'AdOrchestrator.createAd',
                        listingType: createdAd.listingType || 'ad',
                    },
                    patch: {
                        moderatorId: context.authUserId,
                        approvedAt,
                        approvedBy: context.authUserId,
                        expiresAt: await (0, AdStatusService_1.computeActiveExpiry)(listingType),
                        moderationStatus: 'manual_approved',
                        rejectionReason: undefined,
                        $push: {
                            timeline: {
                                status: listingStatus_1.LISTING_STATUS.LIVE,
                                timestamp: approvedAt,
                                reason: 'Approved during admin create flow',
                            },
                        },
                    },
                    session,
                });
                createdAd = await Ad_1.default.findById(createdAd._id).session(session);
            }
            // 9. Dispatch Image Optimization
            if (createdAd && Array.isArray(createdAd.images) && createdAd.images.length > 0) {
                // Must not fail the transaction if queue push fails
                (0, imageQueue_1.enqueueImageOptimization)(createdAd._id.toString(), 'ad', createdAd.images).catch(err => {
                    logger_1.default.error('Failed to enqueue image optimization from AdOrchestrator', err);
                });
            }
        });
        if (!createdAd) {
            return null;
        }
        const duration = Date.now() - start;
        logger_1.default.info('AdOrchestrator: createAd successful', {
            adId: adId.toString(),
            duration: `${duration}ms`,
            authUserId: context.authUserId,
            sellerId: context.sellerId
        });
        // 📊 BUSINESS METRIC: Listing Creation
        // NOTE: Counter must be pre-registered in @core/utils/metrics at startup.
        // We only look it up here — never create it — to avoid prom-client double-registration errors.
        Promise.resolve().then(() => __importStar(require('@core/utils/metrics'))).then(({ register: prometheusRegister }) => {
            const counter = prometheusRegister.getSingleMetric('esparex_listing_creation_total');
            if (counter) {
                counter.inc({
                    listingType: String(createdAd?.listingType || 'ad'),
                    actor: context.actor,
                });
            }
        }).catch(() => { });
        return createdAd;
    }
    catch (error) {
        const duration = Date.now() - start;
        logger_1.default.error('AdOrchestrator: createAd failed', {
            authUserId: context.authUserId,
            sellerId: context.sellerId,
            adId: adId.toString(),
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
    finally {
        void session.endSession();
    }
};
exports.createAd = createAd;
//# sourceMappingURL=AdOrchestrator.js.map