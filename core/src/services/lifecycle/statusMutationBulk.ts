import mongoose from 'mongoose';
import { LISTING_STATUS } from '@esparex/contracts';
import { pLimit } from '../../utils/pLimit';
import { lifecycleEvents } from '../../events';
import type { ValidDomain, MutationRequest } from './StatusMutationService';

const MUTATE_STATUSES_CONCURRENCY = 5;

type StatusFindableModel = {
    find: (filter: Record<string, unknown>) => {
        select: (fields: string) => {
            lean: <T>() => Promise<T>;
        };
    };
};

export const createStatusMutationBulkHandler = (
    mutateStatus: (request: MutationRequest) => Promise<Record<string, unknown> | null>,
    getModelForDomain: (domain: ValidDomain) => StatusFindableModel
) => {
    const mutateStatuses = async (requests: MutationRequest[]): Promise<(Record<string, unknown> | null)[]> => {
        const limit = pLimit(MUTATE_STATUSES_CONCURRENCY);
        return Promise.all(requests.map(request => limit(() => mutateStatus(request))));
    };

    const mutateStatusesBulk = async (
        domain: ValidDomain,
        entityIds: string[],
        toStatus: string,
        actor: MutationRequest['actor'],
        reason?: string
    ): Promise<number> => {
        if (!entityIds.length) return 0;
        
        const Model = getModelForDomain(domain);
        type BulkMutationDoc = { _id: mongoose.Types.ObjectId; listingType?: string };
        const docs = await Model.find({ _id: { $in: entityIds } })
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

    return { mutateStatuses, mutateStatusesBulk };
};
