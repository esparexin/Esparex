import mongoose from 'mongoose';
import { pLimit } from '../../utils/pLimit';
import { type ValidDomain } from './LifecycleGuard';
import logger from '../../utils/logger';
import { ActorMetadata, LISTING_STATUS } from '@esparex/contracts';
import { lifecycleEvents } from '../../events';
import {
    isListingLifecycleDomain,
    recordMutationMetric,
} from './StatusMutationTelemetry';
import { dispatchStatusMutationEvents } from './StatusMutationEvents';
import {
    getModelForDomain,
    executeGenericStatusMutation,
    executeListingStatusMutation,
} from './StatusMutationExecutor';

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

        const executeOperations = async (activeSession: any) => {
            const executor = isListingLifecycleDomain(domain)
                ? executeListingStatusMutation
                : executeGenericStatusMutation;

            const res = await executor({
                domain,
                entityId,
                toStatus,
                actor,
                reason,
                patch,
                metadata,
                activeSession,
            });

            fromStatus = res.fromStatus;
            resolvedListingType = res.resolvedListingType;
            return res.result;
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

const MUTATE_STATUSES_CONCURRENCY = 5;

export const mutateStatuses = async (requests: MutationRequest[]): Promise<(Record<string, unknown> | null)[]> => {
    const limit = pLimit(MUTATE_STATUSES_CONCURRENCY);
    return Promise.all(requests.map(request => limit(() => mutateStatus(request))));
};

export const mutateStatusesBulk = async (
    domain: ValidDomain,
    entityIds: string[],
    toStatus: string,
    actor: MutationRequest['actor'],
    reason?: string
): Promise<number> => {
    if (!entityIds.length) return 0;
    
    const Model = getModelForDomain(domain);
    type BulkMutationDoc = { _id: mongoose.Types.ObjectId; listingType?: string };
    const docs = await (Model as mongoose.Model<any>).find({ _id: { $in: entityIds } })
        .select('_id status listingType')
        .lean<BulkMutationDoc[]>();
    if (!docs.length) return 0;

    await mutateStatuses(
        docs.map((doc) => ({
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

    if (domain === 'ad' && toStatus === LISTING_STATUS.EXPIRED) {
        await lifecycleEvents.dispatch('ad.expired.bulk', { count: docs.length, source: 'cron_expireOutdatedAds' });
    }

    return docs.length;
};
