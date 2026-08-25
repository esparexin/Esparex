import { lifecycleEvents } from '../../events';
import logger from '../../utils/logger';
import type { ActorMetadata } from '@esparex/contracts';

interface DispatchLifecycleEventsParams {
    domain: string;
    entityId: string;
    fromStatus: string;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    patch?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    resolvedListingType?: string;
}

export async function dispatchStatusMutationEvents({
    domain,
    entityId,
    fromStatus,
    toStatus,
    actor,
    reason,
    patch,
    metadata,
    resolvedListingType,
}: DispatchLifecycleEventsParams): Promise<void> {
    if (domain !== 'ad') {
        return;
    }

    import('@esparex/core/composition/listings')
        .then(({ getListingsCache }) => {
            const listingsCache = getListingsCache();
            return Promise.all([
                listingsCache.invalidatePublicAdCache(entityId),
                listingsCache.invalidateAdFeedCaches(),
            ]);
        })
        .catch((cacheErr) => {
            logger.error('Failed to bust cache during status mutation', { adId: entityId, cacheErr });
        });

    await lifecycleEvents.dispatch('ad.lifecycle.changed', {
        adId: entityId,
        fromStatus,
        toStatus,
        actorType: actor.type,
        actorId: actor.id,
        source: actor.type,
        reason,
    });

    if (
        toStatus === 'rejected' &&
        String(metadata?.action || '').trim().toLowerCase() === 'moderation_reject'
    ) {
        await lifecycleEvents.dispatch('listing.rejected', {
            listingId: entityId,
            listingType: resolvedListingType || 'ad',
            rejectionReason:
                typeof patch?.rejectionReason === 'string'
                    ? String(patch.rejectionReason)
                    : undefined,
            actorType: actor.type,
            actorId: actor.id,
        });
    }

    if (
        toStatus === 'live' &&
        String(metadata?.action || '').trim().toLowerCase() === 'moderation_approve'
    ) {
        const listingType =
            typeof metadata?.listingType === 'string'
                ? String(metadata.listingType)
                : typeof patch?.listingType === 'string'
                ? String(patch.listingType)
                : undefined;

        await lifecycleEvents.dispatch('listing.approved', {
            listingId: entityId,
            listingType: listingType || 'ad',
            approvedAt:
                patch?.approvedAt instanceof Date
                    ? patch.approvedAt.toISOString()
                    : new Date().toISOString(),
            actorType: actor.type,
            actorId: actor.id,
            source: String(metadata?.sourceRoute || metadata?.action || actor.type),
        });
    }
}
