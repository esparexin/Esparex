/**
 * Moderation Metrics Collector (PR 7 — Observability & Telemetry)
 *
 * Collects request counters, stage usage metrics, action outcomes, failover events,
 * and processing latency for real-time admin monitoring.
 */

export interface ModerationMetricsSnapshot {
    totalRequests: number;
    stage1EarlyExits: number;
    stage2VisionCalls: number;
    stage3OcrCalls: number;
    actions: {
        approved: number;
        flagged: number;
        rejected: number;
    };
    failoversCount: number;
    averageLatencyMs: number;
}

export class ModerationMetricsCollector {
    private totalRequests = 0;
    private stage1EarlyExits = 0;
    private stage2VisionCalls = 0;
    private stage3OcrCalls = 0;
    private approvedCount = 0;
    private flaggedCount = 0;
    private rejectedCount = 0;
    private failoversCount = 0;
    private totalLatencyMs = 0;

    /**
     * Increments incoming moderation request count.
     */
    recordRequest(): void {
        this.totalRequests += 1;
    }

    /**
     * Records Stage 1 Early Exit ($0 cost).
     */
    recordStage1EarlyExit(): void {
        this.stage1EarlyExits += 1;
    }

    /**
     * Records Stage 2 AI Vision call execution.
     */
    recordStage2VisionCall(): void {
        this.stage2VisionCalls += 1;
    }

    /**
     * Records Stage 3 Intelligence / OCR call execution.
     */
    recordStage3OcrCall(): void {
        this.stage3OcrCalls += 1;
    }

    /**
     * Records final decision outcome and processing latency.
     */
    recordAction(action: 'APPROVE' | 'FLAG' | 'REJECT', latencyMs: number): void {
        this.totalLatencyMs += latencyMs;
        if (action === 'APPROVE') this.approvedCount += 1;
        else if (action === 'FLAG') this.flaggedCount += 1;
        else if (action === 'REJECT') this.rejectedCount += 1;
    }

    /**
     * Records provider failover event.
     */
    recordFailover(): void {
        this.failoversCount += 1;
    }

    /**
     * Returns real-time metrics telemetry snapshot.
     */
    getSnapshot(): ModerationMetricsSnapshot {
        const processedCount = this.approvedCount + this.flaggedCount + this.rejectedCount;
        return {
            totalRequests: this.totalRequests,
            stage1EarlyExits: this.stage1EarlyExits,
            stage2VisionCalls: this.stage2VisionCalls,
            stage3OcrCalls: this.stage3OcrCalls,
            actions: {
                approved: this.approvedCount,
                flagged: this.flaggedCount,
                rejected: this.rejectedCount,
            },
            failoversCount: this.failoversCount,
            averageLatencyMs: processedCount > 0 ? Math.round(this.totalLatencyMs / processedCount) : 0,
        };
    }

    /**
     * Resets all metric counters to zero.
     */
    reset(): void {
        this.totalRequests = 0;
        this.stage1EarlyExits = 0;
        this.stage2VisionCalls = 0;
        this.stage3OcrCalls = 0;
        this.approvedCount = 0;
        this.flaggedCount = 0;
        this.rejectedCount = 0;
        this.failoversCount = 0;
        this.totalLatencyMs = 0;
    }
}
