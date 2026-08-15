import { env } from '../config/env';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';
import { decryptApiKey } from '../utils/aiEncryption';

export const getAiConfig = async () => {
    const systemConfig = await getSystemConfigDoc();
    const dbAiConfig = systemConfig?.ai;

    const geminiEncrypted = dbAiConfig?.providers?.gemini?.apiKeyEncrypted;
    const openAiEncrypted = dbAiConfig?.providers?.openai?.apiKeyEncrypted;
    const claudeEncrypted = dbAiConfig?.providers?.claude?.apiKeyEncrypted;
    const deepseekEncrypted = dbAiConfig?.providers?.deepseek?.apiKeyEncrypted;

    const decryptedGeminiKey = geminiEncrypted ? decryptApiKey(geminiEncrypted) : '';
    const decryptedOpenAiKey = openAiEncrypted ? decryptApiKey(openAiEncrypted) : '';
    const decryptedClaudeKey = claudeEncrypted ? decryptApiKey(claudeEncrypted) : '';
    const decryptedDeepseekKey = deepseekEncrypted ? decryptApiKey(deepseekEncrypted) : '';

    return {
        provider: env.AI_PROVIDER || 'gemini',
        geminiModel: dbAiConfig?.seo?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        geminiApiKey: decryptedGeminiKey || env.GEMINI_API_KEY || '',
        openAiApiKey: decryptedOpenAiKey || dbAiConfig?.seo?.openaiApiKey || process.env.OPENAI_API_KEY || '',
        claudeApiKey: decryptedClaudeKey || process.env.CLAUDE_API_KEY || '',
        deepseekApiKey: decryptedDeepseekKey || process.env.DEEPSEEK_API_KEY || '',
        temperature: dbAiConfig?.seo?.temperature ?? (Number(process.env.GEMINI_TEMPERATURE) || 0.7),
        maxOutputTokens: dbAiConfig?.seo?.maxTokens ?? (Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 2048),
        timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 30000,
        topP: Number(process.env.GEMINI_TOP_P) || 0.95,
        capabilities: dbAiConfig?.capabilities,
        providers: dbAiConfig?.providers,
    };
};
