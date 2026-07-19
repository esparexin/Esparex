import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { AIProvider } from '../AIProvider';
import { AIResult, AIStreamChunk, GenerateTextOptions, HealthCheckResult, AIProviderError } from '../types';
import { getAiConfig } from '../../../config/ai';
import { withTimeout } from '../../../utils/resilience';

export class GeminiProviderError extends Error implements AIProviderError {
    code: 'Authentication' | 'RateLimit' | 'Timeout' | 'Validation' | 'ServiceUnavailable' | 'Unknown';
    provider = 'gemini';
    status?: number;
    details?: unknown;

    constructor(message: string, code: AIProviderError['code'], status?: number, details?: unknown) {
        super(message);
        this.name = 'GeminiProviderError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export class GeminiProvider implements AIProvider {
    private clientPromise: Promise<GoogleGenAI>;
    private modelNamePromise: Promise<string>;

    constructor() {
        const configPromise = getAiConfig();
        this.clientPromise = configPromise.then((c: any) => new GoogleGenAI({ apiKey: c.geminiApiKey }));
        this.modelNamePromise = configPromise.then((c: any) => c.geminiModel);
    }

    private mapError(error: unknown): GeminiProviderError {
        // Simple error mapping for demonstration
        if (error instanceof Error) {
            if (error.message.includes('Timeout')) {
                return new GeminiProviderError('Gemini request timed out', 'Timeout');
            }
            if (error.message.includes('401') || error.message.includes('403')) {
                return new GeminiProviderError('Authentication failed', 'Authentication', 401);
            }
            if (error.message.includes('429')) {
                return new GeminiProviderError('Rate limit exceeded', 'RateLimit', 429);
            }
        }
        return new GeminiProviderError(error instanceof Error ? error.message : 'Unknown error', 'Unknown');
    }

    async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResult> {
        const startTime = Date.now();
        try {
            const client = await this.clientPromise;
            const model = await this.modelNamePromise;
            const config = await getAiConfig();

            const response = await withTimeout(
                client.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        maxOutputTokens: options?.maxTokens ?? config.maxOutputTokens,
                        temperature: options?.temperature ?? config.temperature,
                        topP: options?.topP ?? config.topP,
                    }
                }),
                options?.timeoutMs ?? config.timeoutMs,
                'Gemini generateText'
            );

            return {
                provider: 'gemini',
                model,
                text: response.text || '',
                usage: response.usageMetadata ? {
                    promptTokens: response.usageMetadata.promptTokenCount ?? 0,
                    completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
                    totalTokens: response.usageMetadata.totalTokenCount ?? 0,
                } : undefined,
                latency: Date.now() - startTime,
                cached: false
            };
        } catch (error) {
            throw this.mapError(error);
        }
    }

    async generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, options?: GenerateTextOptions): Promise<T> {
        // Structured output usually uses responseSchema or parsing from text. 
        // For simplicity, we just prompt to return JSON and parse it.
        const res = await this.generateText(`${prompt}\n\nReturn strict JSON that matches the required schema.`, options);
        try {
            const start = res.text.indexOf('{');
            const end = res.text.lastIndexOf('}');
            const jsonText = start !== -1 && end !== -1 ? res.text.slice(start, end + 1) : res.text;
            return schema.parse(JSON.parse(jsonText));
        } catch (err) {
            throw new GeminiProviderError('Failed to parse structured output', 'Validation');
        }
    }

    async *streamText(prompt: string, options?: GenerateTextOptions): AsyncIterable<AIStreamChunk> {
        try {
            const client = await this.clientPromise;
            const model = await this.modelNamePromise;
            const config = await getAiConfig();

            const responseStream = await client.models.generateContentStream({
                model,
                contents: prompt,
                config: {
                    maxOutputTokens: options?.maxTokens ?? config.maxOutputTokens,
                    temperature: options?.temperature ?? config.temperature,
                    topP: options?.topP ?? config.topP,
                }
            });

            for await (const chunk of responseStream) {
                if (chunk.text) {
                    yield { text: chunk.text };
                }
            }
        } catch (error) {
            throw this.mapError(error);
        }
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now();
        let model = 'unknown';
        try {
            model = await this.modelNamePromise;
            await this.generateText('ping', { maxTokens: 5, timeoutMs: 5000 });
            return {
                healthy: true,
                provider: 'gemini',
                model,
                latency: Date.now() - startTime
            };
        } catch (error) {
            return {
                healthy: false,
                provider: 'gemini',
                model,
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
