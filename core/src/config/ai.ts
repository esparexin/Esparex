import { env } from '../config/env';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';

export const getAiConfig = async () => {
    const systemConfig = await getSystemConfigDoc();
    const dbAiConfig = systemConfig?.ai;

    return {
        provider: env.AI_PROVIDER || 'gemini',
        geminiModel: dbAiConfig?.seo?.model || (env as any).GEMINI_MODEL || 'gemini-2.5-pro',
        geminiApiKey: env.GEMINI_API_KEY || '',
        openAiApiKey: dbAiConfig?.seo?.openaiApiKey || (env as any).OPENAI_API_KEY || '',
        temperature: dbAiConfig?.seo?.temperature ?? (Number((env as any).GEMINI_TEMPERATURE) || 0.7),
        maxOutputTokens: dbAiConfig?.seo?.maxTokens ?? (Number((env as any).GEMINI_MAX_OUTPUT_TOKENS) || 2048),
        timeoutMs: Number((env as any).GEMINI_TIMEOUT_MS) || 30000,
        topP: Number((env as any).GEMINI_TOP_P) || 0.95
    };
};
