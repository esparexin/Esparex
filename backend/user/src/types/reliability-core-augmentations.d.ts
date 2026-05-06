declare module '@esparex/core/utils/reliabilityContext' {
    export const setReliabilityContext: (partial: Partial<{
        traceId: string;
        userId: string;
        requestPath: string;
        method: string;
        jobId: string;
        jobName: string;
        queueName: string;
    }>) => void;
}

declare module '@esparex/core/utils/sloMonitor' {
    export const recordApiRequestSample: (durationMs: number, statusCode: number) => void;
}

declare module '@esparex/core/utils/securityMonitoring' {
    export const recordApiUsageSignal: (input: {
        method: string;
        route: string;
        ip: string;
        userId?: string;
    }) => void;
    export const recordRepeatedFailureSignal: (input: {
        path: string;
        ip: string;
        statusCode: number;
        userId?: string;
    }) => void;
    export const recordRateLimitSignal: (input: {
        path: string;
        ip: string;
        bucket: string;
        code?: string;
        userId?: string;
    }) => void;
    export const recordOtpAbuseSignal: (input: {
        mobileSuffix: string;
        reason: 'invalid_otp' | 'locked' | 'rate_limited';
        userId?: string;
    }) => void;
}

declare module '@esparex/core/utils/systemMetricsSummary' {
    export type SystemMetricsSummary = {
        timestamp: string;
        api: {
            status: 'ok' | 'degraded' | 'error';
            success: boolean;
            [key: string]: unknown;
        };
        queue: Record<string, unknown>;
        worker: Record<string, unknown>;
        dependency: Record<string, unknown>;
        failureRates: Record<string, unknown>;
        security: Record<string, unknown>;
        circuitBreakers: Array<Record<string, unknown>>;
    };
    export const getSystemMetricsSummary: () => Promise<SystemMetricsSummary>;
}

declare module '@esparex/core/utils/startupValidator' {
    export const validateMetadataHealth: () => Promise<void>;
    export const assertCriticalStartupReadiness: () => Promise<void>;
}

declare module '@esparex/core/utils/resilience' {
    export const resetAllOpenCircuitBreakers: (reason?: string) => number;
}
