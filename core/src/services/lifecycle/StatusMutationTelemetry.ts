import mongoose from 'mongoose';
import StatusHistory from '../../models/StatusHistory';
import AdminMetrics from '../../models/AdminMetrics';
import logger from '../../utils/logger';
import { ActorMetadata, ACTOR_TYPE, LISTING_STATUS } from '@esparex/contracts';
import type { ValidDomain } from './LifecycleGuard';

export const toLower = (value: unknown): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';

export const isListingLifecycleDomain = (domain: ValidDomain): boolean =>
    domain === 'ad' || domain === 'service' || domain === 'spare_part_listing';

export const isModerationDeactivationAction = (metadata?: Record<string, unknown>): boolean => {
    const action = toLower(metadata?.action);
    return action === 'moderation_deactivate' || action === 'moderation_soft_delete';
};

export const canBypassInvalidTransition = (params: {
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
    if (toLower(params.toStatus) !== LISTING_STATUS.DEACTIVATED) return false;
    return isModerationDeactivationAction(params.metadata);
};

export const createHistoryRecord = async (params: {
    domain: ValidDomain;
    entityId: string | mongoose.Types.ObjectId;
    fromStatus: string;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    metadata?: Record<string, unknown>;
    session?: unknown;
}) => {
    const { domain, entityId, fromStatus, toStatus, actor, reason, metadata, session } = params;
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
    }], { session: (session || undefined) as mongoose.ClientSession | undefined });
};

export async function recordMutationMetric(
    status: 'success' | 'rejection' | 'failure',
    domain: string,
    from: string,
    to: string,
    actorType: string
) {
    try {
        if (status === 'success') {
            const { listingStatusTransitionsTotal } = await import('../../utils/metrics');
            listingStatusTransitionsTotal.inc({
                fromStatus: from,
                toStatus: to,
                actorType: actorType,
                listingType: domain,
            });
        }

        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const update: Record<string, unknown> = {
            $inc: {
                [`payload.total`]: 1,
                [`payload.${status}`]: 1,
                [`payload.domains.${domain}`]: 1,
                [`payload.transitions.${from}_to_${to}`]: 1
            }
        };

        await AdminMetrics.findOneAndUpdate(
            { metricModule: 'status_mutations', aggregationDate: date },
            update,
            { upsert: true }
        );
    } catch (err) {
        logger.error('Critical Telemetry Failure:', { error: String(err) });
    }
}
