import { z } from 'zod';
import logger from '../utils/logger';
import { env } from '../config/env';
import { AIProviderFactory } from './ai/AIProviderFactory';
import { getAiConfig } from '../config/ai';
import { generateListingPromptV1, identifyDevicePromptV1 } from '../prompts/listings/v1';
import { moderateAdPromptV1 } from '../prompts/moderation/v1';
import { MAX_AD_TITLE_CHARS, MAX_AD_DESCRIPTION_CHARS } from '@esparex/contracts';
import { AIProviderError } from './ai/types';

export type AIRequestType = 'identify' | 'generate' | 'moderate';

export type AIRequestBody = {
    type?: string;
    context?: Record<string, unknown>;
    image?: string;
};

export type AIServiceSuccess = {
    ok: true;
    data: Record<string, unknown>;
};

export type AIServiceFailure = {
    ok: false;
    status: number;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
};

export type AIServiceResult = AIServiceSuccess | AIServiceFailure;

type ExecuteAiRequestInput = {
    type: AIRequestType;
    context: Record<string, unknown>;
    image?: string;
    contextText: string;
};

export const AI_REQUEST_TIMEOUT_MS = env.AI_REQUEST_TIMEOUT_MS ?? 30000;
export const AI_MAX_IMAGE_BYTES = env.AI_MAX_IMAGE_BYTES ?? (4 * 1024 * 1024);

export const isAIRequestType = (value: unknown): value is AIRequestType =>
    value === 'identify' || value === 'generate' || value === 'moderate';

export const getAiContext = (body: AIRequestBody): {
    context: Record<string, unknown>;
    image?: string;
    contextText: string;
} => {
    const context = body?.context && typeof body.context === 'object' ? body.context : {};
    const rootImage = typeof body?.image === 'string' ? body.image : undefined;
    const contextImage = typeof context.image === 'string' ? context.image : undefined;
    const image = rootImage || contextImage;
    const contextText = typeof context.text === 'string' ? context.text : '';

    return { context, image, contextText };
};

const toServiceFailure = (response: AIServiceFailure): AIServiceFailure => response;

const mapProviderError = (error: unknown): AIServiceFailure => {
    if ((error as AIProviderError).code) {
        const providerError = error as AIProviderError;
        const code = providerError.code;
        const status = providerError.status || 502;
        
        switch (code) {
            case 'Timeout': return { ok: false, status: 504, error: 'AI provider timeout', code: 'AI_PROVIDER_TIMEOUT' };
            case 'RateLimit': return { ok: false, status: 429, error: 'AI quota exceeded or rate limit reached', code: 'AI_QUOTA_EXCEEDED' };
            case 'Authentication': return { ok: false, status: 500, error: 'AI provider authentication failed (Invalid API Key)', code: 'AI_INVALID_API_KEY' };
            case 'ServiceUnavailable': return { ok: false, status: 503, error: 'AI provider unavailable', code: 'AI_PROVIDER_UNAVAILABLE' };
            case 'Validation': return { ok: false, status: 502, error: 'AI Provider Validation Error', code: 'AI_INVALID_JSON' };
        }
        return { ok: false, status, error: providerError.message, code: 'AI_PROVIDER_ERROR' };
    }
    return { ok: false, status: 502, error: error instanceof Error ? error.message : 'Unknown AI Error', code: 'AI_UNKNOWN_ERROR' };
};

export const executeAiRequest = async (input: ExecuteAiRequestInput): Promise<AIServiceResult> => {
    const { type, context, image, contextText } = input;
    
    if (type === 'generate' && !context.brand && !context.model) {
        return toServiceFailure({ ok: false, status: 400, error: 'Brand and Model context are required for generation' });
    }

    const config = await getAiConfig();
    if (!config.geminiApiKey && !config.openAiApiKey) {
        return toServiceFailure({ 
            ok: false, 
            status: 412, 
            error: 'AI Provider Config Missing.',
            code: 'AI_CONFIG_MISSING'
        });
    }

    try {
        const provider = AIProviderFactory.create(config.provider);

        // Define Zod schemas based on request type to enforce structured output at the provider level
        if (type === 'identify') {
            const prompt = identifyDevicePromptV1(contextText);
            const schema = z.object({
                brand: z.string(),
                model: z.string(),
                confidence: z.number().optional()
            });

            // Note: Caching hook can be inserted here before calling the provider
            const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
            
            return { ok: true, data: result as Record<string, unknown> };
        }

        if (type === 'generate') {
            const prompt = generateListingPromptV1(context);
            const schema = z.object({
                title: z.string().max(MAX_AD_TITLE_CHARS),
                description: z.string().max(MAX_AD_DESCRIPTION_CHARS)
            });

            const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
            return { ok: true, data: result as Record<string, unknown> };
        }

        if (type === 'moderate') {
            const prompt = moderateAdPromptV1(contextText);
            const schema = z.object({
                safe: z.boolean(),
                reason: z.string().nullable()
            });

            const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
            return { ok: true, data: result as Record<string, unknown> };
        }

        return toServiceFailure({ ok: false, status: 400, error: 'Invalid AI request type' });
    } catch (error) {
        logger.error('[AiService] executeAiRequest error', { error });
        return mapProviderError(error);
    }
};
