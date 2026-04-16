import logger from '../utils/logger';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';
import { env } from '../config/env';

type OpenAIMessageContent =
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
    >;

type OpenAIMessage = {
    role: 'system' | 'user' | 'assistant';
    content: OpenAIMessageContent;
};

export type AIRequestType = 'identify' | 'generate' | 'moderate';

export type AIRequestBody = {
    type?: string;
    context?: Record<string, unknown>;
    image?: string;
};

type OpenAICallSuccess = {
    ok: true;
    content: string;
};

type OpenAICallFailure = {
    ok: false;
    status?: number;
    error: string;
    code?: 'TIMEOUT';
};

type OpenAICallResult = OpenAICallSuccess | OpenAICallFailure;

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

export const AI_REQUEST_TIMEOUT_MS = env.AI_REQUEST_TIMEOUT_MS ?? 12000;
export const AI_MAX_IMAGE_BYTES = env.AI_MAX_IMAGE_BYTES ?? (4 * 1024 * 1024);

const parseJsonFromAi = (raw: string): Record<string, unknown> | null => {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try {
        const parsed: unknown = JSON.parse(cleaned) as unknown;
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
        return null;
    }
};

const buildUserMessage = (prompt: string, imageDataUrl?: string): OpenAIMessage => {
    if (!imageDataUrl) {
        return { role: 'user', content: prompt };
    }

    return {
        role: 'user',
        content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
    };
};

const estimateBase64DataUrlBytes = (value: string): number | null => {
    const separatorIndex = value.indexOf(',');
    if (separatorIndex <= 0) return null;

    const meta = value.slice(0, separatorIndex);
    if (!/;base64$/i.test(meta)) return null;

    const base64 = value.slice(separatorIndex + 1).replace(/\s/g, '');
    if (base64.length === 0) return 0;

    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
};

const mapProviderError = (error: OpenAICallFailure): AIServiceFailure => {
    if (error.code === 'TIMEOUT') {
        return { ok: false, status: 504, error: 'AI provider timeout', code: 'AI_PROVIDER_TIMEOUT' };
    }
    if (error.status === 429) {
        return { ok: false, status: 429, error: 'AI rate limit exceeded', code: 'AI_RATE_LIMIT' };
    }
    if (error.status === 503 || (error.status !== undefined && error.status >= 500)) {
        return { ok: false, status: 503, error: 'AI provider unavailable', code: 'AI_PROVIDER_UNAVAILABLE' };
    }
    if (error.status === 401 || error.status === 403) {
        return { ok: false, status: 500, error: 'AI provider authentication failed', code: 'AI_PROVIDER_AUTH' };
    }
    return { ok: false, status: 502, error: 'AI provider request failed', code: 'AI_PROVIDER_ERROR' };
};

const callOpenAIWithMessages = async (
    apiKey: string,
    model: string,
    messages: OpenAIMessage[],
    maxTokens: number = 500,
    temperature: number = 0.7
): Promise<OpenAICallResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: model || 'gpt-4o',
                messages,
                max_tokens: maxTokens,
                temperature
            })
        });

        if (!response.ok) {
            const err = await response.text();
            logger.error('OpenAI API Error:', { status: response.status, error: err });
            return {
                ok: false,
                status: response.status,
                error: err || 'OpenAI API request failed'
            };
        }

        const data = await response.json() as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) {
            return {
                ok: false,
                status: 502,
                error: 'Empty response from AI provider'
            };
        }
        return { ok: true, content };
    } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
            logger.error('OpenAI API Timeout');
            return {
                ok: false,
                status: 504,
                code: 'TIMEOUT',
                error: `OpenAI request timed out after ${AI_REQUEST_TIMEOUT_MS}ms`
            };
        }
        logger.error('Fetch OpenAI Error:', error);
        return {
            ok: false,
            status: 502,
            error: 'Failed to call AI provider'
        };
    } finally {
        clearTimeout(timeout);
    }
};

const callOpenAI = async (
    apiKey: string,
    model: string,
    prompt: string,
    maxTokens: number = 500,
    temperature: number = 0.7
) => {
    return callOpenAIWithMessages(apiKey, model, [{ role: 'user', content: prompt }], maxTokens, temperature);
};

const toServiceFailure = (response: AIServiceFailure): AIServiceFailure => response;

const parseValidJsonResult = (
    result: OpenAICallResult,
    parseErrorMessage: string
): AIServiceSuccess | AIServiceFailure => {
    if (!result.ok) {
        const mapped = mapProviderError(result);
        return toServiceFailure({
            ...mapped,
            details: { providerStatus: result.status }
        });
    }

    const data = parseJsonFromAi(result.content);
    if (!data) {
        return toServiceFailure({
            ok: false,
            status: 502,
            error: parseErrorMessage,
            code: 'AI_INVALID_JSON'
        });
    }

    return { ok: true, data };
};

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

export const executeAiRequest = async (input: ExecuteAiRequestInput): Promise<AIServiceResult> => {
    const { type, context, image, contextText } = input;
    const imageBytes = image ? estimateBase64DataUrlBytes(image) : null;
    if (imageBytes !== null && imageBytes > AI_MAX_IMAGE_BYTES) {
        return {
            ok: false,
            status: 413,
            error: 'Image payload too large',
            code: 'AI_IMAGE_TOO_LARGE',
            details: {
                maxBytes: AI_MAX_IMAGE_BYTES,
                receivedBytes: imageBytes
            }
        };
    }

    const config = await getSystemConfigDoc();
    const aiConfig = config?.ai;
    const apiKey = typeof aiConfig?.seo?.openaiApiKey === 'string'
        ? aiConfig.seo.openaiApiKey.trim()
        : '';
    const model = aiConfig?.seo?.model || 'gpt-4o';
    const maxTokens = typeof aiConfig?.seo?.maxTokens === 'number' ? aiConfig.seo.maxTokens : 500;
    const temperature = typeof aiConfig?.seo?.temperature === 'number' ? aiConfig.seo.temperature : 0.7;

    const hasApiKey = apiKey.length > 0;
    const canUseIdentify = hasApiKey;
    const canUseModerate = hasApiKey && (aiConfig?.moderation?.enabled ?? true);
    const canUseGenerate = hasApiKey && Boolean(
        aiConfig?.seo?.enableTitleSEO || aiConfig?.seo?.enableDescriptionSEO
    );

    if (type === 'identify') {
        if (!canUseIdentify) {
            return toServiceFailure({ ok: false, status: 500, error: 'AI Identify Disabled or Config Missing' });
        }
        if (!image && !contextText) {
            return toServiceFailure({ ok: false, status: 400, error: 'Image or context text is required for identify' });
        }

        const prompt = contextText
            ? `Extract device brand, model, and confidence (0-1) from the provided device context and image if present. Context: "${contextText}". Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.`
            : 'Identify the device brand and model from the provided image. Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.';
        const result = await callOpenAIWithMessages(
            apiKey,
            model,
            [buildUserMessage(prompt, image)],
            Math.min(maxTokens, 300),
            temperature
        );

        return parseValidJsonResult(result, 'AI identify response parse failed');
    }

    if (type === 'generate') {
        if (!canUseGenerate) {
            return toServiceFailure({ ok: false, status: 500, error: 'AI Generation Disabled or Config Missing' });
        }
        const parts = context.spareParts || 'parts';
        const power = context.power || 'Unknown';

        const prompt = `
                Generate a catchy Title and a profesional Description for a used smartphone ad.
                Context:
                - Brand: ${String(context.brand)}
                - Model: ${String(context.model)}
                - Condition: Power is ${String(power)}
                - Working Parts: ${String(parts)}
                
                Output validation: Return strictly valid JSON with keys "title" and "description".
                `;

        const result = await callOpenAI(apiKey, model, prompt, maxTokens, temperature);
        return parseValidJsonResult(result, 'AI generate response parse failed');
    }

    if (!canUseModerate) {
        return toServiceFailure({ ok: false, status: 500, error: 'AI Moderation Disabled or Config Missing' });
    }
    if (!contextText && !image) {
        return toServiceFailure({ ok: false, status: 400, error: 'Moderation requires text or image' });
    }
    const prompt = `
                Analyze this ad content for safety. Flag if it contains hate speech, violence, or scams.
                Content: "${contextText || ''}"
                Return JSON: {"safe": boolean, "reason": string | null}
                `;
    const result = await callOpenAIWithMessages(
        apiKey,
        model,
        [buildUserMessage(prompt, image)],
        maxTokens,
        temperature
    );
    return parseValidJsonResult(result, 'AI moderation response parse failed');
};
