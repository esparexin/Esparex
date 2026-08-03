import { ModerationFeatureFlags } from '../../../domains/moderation/config/ModerationFeatureFlags';
import { ModerationMetricsService } from '../../../domains/moderation/monitoring/ModerationMetricsService';
import { EarlyExitCostControlPipeline } from '../../../domains/moderation/pipeline/EarlyExitCostControlPipeline';

describe('Monitoring, Feature Flags & Cost Controls (PR 7)', () => {
    it('evaluates feature flags correctly', () => {
        const flags = new ModerationFeatureFlags();
        expect(flags.isEnabled('IMAGE_MODERATION')).toBe(true);

        flags.setFlag('IMAGE_MODERATION', false);
        expect(flags.isEnabled('IMAGE_MODERATION')).toBe(false);
    });

    it('tracks early exit cost savings and latency metrics', () => {
        const metrics = new ModerationMetricsService();
        metrics.recordEarlyExit();
        metrics.recordModeration('GoogleVisionProvider', 45, 'approved');

        const summary = metrics.getSummary();
        expect(summary.earlyExitsSaved).toBe(1);
        expect(summary.totalModerated).toBe(1);
        expect(summary.decisionsCount['approved']).toBe(1);
    });

    it('early exit pipeline prevents duplicate images from calling paid AI vision providers', () => {
        const metrics = new ModerationMetricsService();
        const pipeline = new EarlyExitCostControlPipeline(metrics);
        const buf = Buffer.from('sample-image-buffer-data-12345');

        const firstCheck = pipeline.checkBeforeProvider(buf);
        expect(firstCheck.shouldCallProvider).toBe(true);

        const duplicateCheck = pipeline.checkBeforeProvider(buf);
        expect(duplicateCheck.shouldCallProvider).toBe(false);
        expect(duplicateCheck.reason).toBe('DUPLICATE_IMAGE_HASH');
        expect(metrics.getSummary().earlyExitsSaved).toBe(1);
    });
});
