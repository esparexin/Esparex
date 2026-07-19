export interface AIResult {
    provider: string;
    model: string;
    text: string;
    finishReason?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latency: number;
    cached: boolean;
}

export interface AIProviderError extends Error {
    code: 'Authentication' | 'RateLimit' | 'Timeout' | 'Validation' | 'ServiceUnavailable' | 'Unknown';
    provider: string;
    status?: number;
    details?: unknown;
}

export interface AIStreamChunk {
    text: string;
}

export interface HealthCheckResult {
    healthy: boolean;
    provider: string;
    model: string;
    latency: number;
    error?: string;
}

export interface GenerateTextOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    timeoutMs?: number;
}
