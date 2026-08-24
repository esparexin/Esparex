import mongoose from 'mongoose';
import { LISTING_STATUS, type ActorMetadata } from '@esparex/contracts';
import { pLimit } from '../../utils/pLimit';
import { lifecycleEvents } from '../../events';
import type { ValidDomain } from './LifecycleGuard';
import Ad from '../../models/Ad';
import User from '../../models/User';
import Business from '../../models/Business';

const MUTATE_STATUSES_CONCURRENCY = 5;

export interface BulkMutationRequest {
    domain: ValidDomain;
    entityId: string | mongoose.Types.ObjectId;
    toStatus: string;
    actor: ActorMetadata;
    reason?: string;
    patch?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    session?: unknown;
}

type BulkMutationDoc = { _id: mongoose.Types.ObjectId; listingType?: string };

async function findBulkEntityDocs(domain: ValidDomain, entityIds: string[]): Promise<BulkMutationDoc[]> {
    switch (domain) {
        case 'ad':
        case 'service':
        case 'spare_part_listing':
            return Ad.find({ _id: { $in: entityIds } }).select('_id status listingType').lean<BulkMutationDoc[]>();
        case 'user':
            return User.find({ _id: { $in: entityIds } }).select('_id status').lean<BulkMutationDoc[]>();
        case 'business':
            return Business.find({ _id: { $in: entityIds } }).select('_id status').lean<BulkMutationDoc[]>();
        default:
            return [];
    }
}

export const createStatusMutationBulkHandler = (
    mutateStatus: (request: BulkMutationRequest) => Promise<Record<string, unknown> | null>
) => {
    const mutateStatuses = async (requests: BulkMutationRequest[]): Promise<(Record<string, unknown> | null)[]> => {
        const limit = pLimit(MUTATE_STATUSES_CONCURRENCY);
        return Promise.all(requests.map(request => limit(() => mutateStatus(request))));
    };

    const mutateStatusesBulk = async (
        domain: ValidDomain,
        entityIds: string[],
        toStatus: string,
        actor: BulkMutationRequest['actor'],
        reason?: string
    ): Promise<number> => {
        if (!entityIds.length) return 0;
        
        const docs = await findBulkEntityDocs(domain, entityIds);
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

    return { mutateStatuses, mutateStatusesBulk };
};
