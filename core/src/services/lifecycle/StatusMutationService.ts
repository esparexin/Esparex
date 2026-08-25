import mongoose, { type ClientSession } from 'mongoose';
import type { ListingUpdate } from '../../domains/listings/ports/ListingRepositoryPort';
import { 
    validateTransition as validateLifecycleTransition, 
    resolveLifecycleDomain,
    type ValidDomain 
} from './LifecycleGuard';
import { enforceLifecycleMutationPolicy } from './LifecyclePolicyGuard';
import logger from '../../utils/logger';
import { ActorMetadata, BusinessErrorCode } from '@esparex/contracts';
import { AppError } from '../../shared-kernel/errors/AppError';
import {
    isListingLifecycleDomain,
    canBypassInvalidTransition,
    createHistoryRecord,
    recordMutationMetric,
} from './StatusMutationTelemetry';
import { dispatchStatusMutationEvents } from './StatusMutationEvents';
import { createStatusMutationBulkHandler } from './statusMutationBulk';

// Import domain models
import Ad from '../../models/Ad';
import User from '../../models/User';
import Business from '../../models/Business';

export type { ValidDomain };

export interface MutationRequest {
    domain: ValidDomain;
    entityId: string | mongoose.Types.ObjectId;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    patch?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    session?: unknown;
}

interface IStatusable {
    status: string;
    statusChangedAt?: Date;
    statusReason?: string;
    moderationStatus?: string;
    listingType?: string;
    save: (options?: { session?: ClientSession }) => Promise<mongoose.Document>;
    toObject: () => Record<string, unknown>;
    [key: string]: unknown;
}

async function findEntityDoc(domain: ValidDomain, entityId: string | mongoose.Types.ObjectId, session?: unknown): Promise<(mongoose.Document & IStatusable) | null> {
    const s = (session || null) as ClientSession | null;
    switch (domain) {
        case 'ad':
        case 'service':
        case 'spare_part_listing':
            return Ad.findById(entityId).setOptions({ withDeleted: true }).session(s).exec() as Promise<(mongoose.Document & IStatusable) | null>;
        case 'user':
            return User.findById(entityId).setOptions({ withDeleted: true }).session(s).exec() as Promise<(mongoose.Document & IStatusable) | null>;
        case 'business':
            return Business.findById(entityId).setOptions({ withDeleted: true }).session(s).exec() as Promise<(mongoose.Document & IStatusable) | null>;
        case 'catalog_part':
            throw new Error('Domain \'catalog_part\' uses CatalogStatus — route through admin catalog service, not statusMutationService');
        default:
            throw new Error(`Unsupported domain: ${domain as string}`);
    }
}

/**
 * 🛠️ Centralized Status Mutation Service
 * Enforces transaction-safe lifecycle transitions across all domains.
 */
export const mutateStatus = async (request: MutationRequest): Promise<Record<string, unknown> | null> => {
    const { domain, entityId, toStatus, actor, reason, patch, metadata, session: externalSession } = request;
    const startTime = Date.now();

    let fromStatus = 'unknown';
    let resolvedListingType: string | undefined;

    try {
        let result: Record<string, unknown> | null = null;

        const executeOperations = async (activeSession: unknown) => {
            if (isListingLifecycleDomain(domain)) {
                return executeListingOperations(activeSession);
            }
            
            const doc = await findEntityDoc(domain, entityId, activeSession);
            if (!doc) {
                throw new AppError(`Entity ${String(entityId)} not found in domain ${domain}`, 404, BusinessErrorCode.RESOURCE_NOT_FOUND);
            }

            fromStatus = doc.status;
            const listingType = doc.listingType;
            resolvedListingType = listingType;

            const resolvedDomain = resolveLifecycleDomain(domain, listingType);
            try {
                validateLifecycleTransition(resolvedDomain, fromStatus, toStatus);
            } catch (error) {
                if (!canBypassInvalidTransition({ error, actor, toStatus, resolvedDomain, metadata })) {
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

            doc.status = toStatus;
            doc.statusChangedAt = new Date();
            if (reason) doc.statusReason = reason;

            const VALID_MODERATION_STATUSES = new Set([
                'auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden'
            ]);
            const currentModerationStatus = doc.moderationStatus;
            if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
                logger.warn('StatusMutationService: coercing stale moderationStatus', {
                    entityId: String(entityId),
                    domain,
                    staleValue: currentModerationStatus,
                    coercedTo: 'manual_approved',
                });
                doc.moderationStatus = 'manual_approved';
            }

            if (patch) {
                for (const [key, value] of Object.entries(patch)) {
                    if (key === '$push' && typeof value === 'object' && value !== null) {
                        for (const [pKey, pVal] of Object.entries(value as Record<string, unknown>)) {
                            const field = doc[pKey];
                            if (Array.isArray(field)) {
                                field.push(pVal);
                            }
                        }
                    } else {
                        doc[key] = value;
                    }
                }
            }
            
            await doc.save({ session: (activeSession || undefined) as ClientSession | undefined });

            await createHistoryRecord({ domain, entityId, fromStatus, toStatus, actor, reason, metadata, session: activeSession });

            return (typeof doc.toObject === 'function' ? doc.toObject() : doc) as Record<string, unknown>;
        };

        const executeListingOperations = async (activeSession: unknown) => {
            const { getListingRepository } = await import('../../composition/listings');
            const repo = getListingRepository();
            const listing = await repo.findOne({ ids: [entityId.toString()], isDeleted: { $in: [true, false] }, session: activeSession });
            
            if (!listing) {
                throw new AppError(`Entity ${String(entityId)} not found in domain ${domain}`, 404, BusinessErrorCode.RESOURCE_NOT_FOUND);
            }

            fromStatus = listing.status as string;
            resolvedListingType = listing.listingType as string;

            const resolvedDomain = resolveLifecycleDomain(domain, resolvedListingType);
            try {
                validateLifecycleTransition(resolvedDomain, fromStatus, toStatus);
            } catch (error) {
                if (!canBypassInvalidTransition({ error, actor, toStatus, resolvedDomain, metadata })) {
                    throw error;
                }
            }
            enforceLifecycleMutationPolicy({ domain: resolvedDomain, fromStatus, toStatus, actor, patch, metadata });

            const updateDoc: Record<string, unknown> = {
                status: toStatus,
                statusChangedAt: new Date(),
            };
            if (reason) updateDoc.statusReason = reason;

            const VALID_MODERATION_STATUSES = new Set(['auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden']);
            const currentModerationStatus = listing.moderationStatus;
            if (currentModerationStatus && !VALID_MODERATION_STATUSES.has(currentModerationStatus)) {
                updateDoc.moderationStatus = 'manual_approved';
            }

            if (patch) {
                for (const [key, value] of Object.entries(patch)) {
                    updateDoc[key] = value;
                }
            }

            const updated = await repo.updateOne(entityId.toString(), updateDoc as ListingUpdate, activeSession);

            await createHistoryRecord({ domain, entityId, fromStatus, toStatus, actor, reason, metadata, session: activeSession });

            return updated as Record<string, unknown>;
        };

        if (externalSession) {
            result = await executeOperations(externalSession);
        } else {
            const { getListingUnitOfWork } = await import('../../composition/listings');
            result = await getListingUnitOfWork().executeTransaction(async (session) => {
                return executeOperations(session);
            });
        }

        const duration = Date.now() - startTime;
        
        setImmediate(() => {
            recordMutationMetric('success', domain, fromStatus, toStatus, actor.type).catch(err => {
                logger.error('Telemetry Error (Success Path):', err);
            });
        });

        logger.info(`Status Mutation SUCCESS: ${domain} ${String(entityId)} (${fromStatus} -> ${toStatus})`, {
            durationMs: duration,
            actorType: actor.type,
            actorId: actor.id
        });
        
        await dispatchStatusMutationEvents({
            domain,
            entityId: entityId.toString(),
            fromStatus,
            toStatus,
            actor,
            reason,
            patch,
            metadata,
            resolvedListingType,
        });
        
        return result;
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const err = error as { message?: string; code?: string };
        
        const isValidationFailure = err.code === 'INVALID_LIFECYCLE_TRANSITION' || err.code === 'LIFECYCLE_LOCKED';
        const metricStatus = isValidationFailure ? 'rejection' : 'failure';
        
        setImmediate(() => {
            recordMutationMetric(metricStatus as 'success' | 'rejection' | 'failure', domain, fromStatus, toStatus, actor.type).catch(err => {
                logger.error('Telemetry Error (Error Path):', err);
            });
        });
        
        logger.error(`Status Mutation FAILED: ${domain} ${String(entityId)} -> ${toStatus}`, {
            error: err.message,
            code: err.code,
            durationMs: duration,
            actorType: actor.type
        });
        
        throw error;
    }
};

const bulkHandler = createStatusMutationBulkHandler(mutateStatus);

export const mutateStatuses = bulkHandler.mutateStatuses;
export const mutateStatusesBulk = bulkHandler.mutateStatusesBulk;
