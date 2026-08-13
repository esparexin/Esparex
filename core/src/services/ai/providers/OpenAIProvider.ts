import { z } from 'zod';
import { AIProvider } from '../AIProvider';
import { AIResult, AIStreamChunk, GenerateTextOptions, HealthCheckResult, AIProviderError, StructuredAIResult } from '../types';
import { getAiConfig } from '../../../config/ai';
import { withTimeout } from '../../../utils/resilience';

export class OpenAIProviderError extends Error implements AIProviderError {
    code: 'Authentication' | 'RateLimit' | 'Timeout' | 'Validation' | 'ServiceUnavailable' | 'Unknown';
    provider = 'openai';
    status?: number;
    details?: unknown;

    constructor(message: string, code: AIProviderError['code'], status?: number, details?: unknown) {
        super(message);
        this.name = 'OpenAIProviderError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export class OpenAIProvider implements AIProvider {
    private apiKeyPromise: Promise<string>;

    constructor() {
        this.apiKeyPromise = getAiConfig().then((c) => c.openAiApiKey);
    }

    private mapError(error: unknown): OpenAIProviderError {
        if (error instanceof Error) {
            if (error.message.includes('Timeout')) {
                return new OpenAIProviderError('OpenAI request timed out', 'Timeout');
            }
            if (error.message.includes('401') || error.message.includes('403')) {
                return new OpenAIProviderError('OpenAI authentication failed', 'Authentication', 401);
            }
            if (error.message.includes('429')) {
                return new OpenAIProviderError('OpenAI rate limit exceeded', 'RateLimit', 429);
            }
        }
        return new OpenAIProviderError(error instanceof Error ? error.message : 'Unknown OpenAI error', 'Unknown');
    }

    async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResult> {
        const startTime = Date.now();
        try {
            const apiKey = await this.apiKeyPromise;
            if (!apiKey) {
                throw new OpenAIProviderError('OpenAI API key is missing', 'Authentication', 401);
            }
            const config = await getAiConfig();
            const model = 'gpt-4o-mini';

            const response = await withTimeout(
                fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: options?.temperature ?? config.temperature,
                        max_tokens: options?.maxTokens ?? config.maxOutputTokens,
                    }),
                }),
                options?.timeoutMs ?? config.timeoutMs,
                'OpenAI generateText'
            );

            if (!response.ok) {
                const status = response.status;
                if (status === 401) throw new OpenAIProviderError('Invalid OpenAI API key', 'Authentication', 401);
                if (status === 429) throw new OpenAIProviderError('OpenAI rate limit hit', 'RateLimit', 429);
                throw new OpenAIProviderError(`OpenAI returned HTTP ${status}`, 'ServiceUnavailable', status);
            }

            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content || '';

            return {
                provider: 'openai',
                model,
                text,
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens ?? 0,
                    completionTokens: data.usage.completion_tokens ?? 0,
                    totalTokens: data.usage.total_tokens ?? 0,
                } : undefined,
                latency: Date.now() - startTime,
                cached: false,
            };
        } catch (error) {
            throw this.mapError(error);
        }
    }

    async generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, options?: GenerateTextOptions): Promise<StructuredAIResult<T>> {
        const res = await this.generateText(`${prompt}\n\nReturn strict JSON matching the schema.`, options);
        try {
            const start = res.text.indexOf('{');
            const end = res.text.lastIndexOf('}');
            const jsonText = start !== -1 && end !== -1 ? res.text.slice(start, end + 1) : res.text;
            const parsedData = schema.parse(JSON.parse(jsonText));
            return {
                data: parsedData,
                provider: 'openai',
                model: res.model,
                usage: res.usage,
                latency: res.latency,
                cached: res.cached,
            };
        } catch (err) {
            throw new OpenAIProviderError('Failed to parse OpenAI JSON output', 'Validation');
        }
    }

    async *streamText(prompt: string, options?: GenerateTextOptions): AsyncIterable<AIStreamChunk> {
        const res = await this.generateText(prompt, options);
        yield { text: res.text };
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now();
        try {
            await this.generateText('ping', { maxTokens: 5, timeoutMs: 5000 });
            return { healthy: true, provider: 'openai', model: 'gpt-4o-mini', latency: Date.now() - startTime };
        } catch (error) {
            return {
                healthy: false,
                provider: 'openai',
                model: 'gpt-4o-mini',
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
