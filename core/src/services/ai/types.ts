import { z } from 'zod';

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

export interface StructuredAIResult<T> {
    data: T;
    provider: string;
    model: string;
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

/**
 * Shared JSON fence-extraction for provider `generateStructured` implementations.
 * Extracts the first `{...}` block from model text, parses it against `schema`,
 * and re-packages the provider result. Any parse failure is converted via
 * `makeValidationError` so each provider keeps its own error class/message.
 */
export function buildStructuredResult<T>(
    res: AIResult,
    schema: z.ZodSchema<T>,
    makeValidationError: () => Error
): StructuredAIResult<T> {
    try {
        const start = res.text.indexOf('{');
        const end = res.text.lastIndexOf('}');
        const jsonText = start !== -1 && end !== -1 ? res.text.slice(start, end + 1) : res.text;
        return {
            data: schema.parse(JSON.parse(jsonText)),
            provider: res.provider,
            model: res.model,
            usage: res.usage,
            latency: res.latency,
            cached: res.cached,
        };
    } catch {
        throw makeValidationError();
    }
}

const toTokenCount = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

const readUsage = (data: unknown): {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
} | null => {
    if (!data || typeof data !== 'object') return null;
    const usage = (data as { usage?: unknown }).usage;
    if (!usage || typeof usage !== 'object') return null;
    return usage as {
        prompt_tokens?: unknown;
        completion_tokens?: unknown;
        total_tokens?: unknown;
    };
};

/**
 * Extracts the assistant message text from an OpenAI-compatible
 * chat-completion payload. Returns '' when the shape is unexpected.
 */
function extractChatCompletionText(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) return '';
    const first = choices[0];
    if (!first || typeof first !== 'object') return '';
    const message = (first as { message?: unknown }).message;
    if (!message || typeof message !== 'object') return '';
    const content = (message as { content?: unknown }).content;
    return typeof content === 'string' ? content : '';
}

/**
 * Maps an OpenAI-compatible chat-completion response into AIResult.
 * Shared by OpenAI + DeepSeek providers (identical usage envelope).
 */
export function buildOpenAICompatibleResult(args: {
    data: unknown;
    provider: string;
    model: string;
    startTime: number;
}): AIResult {
    const { data, provider, model, startTime } = args;
    const usage = readUsage(data);
    return {
        provider,
        model,
        text: extractChatCompletionText(data),
        usage: usage
            ? {
                promptTokens: toTokenCount(usage.prompt_tokens),
                completionTokens: toTokenCount(usage.completion_tokens),
                totalTokens: toTokenCount(usage.total_tokens),
            }
            : undefined,
        latency: Date.now() - startTime,
        cached: false,
    };
}