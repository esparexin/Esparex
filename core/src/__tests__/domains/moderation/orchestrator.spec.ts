import { ImageModerationOrchestrator } from '../../../domains/moderation/orchestration/ImageModerationOrchestrator';
import { ProviderFailoverManager } from '../../../services/ai/moderation/ProviderFailoverManager';
import { GoogleVisionProvider } from '../../../services/ai/moderation/providers/GoogleVisionProvider';
import { MODERATION_OUTCOME, RISK_LEVEL } from '@esparex/contracts';

describe('Image Moderation Orchestrator (PR 5)', () => {
    it('runs end-to-end orchestration returning APPROVED for safe image', async () => {
        const provider = new GoogleVisionProvider();
        const failover = new ProviderFailoverManager(provider);
        const orchestrator = new ImageModerationOrchestrator(failover);

        const result = await orchestrator.moderateImage({
            imageId: 'img-999',
            entityId: 'ad-888',
            entityType: 'ad',
            imageUrl: 'https://example.com/phone.jpg',
            title: 'iPhone 13',
            category: 'Smartphones',
        });

        expect(result.outcome).toBe(MODERATION_OUTCOME.APPROVED);
        expect(result.riskLevel).toBe(RISK_LEVEL.LOW);
    });
});
