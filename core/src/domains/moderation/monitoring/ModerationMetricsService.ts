/**
 * Moderation Metrics & Telemetry Service (PR 7)
 *
 * Tracks provider latency, API cost savings from early exits, decision accuracy,
 * and queue retries.
 */
export interface MetricSummary {
    totalModerated: number;
    earlyExitsSaved: number;
    providerLatencies: Record<string, number[]>;
    decisionsCount: Record<string, number>;
}

export class ModerationMetricsService {
    private totalModerated = 0;
    private earlyExitsSaved = 0;
    private providerLatencies: Record<string, number[]> = {};
    private decisionsCount: Record<string, number> = {};

    recordEarlyExit(): void {
        this.earlyExitsSaved++;
    }

    recordModeration(provider: string, latencyMs: number, outcome: string): void {
        this.totalModerated++;
        if (!this.providerLatencies[provider]) {
            this.providerLatencies[provider] = [];
        }
        this.providerLatencies[provider].push(latencyMs);

        this.decisionsCount[outcome] = (this.decisionsCount[outcome] || 0) + 1;
    }

    getSummary(): MetricSummary {
        return {
            totalModerated: this.totalModerated,
            earlyExitsSaved: this.earlyExitsSaved,
            providerLatencies: this.providerLatencies,
            decisionsCount: this.decisionsCount,
        };
    }
}
