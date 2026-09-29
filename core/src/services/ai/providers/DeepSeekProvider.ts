import { z } from 'zod';
import { AIProvider } from '../AIProvider';
import { AIResult, AIStreamChunk, GenerateTextOptions, HealthCheckResult, AIProviderError, StructuredAIResult } from '../types';
import { buildStructuredResult } from '../structuredJson';
import { buildOpenAICompatibleResult } from '../chatCompletionResult';
import { getAiConfig } from '../../../config/ai';
import { withTimeout } from '../../../utils/resilience';

export class DeepSeekProviderError extends Error implements AIProviderError {
    code: 'Authentication' | 'RateLimit' | 'Timeout' | 'Validation' | 'ServiceUnavailable' | 'Unknown';
    provider = 'deepseek';
    status?: number;
    details?: unknown;

    constructor(message: string, code: AIProviderError['code'], status?: number, details?: unknown) {
        super(message);
        this.name = 'DeepSeekProviderError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export class DeepSeekProvider implements AIProvider {
    private apiKeyPromise: Promise<string>;

    constructor() {
        this.apiKeyPromise = getAiConfig().then((c) => c.deepseekApiKey || '');
    }

    private mapError(error: unknown): DeepSeekProviderError {
        if (error instanceof Error) {
            if (error.message.includes('Timeout')) return new DeepSeekProviderError('DeepSeek request timed out', 'Timeout');
            if (error.message.includes('401')) return new DeepSeekProviderError('DeepSeek authentication failed', 'Authentication', 401);
            if (error.message.includes('429')) return new DeepSeekProviderError('DeepSeek rate limit hit', 'RateLimit', 429);
        }
        return new DeepSeekProviderError(error instanceof Error ? error.message : 'Unknown DeepSeek error', 'Unknown');
    }

    async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResult> {
        const startTime = Date.now();
        try {
            const apiKey = await this.apiKeyPromise;
            if (!apiKey) {
                throw new DeepSeekProviderError('DeepSeek API key is missing', 'Authentication', 401);
            }
            const config = await getAiConfig();
            const model = 'deepseek-chat';

            const response = await withTimeout(
                fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        temperature: options?.temperature ?? config.temperature,
                        max_tokens: options?.maxTokens ?? config.maxOutputTokens,
                        messages: [{ role: 'user', content: prompt }],
                    }),
                }),
                options?.timeoutMs ?? config.timeoutMs,
                'DeepSeek generateText'
            );

            if (!response.ok) {
                const status = response.status;
                if (status === 401) throw new DeepSeekProviderError('Invalid DeepSeek API key', 'Authentication', 401);
                if (status === 429) throw new DeepSeekProviderError('DeepSeek rate limit hit', 'RateLimit', 429);
                throw new DeepSeekProviderError(`DeepSeek returned HTTP ${status}`, 'ServiceUnavailable', status);
            }

            const data: unknown = await response.json();

            return buildOpenAICompatibleResult({ data, provider: 'deepseek', model, startTime });
        } catch (error) {
            throw this.mapError(error);
        }
    }

    async generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, options?: GenerateTextOptions): Promise<StructuredAIResult<T>> {
        const res = await this.generateText(`${prompt}\n\nRespond strictly in valid JSON format.`, options);
        return buildStructuredResult(res, schema, () => new DeepSeekProviderError('Failed to parse DeepSeek JSON output', 'Validation'));
    }

    async *streamText(prompt: string, options?: GenerateTextOptions): AsyncIterable<AIStreamChunk> {
        const res = await this.generateText(prompt, options);
        yield { text: res.text };
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now();
        try {
            await this.generateText('ping', { maxTokens: 5, timeoutMs: 5000 });
            return { healthy: true, provider: 'deepseek', model: 'deepseek-chat', latency: Date.now() - startTime };
        } catch (error) {
            return {
                healthy: false,
                provider: 'deepseek',
                model: 'deepseek-chat',
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
