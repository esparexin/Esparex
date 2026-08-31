import { z } from 'zod';
import logger from '../utils/logger';
import { env } from '../config/env';
import { AIProviderFactory } from './ai/AIProviderFactory';
import { getAiConfig } from '../config/ai';
import { generateListingPromptV1, identifyDevicePromptV1 } from '../prompts/listings/v1';
import { moderateAdPromptV1 } from '../prompts/moderation/v1';
import { MAX_AD_TITLE_CHARS, MAX_AD_DESCRIPTION_CHARS } from '@esparex/contracts';
import { AiErrorCode } from '@esparex/contracts/v1/common/enums';
import { getCache, setCache } from '../utils/redisCache';
import { AIServiceFailure, buildFallbackListingContent, mapProviderError } from './ai/aiFallback';

export type { AIServiceFailure };
export { buildFallbackListingContent };

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

export type AIServiceResult = AIServiceSuccess | AIServiceFailure;

type ExecuteAiRequestInput = {
    type: AIRequestType;
    context: Record<string, unknown>;
    image?: string;
    contextText: string;
};

export const AI_REQUEST_TIMEOUT_MS = env.AI_REQUEST_TIMEOUT_MS ?? 6000;
export const AI_MAX_IMAGE_BYTES = env.AI_MAX_IMAGE_BYTES ?? (4 * 1024 * 1024);

const AI_QUOTA_CACHE_KEY = 'sys:ai:quota_exhausted';
const AI_QUOTA_COOLDOWN_SECONDS = 60;

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

const hasKeyForProvider = (providerName: string, config: { geminiApiKey?: string; openAiApiKey?: string; claudeApiKey?: string; deepseekApiKey?: string }): boolean => {
    switch (providerName.toLowerCase()) {
        case 'gemini':
            return Boolean(config.geminiApiKey);
        case 'openai':
            return Boolean(config.openAiApiKey);
        case 'claude':
        case 'anthropic':
            return Boolean(config.claudeApiKey);
        case 'deepseek':
            return Boolean(config.deepseekApiKey);
        default:
            return false;
    }
};

export const getStatus = async (): Promise<{ available: boolean; reason: string | null; retryAfter: number }> => {
    const config = await getAiConfig();
    const hasAnyKey = Boolean(config.geminiApiKey || config.openAiApiKey || config.claudeApiKey || config.deepseekApiKey);
    if (!hasAnyKey) {
        return { available: false, reason: AiErrorCode.AI_UNAVAILABLE, retryAfter: 0 };
    }
    
    const quotaExhausted = await getCache(AI_QUOTA_CACHE_KEY);
    if (quotaExhausted) {
        return { available: false, reason: AiErrorCode.AI_QUOTA_EXHAUSTED, retryAfter: AI_QUOTA_COOLDOWN_SECONDS };
    }
    
    return { available: true, reason: null, retryAfter: 0 };
};

export const executeAiRequest = async (input: ExecuteAiRequestInput): Promise<AIServiceResult> => {
    const t0 = Date.now();
    const { type, context, contextText } = input;

    if (type === 'generate' && !context.brand && !context.model) {
        return toServiceFailure({ ok: false, status: 400, error: 'Brand and Model context are required for generation' });
    }

    const status = await getStatus();
    if (!status.available) {
        return toServiceFailure({
            ok: false,
            status: status.reason === AiErrorCode.AI_QUOTA_EXHAUSTED ? 429 : 503,
            error: 'AI service unavailable',
            code: status.reason || AiErrorCode.AI_UNAVAILABLE
        });
    }

    const config = await getAiConfig();
    const tConfig = Date.now() - t0;

    const capabilityKeyMap: Record<AIRequestType, string> = {
        identify: 'device_identification',
        generate: 'post_ad_title',
        moderate: 'content_moderation',
    };
    const capabilityKey = capabilityKeyMap[type] || 'post_ad_title';
    const capabilityConfig = (config.capabilities as Record<string, any>)?.[capabilityKey];
    
    const primaryProvider = capabilityConfig?.provider || config.provider || 'gemini';
    const fallbackCandidates = ['gemini', 'openai', 'claude', 'deepseek'];
    const rawChain = [primaryProvider, ...fallbackCandidates.filter(p => p !== primaryProvider)];
    const providerChain = rawChain.filter(p => hasKeyForProvider(p, config));

    if (providerChain.length === 0) {
        return toServiceFailure({
            ok: false,
            status: 503,
            error: 'AI service unavailable: no active providers with configured API keys found.',
            code: AiErrorCode.AI_UNAVAILABLE
        });
    }

    let lastError: unknown = null;

    for (const providerName of providerChain) {
        try {
            const provider = AIProviderFactory.create(providerName);

            if (type === 'identify') {
                const rawText = typeof contextText === 'string' ? contextText : '';
                const cacheKey = `sys:ai:identify_cache:${Buffer.from(rawText.trim().toLowerCase()).toString('base64').slice(0, 48)}`;
                const cachedResult = await getCache<Record<string, unknown>>(cacheKey);
                if (cachedResult) {
                    logger.info('[AiService] identify cache hit', {
                        type,
                        contextText: rawText,
                        totalMs: Date.now() - t0,
                    });
                    return { ok: true, data: cachedResult };
                }

                const prompt = identifyDevicePromptV1(rawText);
                const schema = z.object({
                    brand: z.string(),
                    model: z.string(),
                    confidence: z.number().optional()
                });

                const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
                const totalMs = Date.now() - t0;
                logger.info('[AiService] identify telemetry', {
                    type,
                    provider: result.provider,
                    model: result.model,
                    wasFallback: providerName !== primaryProvider,
                    llmLatencyMs: result.latency,
                    configLookupMs: tConfig,
                    totalMs,
                    usage: result.usage,
                });

                await setCache(cacheKey, JSON.stringify(result.data), 1800);

                return { ok: true, data: result.data as Record<string, unknown> };
            }

            if (type === 'generate') {
                const normalizedKey = JSON.stringify(context, Object.keys(context).sort());
                const cacheKey = `sys:ai:generate_cache:${Buffer.from(normalizedKey).toString('base64').slice(0, 64)}`;
                const cachedResult = await getCache<Record<string, unknown>>(cacheKey);
                if (cachedResult) {
                    logger.info('[AiService] generate cache hit', {
                        type,
                        totalMs: Date.now() - t0,
                    });
                    return { ok: true, data: cachedResult };
                }

                const prompt = generateListingPromptV1(context);
                const schema = z.object({
                    title: z.string().max(MAX_AD_TITLE_CHARS),
                    description: z.string().max(MAX_AD_DESCRIPTION_CHARS)
                });

                const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
                const totalMs = Date.now() - t0;
                logger.info('[AiService] generate telemetry', {
                    type,
                    provider: result.provider,
                    model: result.model,
                    wasFallback: providerName !== primaryProvider,
                    llmLatencyMs: result.latency,
                    configLookupMs: tConfig,
                    totalMs,
                    usage: result.usage,
                });

                await setCache(cacheKey, JSON.stringify(result.data), 3600);

                return { ok: true, data: result.data as Record<string, unknown> };
            }

            if (type === 'moderate') {
                const prompt = moderateAdPromptV1(contextText);
                const schema = z.object({
                    safe: z.boolean(),
                    reason: z.string().nullable()
                });

                const result = await provider.generateStructured(prompt, schema, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
                const totalMs = Date.now() - t0;
                logger.info('[AiService] moderate telemetry', {
                    type,
                    provider: result.provider,
                    model: result.model,
                    wasFallback: providerName !== primaryProvider,
                    llmLatencyMs: result.latency,
                    configLookupMs: tConfig,
                    totalMs,
                    usage: result.usage,
                });

                return { ok: true, data: result.data as Record<string, unknown> };
            }
        } catch (error) {
            lastError = error;
            logger.warn(`[AiService] Provider '${providerName}' failed, trying next candidate in chain`, {
                failedProvider: providerName,
                capability: capabilityKey,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    logger.warn('[AiService] All providers in fallback chain failed or unavailable', { error: lastError, totalMs: Date.now() - t0 });

    if (type === 'generate') {
        const fallbackData = buildFallbackListingContent(context);
        logger.info('[AiService] Provided instant fallback listing content after provider failure', { totalMs: Date.now() - t0 });
        return { ok: true, data: fallbackData };
    }

    const serviceFailure = mapProviderError(lastError);

    if (serviceFailure.code === AiErrorCode.AI_QUOTA_EXHAUSTED) {
        await setCache(AI_QUOTA_CACHE_KEY, '1', AI_QUOTA_COOLDOWN_SECONDS);
    }

    return serviceFailure;
};

