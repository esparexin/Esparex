import mongoose, { ClientSession } from 'mongoose';
import Ad from '../models/Ad';
import {
    buildDuplicateFingerprint, 
    findExistingSelfDuplicate, 
    assessCrossUserDuplicateRisk,
    logDuplicateEvent,
    DuplicatePayload
} from './AdValidationService';
import { AD_STATUS } from '../../../shared/enums/adStatus';

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    riskScore: number;
    matchedAdId?: mongoose.Types.ObjectId;
    reason?: string;
}

/**
 * AdDuplicateService
 * Handles high-concurrency duplicate detection and risk assessment.
 */
export class AdDuplicateService {
    /**
     * Check if an ad is a duplicate of an existing active listing.
     * Combines self-duplicate check, fingerprinting, and cross-user risk.
     */
    static async checkDuplicate(
        payload: DuplicatePayload,
        sellerId: string,
        imageHashes: string[] = [],
        session?: ClientSession
    ): Promise<DuplicateCheckResult> {
        const categoryId = payload.categoryId ? String(payload.categoryId) : undefined;
        const locationId = (payload.location as Record<string, unknown>)?.locationId
            ? String((payload.location as Record<string, unknown>).locationId)
            : undefined;

        // 1. Precise Self-Duplicate Check (Idempotency Guard)
        const selfDuplicate = categoryId
            ? await findExistingSelfDuplicate(
                sellerId,
                categoryId,
                locationId,
                payload.price as number,
                payload.brandId ? String(payload.brandId) : undefined,
                payload.modelId ? String(payload.modelId) : undefined,
                undefined,
                session,
                payload.listingType
            )
            : null;

        if (selfDuplicate) {
            return {
                isDuplicate: true,
                riskScore: 100,
                matchedAdId: selfDuplicate._id,
                reason: 'Existing active listing detected for this user.'
            };
        }

        // 2. Fingerprint Check (Unique constraint fallback)
        const fingerprint = buildDuplicateFingerprint(payload, sellerId);
        if (fingerprint) {
            const fingerprintMatch = await Ad.findOne({
                duplicateFingerprint: fingerprint,
                status: { $in: [AD_STATUS.LIVE, AD_STATUS.PENDING] }
            })
                .session(session as ClientSession)
                .select('_id')
                .lean<{ _id: mongoose.Types.ObjectId } | null>();
            
            if (fingerprintMatch) {
                return {
                    isDuplicate: true,
                    riskScore: 90,
                    matchedAdId: fingerprintMatch._id,
                    reason: 'Duplicate fingerprint detected.'
                };
            }
        }

        // 3. Cross-User Risk Assessment
        const crossUserRisk = await assessCrossUserDuplicateRisk(payload, sellerId, imageHashes, session);
        
        return {
            isDuplicate: crossUserRisk.score > 70, // Threshold for blocking
            riskScore: crossUserRisk.score,
            matchedAdId: crossUserRisk.matchedAdId,
            reason: crossUserRisk.reason
        };
    }
}

export {
    buildDuplicateFingerprint,
    logDuplicateEvent
};
