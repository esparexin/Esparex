import mongoose, { ClientSession } from 'mongoose';
import { getUserConnection } from '../config/db';
import { 
    validateTransition as validateLifecycleTransition, 
    resolveLifecycleDomain,
    type ValidDomain 
} from './LifecycleGuard';
import { enforceLifecycleMutationPolicy } from './LifecyclePolicyGuard';
import StatusHistory from '../models/StatusHistory';
import AdminMetrics from '../models/AdminMetrics';
import logger from '../utils/logger';
import { ActorMetadata, ACTOR_TYPE } from '../../../shared/enums/actor';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { lifecycleEvents } from '../events';

// Import domain models
import Ad from '../models/Ad';
import User from '../models/User';
import Business from '../models/Business';

export type { ValidDomain };

export interface MutationRequest {
    domain: ValidDomain;
    entityId: string | mongoose.Types.ObjectId;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    patch?: Record<string, any>; // Status-specific updates like soldAt, rejectionReason
    metadata?: Record<string, any>; // Audit metadata
    session?: ClientSession; // Optional external session
}

const toLower = (value: unknown): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';

const isListingLifecycleDomain = (domain: ValidDomain): boolean =>
    domain === 'ad' || domain === 'service' || domain === 'spare_part_listing';

const isModerationDeactivationAction = (metadata?: Record<string, unknown>): boolean => {
    const action = toLower(metadata?.action);
    return action === 'moderation_deactivate' || action === 'moderation_soft_delete';
};

const canBypassInvalidTransition = (params: {
    error: unknown;
    actor: ActorMetadata;
    toStatus: string;
    resolvedDomain: ValidDomain;
    metadata?: Record<string, unknown>;
}): boolean => {
    const typedError = params.error as { code?: string };
    if (typedError.code !== 'INVALID_LIFECYCLE_TRANSITION') return false;
    if (params.actor.type !== ACTOR_TYPE.ADMIN) return false;
    if (!isListingLifecycleDomain(params.resolvedDomain)) return false;
    if (toLower(params.toStatus) !== AD_STATUS.DEACTIVATED) return false;
    return isModerationDeactivationAction(params.metadata);
};

/**
 * 🛠️ Centralized Status Mutation Service
 * 
 * Enforces transaction-safe lifecycle transitions across all domains.
 * Integrates with:
 * 1. LifecycleGuard (Validation)
 * 2. StatusHistory (Unified Audit Trail)
 * 3. Metrics Telemetry (Observability)
 */
export const mutateStatus = async (request: MutationRequest) => {
    const { domain, entityId, toStatus, actor, reason, patch, metadata, session: externalSession } = request;
    const connection = getUserConnection();
    
    // Session management: Use provided session or manage lifecycle of a new one
    let session = externalSession;
    let isInternalSession = false;

    if (!session) {
        session = await connection.startSession();
        isInternalSession = true;
    }

    const startTime = Date.now();
    let fromStatus = 'unknown';
    let resolvedListingType: string | undefined;

    try {
        let result = null;

        const executeOperations = async (activeSession: ClientSession) => {
            // 1. Resolve Model
            const Model = getModelForDomain(domain) as any;
            const doc = await Model.findById(entityId).setOptions({ withDeleted: true }).session(activeSession);
            
            if (!doc) {
                throw Object.assign(new Error(`Entity ${entityId} not found in domain ${domain}`), { statusCode: 404 });
            }

            fromStatus = (doc as any).status;
            const listingType = (doc as any).listingType;
            resolvedListingType = listingType;

            // 2. Lifecycle Validation (Type-aware for unified ad model)
            const resolvedDomain = resolveLifecycleDomain(domain, listingType);
            try {
                validateLifecycleTransition(resolvedDomain, fromStatus, toStatus);
            } catch (error) {
                if (!canBypassInvalidTransition({
                    error,
                    actor,
                    toStatus,
                    resolvedDomain,
                    metadata,
                })) {
                    throw error;
                }

                logger.warn('Status Mutation BYPASS: allowing admin moderation deactivation outside strict transition map', {
                    domain,
                    resolvedDomain,
                    entityId: String(entityId),
                    fromStatus,
                    toStatus,
                    action: metadata?.action,
                    actorType: actor.type,
                    actorId: actor.id,
                });
            }
            enforceLifecycleMutationPolicy({
                domain: resolvedDomain,
                fromStatus,
                toStatus,
                actor,
                patch,
                metadata,
            });

            // 4. Update Document
            (doc as any).status = toStatus;
            (doc as any).statusChangedAt = new Date();
            if (reason) (doc as any).statusReason = reason;

            // 🛡️ DATA INTEGRITY: Coerce stale/legacy moderationStatus values that are
            // not in the current enum. These exist in documents written before the enum
            // was tightened (e.g. "approved" was an old value, now split into
            // "auto_approved" / "manual_approved"). Mongoose validates the entire
            // document on .save(), so a single stale field blocks ALL mutations.
            const VALID_MODERATION_STATUSES = new Set([
                'auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden'
            ]);
            const currentModerationStatus = (doc as any).moderationStatus;
            if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
                logger.warn('StatusMutationService: coercing stale moderationStatus', {
                    entityId: String(entityId),
                    domain,
                    staleValue: currentModerationStatus,
                    coercedTo: 'manual_approved',
                });
                (doc as any).moderationStatus = 'manual_approved';
            }

            // Apply status-specific patch (e.g., soldAt, rejectionReason, $push: { timeline })
            if (patch) {
                for (const [key, value] of Object.entries(patch)) {
                    if (key === '$push' && typeof value === 'object' && value !== null) {
                        for (const [pKey, pVal] of Object.entries(value)) {
                            if (Array.isArray((doc as any)[pKey])) {
                                (doc as any)[pKey].push(pVal);
                            }
                        }
                    } else {
                        (doc as any)[key] = value;
                    }
                }
            }
            
            await doc.save({ session: activeSession });

            // 5. Record Unified Status History
            await StatusHistory.create([{
                domain,
                entityId: (entityId instanceof mongoose.Types.ObjectId) ? entityId : new mongoose.Types.ObjectId(String(entityId)),
                fromStatus,
                toStatus,
                actorType: actor.type,
                actorId: (actor.id && mongoose.Types.ObjectId.isValid(actor.id)) ? new mongoose.Types.ObjectId(actor.id) : undefined,
                reason,
                metadata: {
                    ...metadata,
                    ip: actor.ip,
                    ua: actor.userAgent,
                    mutationService: 'v1'
                }
            }], { session: activeSession });

            return typeof (doc as any).toObject === 'function' ? doc.toObject() : doc;
        };

        if (isInternalSession && session) {
            await session.withTransaction(async () => {
                result = await executeOperations(session!);
            });
        } else if (session) {
            result = await executeOperations(session);
        }

        const duration = Date.now() - startTime;
        
        // 6. Record Real-time Telemetry (Success) - Always outside critical transaction
        setImmediate(() => {
            recordMutationMetric('success', domain, fromStatus, toStatus).catch(err => {
                logger.error('Telemetry Error (Success Path):', err);
            });
        });

        logger.info(`Status Mutation SUCCESS: ${domain} ${entityId} (${fromStatus} -> ${toStatus})`, { 
            durationMs: duration,
            actorType: actor.type,
            actorId: actor.id
        });
        
        // 7. Dispatch Global Lifecycle Event (Decoupled side-effects)
        if (domain === 'ad') {
            await lifecycleEvents.dispatch('ad.lifecycle.changed', {
                adId: entityId.toString(),
                fromStatus,
                toStatus,
                actorType: actor.type,
                actorId: actor.id,
                source: actor.type,
                reason
            });

            if (
                toStatus === 'rejected'
                && String(metadata?.action || '').trim().toLowerCase() === 'moderation_reject'
            ) {
                await lifecycleEvents.dispatch('listing.rejected', {
                    listingId: entityId.toString(),
                    listingType: resolvedListingType || 'ad',
                    rejectionReason: typeof (patch as Record<string, unknown> | undefined)?.rejectionReason === 'string'
                        ? String((patch as Record<string, unknown>).rejectionReason)
                        : undefined,
                    actorType: actor.type,
                    actorId: actor.id,
                });
            }

            if (
                toStatus === 'live'
                && String(metadata?.action || '').trim().toLowerCase() === 'moderation_approve'
            ) {
                const listingType =
                    typeof metadata?.listingType === 'string'
                        ? String(metadata.listingType)
                        : (
                            typeof (patch as Record<string, unknown> | undefined)?.listingType === 'string'
                                ? String((patch as Record<string, unknown>).listingType)
                                : undefined
                        );
                await lifecycleEvents.dispatch('listing.approved', {
                    listingId: entityId.toString(),
                    listingType: listingType || 'ad',
                    approvedAt: (
                        (patch as Record<string, unknown> | undefined)?.approvedAt instanceof Date
                            ? ((patch as Record<string, unknown>).approvedAt as Date).toISOString()
                            : new Date().toISOString()
                    ),
                    actorType: actor.type,
                    actorId: actor.id,
                    source: String(metadata?.sourceRoute || metadata?.action || actor.type),
                });
            }
        }
        
        return result;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // Record Real-time Telemetry (Rejection/Failure)
        const isValidationFailure = error.code === 'INVALID_LIFECYCLE_TRANSITION' || error.code === 'LIFECYCLE_LOCKED';
        const metricStatus = isValidationFailure ? 'rejection' : 'failure';
        
        setImmediate(() => {
            recordMutationMetric(metricStatus as any, domain, fromStatus, toStatus).catch(err => {
                logger.error('Telemetry Error (Error Path):', err);
            });
        });
        
        logger.error(`Status Mutation FAILED: ${domain} ${entityId} -> ${toStatus}`, {
            error: error.message,
            code: error.code,
            durationMs: duration,
            actorType: actor.type
        });
        
        throw error;
    } finally {
        if (isInternalSession && session) {
            await session.endSession();
        }
    }
};

/**
 * 🛠️ Bulk Status Mutation Service
 * Processes multiple entity transitions.
 * 
 * NOTE: For production safety and audit granularity, we process each mutation 
 * individually to ensure full LifecycleGuard validation and unique audit trails.
 */
export const mutateStatuses = async (requests: MutationRequest[]) => {
    const results = [];
    for (const request of requests) {
        results.push(await mutateStatus(request));
    }
    return results;
};

export const mutateStatusesBulk = async (
    domain: ValidDomain,
    entityIds: string[],
    toStatus: string,
    actor: MutationRequest['actor'],
    reason?: string
): Promise<number> => {
    if (!entityIds.length) return 0;
    
    const Model = getModelForDomain(domain) as any;
    const docs = await Model.find({ _id: { $in: entityIds } })
        .select('_id status listingType')
        .lean();
    if (!docs.length) return 0;

    await mutateStatuses(
        docs.map((doc: any) => ({
            domain,
            entityId: String(doc._id),
            toStatus,
            actor,
            reason,
            metadata: {
                action: 'bulk_mutation',
                sourceRoute: 'StatusMutationService.mutateStatusesBulk',
                listingType: doc.listingType,
            },
        }))
    );

    if (domain === 'ad' && toStatus === AD_STATUS.EXPIRED) {
        await lifecycleEvents.dispatch('ad.expired.bulk', { count: docs.length, source: 'cron_expireOutdatedAds' });
    }

    return docs.length;
};

/**
 * Domain-to-Model mapping SSOT
 */
function getModelForDomain(domain: ValidDomain) {
    switch (domain) {
        case 'ad': return Ad;
        case 'user': return User;
        case 'business': return Business;
        case 'service': return Ad;
        case 'spare_part_listing': return Ad;
        case 'catalog_part': throw new Error('Domain \'catalog_part\' uses CatalogStatus — route through admin catalog service, not statusMutationService');
        default: throw new Error(`Unsupported domain: ${domain}`);
    }
}


/**
 * Record mutation metrics for observability
 */
async function recordMutationMetric(
    status: 'success' | 'rejection' | 'failure',
    domain: string,
    from: string,
    to: string
) {
    try {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const update: any = {
            $inc: {
                [`payload.total`]: 1,
                [`payload.${status}`]: 1,
                [`payload.domains.${domain}`]: 1,
                [`payload.transitions.${from}_to_${to}`]: 1
            }
        };

        // AdminMetrics often resides on a separate restricted connection
        await AdminMetrics.findOneAndUpdate(
            { metricModule: 'status_mutations', aggregationDate: date },
            update,
            { upsert: true }
        );
    } catch (err) {
        // Telemetry failure should NEVER block the mutation transaction
        logger.error('Critical Telemetry Failure:', { error: String(err) });
    }
}
