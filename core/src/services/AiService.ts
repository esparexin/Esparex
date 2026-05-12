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

export type AIRequestType = 'identify' | 'generate' | 'moderate' | 'taxonomy';

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

export const AI_REQUEST_TIMEOUT_MS = env.AI_REQUEST_TIMEOUT_MS ?? 30000;
export const AI_MAX_IMAGE_BYTES = env.AI_MAX_IMAGE_BYTES ?? (4 * 1024 * 1024);

const parseJsonFromAi = (raw: string): Record<string, unknown> | null => {
    try {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end === -1) return null;
        
        const jsonPart = raw.slice(start, end + 1).trim();
        const parsed: unknown = JSON.parse(jsonPart) as unknown;
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



const mapProviderError = (error: OpenAICallFailure): AIServiceFailure => {
    const status = typeof error.status === 'string' ? parseInt(error.status, 10) : error.status;

    if (error.code === 'TIMEOUT') {
        return { ok: false, status: 504, error: 'AI provider timeout', code: 'AI_PROVIDER_TIMEOUT' };
    }
    if (status === 429) {
        return { ok: false, status: 429, error: 'AI quota exceeded or rate limit reached', code: 'AI_QUOTA_EXCEEDED' };
    }
    if (status === 404) {
        return { ok: false, status: 404, error: 'AI model not found', code: 'AI_MODEL_NOT_FOUND' };
    }
    if (status === 503 || (status !== undefined && status >= 500)) {
        return { ok: false, status: 503, error: 'AI provider unavailable', code: 'AI_PROVIDER_UNAVAILABLE' };
    }
    if (status === 401) {
        return { ok: false, status: 500, error: 'AI provider authentication failed (Invalid API Key)', code: 'AI_INVALID_API_KEY' };
    }
    if (status === 403) {
        return { ok: false, status: 403, error: 'AI provider access forbidden', code: 'AI_PROVIDER_FORBIDDEN' };
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
        logger.error('AI JSON Parse Failed. Raw content:', { content: result.content });
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
    value === 'identify' || value === 'generate' || value === 'moderate' || value === 'taxonomy';

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

type GeminiContentPart =
    | { text: string }
    | { inline_data: { mime_type: string; data: string } };

type GeminiContent = { parts: GeminiContentPart[] };

type GeminiApiResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
};

const callGemini = async (
    apiKey: string,
    model: string,
    prompt: string,
    image?: string,
    maxTokens: number = 500,
    temperature: number = 0.7
): Promise<OpenAICallResult> => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const contents: GeminiContent[] = [{
            parts: [{ text: prompt }]
        }];

        if (image) {
            const separatorIndex = image.indexOf(',');
            const mimeType = image.slice(image.indexOf(':') + 1, image.indexOf(';'));
            const base64Data = image.slice(separatorIndex + 1);
            // The array is always initialised with one element above
            contents[0].parts.push({
                inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: base64Data
                }
            });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            logger.error('Gemini API Error:', { status: response.status, error: err });
            return { ok: false, status: response.status, error: err || 'Gemini API request failed' };
        }

        const data = await response.json() as GeminiApiResponse;
        const parts = data.candidates?.[0]?.content?.parts;
        const content = parts?.map(p => p.text || '').join('').trim();
        
        if (!content) {
            return { ok: false, status: 502, error: 'Empty response from Gemini' };
        }
        return { ok: true, content };
    } catch (error) {
        logger.error('Fetch Gemini Error:', error);
        return { ok: false, status: 502, error: 'Failed to call Gemini provider' };
    }
};

export const executeAiRequest = async (input: ExecuteAiRequestInput): Promise<AIServiceResult> => {
    const { type, context, image, contextText } = input;
    
    // ... validation logic (kept implicitly) ...
    if (type === 'generate' && !context.brand && !context.model) {
        return toServiceFailure({ ok: false, status: 400, error: 'Brand and Model context are required for generation' });
    }

    const config = await getSystemConfigDoc();
    const aiConfig = config?.ai;
    
    // Support Gemini if API KEY is present, otherwise fallback to OpenAI
    const geminiKey = env.GEMINI_API_KEY;
    const openAiKey = typeof aiConfig?.seo?.openaiApiKey === 'string'
        ? aiConfig.seo.openaiApiKey.trim()
        : '';

    // Model Resolution Priority:
    // 1. Explicit model in aiConfig (from DB)
    // 2. env.AI_MODEL
    // 3. env.GEMINI_MODEL (if geminiKey present)
    // 4. Default fallbacks
    const envAiModel = env.AI_MODEL;
    const envGeminiModel = env.GEMINI_MODEL;
    
    let model = aiConfig?.seo?.model || envAiModel || (geminiKey ? (envGeminiModel || 'gemini-flash-latest') : 'gpt-4o');

    // Legacy Model Sanitation: If DB or ENV has a known invalid/deprecated model name, force upgrade it.
    if (model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash') {
        model = 'gemini-flash-latest';
    }

    // Cross-provider safety check: 
    // If we have a Gemini key but the model doesn't look like a Gemini model, 
    // and we DON'T have an OpenAI key, force a Gemini fallback.
    if (geminiKey && !model.toLowerCase().startsWith('gemini') && !openAiKey) {
        model = envGeminiModel || 'gemini-flash-latest';
    }


    const maxTokens = typeof aiConfig?.seo?.maxTokens === 'number' ? aiConfig.seo.maxTokens : 1024;
    const temperature = typeof aiConfig?.seo?.temperature === 'number' ? aiConfig.seo.temperature : 0.7;

    if (type === 'identify') {
        if (!geminiKey && !openAiKey) {
            return toServiceFailure({ 
                ok: false, 
                status: 412, 
                error: 'AI Provider Config Missing. Please set GEMINI_API_KEY or openaiApiKey.',
                code: 'AI_CONFIG_MISSING'
            });
        }

        const prompt = contextText
            ? `Identify device brand, model, and return as JSON: {"brand":"...","model":"...","confidence":0.9}. Context: "${contextText}".`
            : 'Identify the device brand and model from the image. Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.';

        const result = geminiKey 
            ? await callGemini(geminiKey, model, prompt, image, 300, temperature)
            : await callOpenAIWithMessages(openAiKey, model, [buildUserMessage(prompt, image)], 300, temperature);

        return parseValidJsonResult(result, 'AI identify response parse failed');
    }

    if (type === 'generate') {
        if (!geminiKey && !openAiKey) {
            return toServiceFailure({ 
                ok: false, 
                status: 412, 
                error: 'AI Generation Config Missing. Please set GEMINI_API_KEY or openaiApiKey.',
                code: 'AI_CONFIG_MISSING'
            });
        }

        const prompt = `Generate a professional and catchy Title and a detailed selling Description for an electronic device listing on a marketplace.
Context:
- Category: ${String(context.category || 'Electronics')}
- Brand: ${String(context.brand)}
- Model: ${String(context.model)}
- Condition: ${String(context.condition)}
${context.workingParts ? `- Working Spare Parts: ${String(context.workingParts)}` : ''}

Rules:
1. Return strict JSON: {"title": "...", "description": "..."}.
2. The Title should be concise (50-70 characters).
3. The Description should be persuasive, highlighting the brand, model, and condition.
4. If working spare parts are provided, mention them as a value-add for the buyer.
5. Do not include placeholders or generic text.`;

        const result = geminiKey
            ? await callGemini(geminiKey, model, prompt, undefined, maxTokens, temperature)
            : await callOpenAI(openAiKey, model, prompt, maxTokens, temperature);
            
        return parseValidJsonResult(result, 'AI generate response parse failed');
    }

    if (type === 'moderate') {
        const prompt = `Moderate this ad for safety. Return JSON: {"safe": boolean, "reason": string | null}. Content: "${contextText || ''}"`;
        const result = geminiKey
            ? await callGemini(geminiKey, model, prompt, image, maxTokens, temperature)
            : await callOpenAIWithMessages(openAiKey, model, [buildUserMessage(prompt, image)], maxTokens, temperature);
            
        return parseValidJsonResult(result, 'AI moderation response parse failed');
    }

    if (type === 'taxonomy') {
        if (!geminiKey && !openAiKey) {
            return toServiceFailure({ 
                ok: false, 
                status: 412, 
                error: 'AI Taxonomy Config Missing.',
                code: 'AI_CONFIG_MISSING'
            });
        }

        const result = geminiKey
            ? await callGemini(geminiKey, model, contextText, undefined, 500, 0.1) // Low temperature for extraction
            : await callOpenAI(openAiKey, model, contextText, 500, 0.1);

        return parseValidJsonResult(result, 'AI taxonomy analysis response parse failed');
    }

    return toServiceFailure({ ok: false, status: 400, error: 'Invalid AI request type' });
};
