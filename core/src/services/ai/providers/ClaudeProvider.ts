import { z } from 'zod';
import { AIProvider } from '../AIProvider';
import { AIResult, AIStreamChunk, GenerateTextOptions, HealthCheckResult, AIProviderError, StructuredAIResult } from '../types';
import { getAiConfig } from '../../../config/ai';
import { withTimeout } from '../../../utils/resilience';

export class ClaudeProviderError extends Error implements AIProviderError {
    code: 'Authentication' | 'RateLimit' | 'Timeout' | 'Validation' | 'ServiceUnavailable' | 'Unknown';
    provider = 'claude';
    status?: number;
    details?: unknown;

    constructor(message: string, code: AIProviderError['code'], status?: number, details?: unknown) {
        super(message);
        this.name = 'ClaudeProviderError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export class ClaudeProvider implements AIProvider {
    private apiKeyPromise: Promise<string>;

    constructor() {
        this.apiKeyPromise = getAiConfig().then((c) => c.claudeApiKey || '');
    }

    private mapError(error: unknown): ClaudeProviderError {
        if (error instanceof Error) {
            if (error.message.includes('Timeout')) {
                return new ClaudeProviderError('Claude request timed out', 'Timeout');
            }
            if (error.message.includes('401') || error.message.includes('403')) {
                return new ClaudeProviderError('Claude authentication failed', 'Authentication', 401);
            }
            if (error.message.includes('429')) {
                return new ClaudeProviderError('Claude rate limit exceeded', 'RateLimit', 429);
            }
        }
        return new ClaudeProviderError(error instanceof Error ? error.message : 'Unknown Claude error', 'Unknown');
    }

    async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResult> {
        const startTime = Date.now();
        try {
            const apiKey = await this.apiKeyPromise;
            if (!apiKey) {
                throw new ClaudeProviderError('Claude API key is missing', 'Authentication', 401);
            }
            const config = await getAiConfig();
            const model = 'claude-3-5-haiku-20241022';

            const response = await withTimeout(
                fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: options?.maxTokens ?? config.maxOutputTokens,
                        temperature: options?.temperature ?? config.temperature,
                        messages: [{ role: 'user', content: prompt }],
                    }),
                }),
                options?.timeoutMs ?? config.timeoutMs,
                'Claude generateText'
            );

            if (!response.ok) {
                const status = response.status;
                if (status === 401) throw new ClaudeProviderError('Invalid Claude API key', 'Authentication', 401);
                if (status === 429) throw new ClaudeProviderError('Claude rate limit hit', 'RateLimit', 429);
                throw new ClaudeProviderError(`Claude returned HTTP ${status}`, 'ServiceUnavailable', status);
            }

            const data = await response.json();
            const text = data?.content?.[0]?.text || '';

            return {
                provider: 'claude',
                model,
                text,
                usage: data.usage ? {
                    promptTokens: data.usage.input_tokens ?? 0,
                    completionTokens: data.usage.output_tokens ?? 0,
                    totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
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
                provider: 'claude',
                model: res.model,
                usage: res.usage,
                latency: res.latency,
                cached: res.cached,
            };
        } catch {
            throw new ClaudeProviderError('Failed to parse Claude JSON output', 'Validation');
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
            return { healthy: true, provider: 'claude', model: 'claude-3-5-haiku-20241022', latency: Date.now() - startTime };
        } catch (error) {
            return {
                healthy: false,
                provider: 'claude',
                model: 'claude-3-5-haiku-20241022',
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
