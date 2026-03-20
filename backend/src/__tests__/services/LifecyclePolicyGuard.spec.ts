import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import { enforceLifecycleMutationPolicy } from '../../services/LifecyclePolicyGuard';

describe('LifecyclePolicyGuard repost invariants', () => {
    it('rejects repost transition expired -> live', () => {
        expect(() =>
            enforceLifecycleMutationPolicy({
                domain: 'ad',
                fromStatus: AD_STATUS.EXPIRED,
                toStatus: AD_STATUS.LIVE,
                actor: { type: ACTOR_TYPE.USER, id: 'u1' },
                metadata: { action: 'repost' },
            })
        ).toThrow('Repost from expired must transition to pending first.');
    });

    it('allows repost transition expired -> pending', () => {
        expect(() =>
            enforceLifecycleMutationPolicy({
                domain: 'ad',
                fromStatus: AD_STATUS.EXPIRED,
                toStatus: AD_STATUS.PENDING,
                actor: { type: ACTOR_TYPE.USER, id: 'u1' },
                metadata: { action: 'repost' },
            })
        ).not.toThrow();
    });
});

