import { ModerationMetricsCollector } from '../../../domains/moderation/diagnostics/ModerationMetricsCollector';
import { ModerationFeatureFlags } from '../../../domains/moderation/diagnostics/ModerationFeatureFlags';

describe('Moderation Diagnostics & Metrics (PR 7 — Final Epic Verification)', () => {
    describe('ModerationMetricsCollector', () => {
        let collector: ModerationMetricsCollector;

        beforeEach(() => {
            collector = new ModerationMetricsCollector();
        });

        it('initializes with all zero counters', () => {
            const snapshot = collector.getSnapshot();
            expect(snapshot.totalRequests).toBe(0);
            expect(snapshot.stage1EarlyExits).toBe(0);
            expect(snapshot.stage2VisionCalls).toBe(0);
            expect(snapshot.stage3OcrCalls).toBe(0);
            expect(snapshot.actions).toEqual({ approved: 0, flagged: 0, rejected: 0 });
            expect(snapshot.failoversCount).toBe(0);
            expect(snapshot.averageLatencyMs).toBe(0);
        });

        it('correctly records request and action metrics with latency', () => {
            collector.recordRequest();
            collector.recordStage1EarlyExit();
            collector.recordAction('REJECT', 5);

            collector.recordRequest();
            collector.recordStage2VisionCall();
            collector.recordStage3OcrCall();
            collector.recordAction('APPROVE', 45);

            const snapshot = collector.getSnapshot();
            expect(snapshot.totalRequests).toBe(2);
            expect(snapshot.stage1EarlyExits).toBe(1);
            expect(snapshot.stage2VisionCalls).toBe(1);
            expect(snapshot.stage3OcrCalls).toBe(1);
            expect(snapshot.actions).toEqual({ approved: 1, flagged: 0, rejected: 1 });
            expect(snapshot.averageLatencyMs).toBe(25); // (5 + 45) / 2
        });

        it('correctly records failover events', () => {
            collector.recordFailover();
            collector.recordFailover();

            const snapshot = collector.getSnapshot();
            expect(snapshot.failoversCount).toBe(2);
        });

        it('resets counters back to zero', () => {
            collector.recordRequest();
            collector.recordAction('APPROVE', 10);
            collector.reset();

            const snapshot = collector.getSnapshot();
            expect(snapshot.totalRequests).toBe(0);
            expect(snapshot.actions.approved).toBe(0);
        });
    });

    describe('ModerationFeatureFlags', () => {
        it('defaults all moderation flags to enabled true', () => {
            const flags = new ModerationFeatureFlags();
            expect(flags.isModerationEnabled()).toBe(true);
            expect(flags.isStage1Enabled()).toBe(true);
            expect(flags.isStage2Enabled()).toBe(true);
            expect(flags.isStage3OcrEnabled()).toBe(true);
        });

        it('disables all sub-stages when master enabled flag is false', () => {
            const flags = new ModerationFeatureFlags({ enabled: false });
            expect(flags.isModerationEnabled()).toBe(false);
            expect(flags.isStage1Enabled()).toBe(false);
            expect(flags.isStage2Enabled()).toBe(false);
            expect(flags.isStage3OcrEnabled()).toBe(false);
        });

        it('allows dynamic flag updates at runtime', () => {
            const flags = new ModerationFeatureFlags();
            flags.updateFlags({ stage3OcrEnabled: false });

            expect(flags.isModerationEnabled()).toBe(true);
            expect(flags.isStage1Enabled()).toBe(true);
            expect(flags.isStage3OcrEnabled()).toBe(false);
        });
    });
});
