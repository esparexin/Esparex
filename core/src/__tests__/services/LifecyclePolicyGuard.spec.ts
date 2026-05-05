import { LISTING_STATUS } from "../../constants/enums/listingStatus";
import { ACTOR_TYPE } from "@esparex/shared";
import { enforceLifecycleMutationPolicy } from '../../services/LifecyclePolicyGuard';

describe('LifecyclePolicyGuard repost invariants', () => {
    it('rejects repost transition expired -> live', () => {
        expect(() =>
            enforceLifecycleMutationPolicy({
                domain: 'ad',
                fromStatus: LISTING_STATUS.EXPIRED,
                toStatus: LISTING_STATUS.LIVE,
                actor: { type: ACTOR_TYPE.USER, id: 'u1' },
                metadata: { action: 'repost' },
            })
        ).toThrow('Repost from expired must transition to pending first.');
    });

    it('allows repost transition expired -> pending', () => {
        expect(() =>
            enforceLifecycleMutationPolicy({
                domain: 'ad',
                fromStatus: LISTING_STATUS.EXPIRED,
                toStatus: LISTING_STATUS.PENDING,
                actor: { type: ACTOR_TYPE.USER, id: 'u1' },
                metadata: { action: 'repost' },
            })
        ).not.toThrow();
    });
});

