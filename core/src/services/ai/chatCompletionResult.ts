import { AIResult } from './types';

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
export function extractChatCompletionText(data: unknown): string {
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
