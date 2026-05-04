"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAiRequest = exports.getAiContext = exports.isAIRequestType = exports.AI_MAX_IMAGE_BYTES = exports.AI_REQUEST_TIMEOUT_MS = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
const env_1 = require("@core/config/env");
exports.AI_REQUEST_TIMEOUT_MS = env_1.env.AI_REQUEST_TIMEOUT_MS ?? 12000;
exports.AI_MAX_IMAGE_BYTES = env_1.env.AI_MAX_IMAGE_BYTES ?? (4 * 1024 * 1024);
const parseJsonFromAi = (raw) => {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try {
        const parsed = JSON.parse(cleaned);
        return parsed && typeof parsed === 'object' ? parsed : null;
    }
    catch {
        return null;
    }
};
const buildUserMessage = (prompt, imageDataUrl) => {
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
const mapProviderError = (error) => {
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
const callOpenAIWithMessages = async (apiKey, model, messages, maxTokens = 500, temperature = 0.7) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), exports.AI_REQUEST_TIMEOUT_MS);
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
            logger_1.default.error('OpenAI API Error:', { status: response.status, error: err });
            return {
                ok: false,
                status: response.status,
                error: err || 'OpenAI API request failed'
            };
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) {
            return {
                ok: false,
                status: 502,
                error: 'Empty response from AI provider'
            };
        }
        return { ok: true, content };
    }
    catch (error) {
        if (error.name === 'AbortError') {
            logger_1.default.error('OpenAI API Timeout');
            return {
                ok: false,
                status: 504,
                code: 'TIMEOUT',
                error: `OpenAI request timed out after ${exports.AI_REQUEST_TIMEOUT_MS}ms`
            };
        }
        logger_1.default.error('Fetch OpenAI Error:', error);
        return {
            ok: false,
            status: 502,
            error: 'Failed to call AI provider'
        };
    }
    finally {
        clearTimeout(timeout);
    }
};
const callOpenAI = async (apiKey, model, prompt, maxTokens = 500, temperature = 0.7) => {
    return callOpenAIWithMessages(apiKey, model, [{ role: 'user', content: prompt }], maxTokens, temperature);
};
const toServiceFailure = (response) => response;
const parseValidJsonResult = (result, parseErrorMessage) => {
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
const isAIRequestType = (value) => value === 'identify' || value === 'generate' || value === 'moderate';
exports.isAIRequestType = isAIRequestType;
const getAiContext = (body) => {
    const context = body?.context && typeof body.context === 'object' ? body.context : {};
    const rootImage = typeof body?.image === 'string' ? body.image : undefined;
    const contextImage = typeof context.image === 'string' ? context.image : undefined;
    const image = rootImage || contextImage;
    const contextText = typeof context.text === 'string' ? context.text : '';
    return { context, image, contextText };
};
exports.getAiContext = getAiContext;
const callGemini = async (apiKey, prompt, image, maxTokens = 500, temperature = 0.7) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const contents = [{
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
            logger_1.default.error('Gemini API Error:', { status: response.status, error: err });
            return { ok: false, status: response.status, error: err || 'Gemini API request failed' };
        }
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!content) {
            return { ok: false, status: 502, error: 'Empty response from Gemini' };
        }
        return { ok: true, content };
    }
    catch (error) {
        logger_1.default.error('Fetch Gemini Error:', error);
        return { ok: false, status: 502, error: 'Failed to call Gemini provider' };
    }
};
const executeAiRequest = async (input) => {
    const { type, context, image, contextText } = input;
    // ... validation logic (kept implicitly) ...
    const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
    const aiConfig = config?.ai;
    // Support Gemini if API KEY is present, otherwise fallback to OpenAI
    const geminiKey = env_1.env.GEMINI_API_KEY;
    const openAiKey = typeof aiConfig?.seo?.openaiApiKey === 'string'
        ? aiConfig.seo.openaiApiKey.trim()
        : '';
    const model = aiConfig?.seo?.model || (geminiKey ? 'gemini-1.5-flash' : 'gpt-4o');
    const maxTokens = typeof aiConfig?.seo?.maxTokens === 'number' ? aiConfig.seo.maxTokens : 500;
    const temperature = typeof aiConfig?.seo?.temperature === 'number' ? aiConfig.seo.temperature : 0.7;
    if (type === 'identify') {
        if (!geminiKey && !openAiKey) {
            return toServiceFailure({ ok: false, status: 500, error: 'AI Identification Config Missing' });
        }
        const prompt = contextText
            ? `Identify device brand, model, and return as JSON: {"brand":"...","model":"...","confidence":0.9}. Context: "${contextText}".`
            : 'Identify the device brand and model from the image. Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.';
        const result = geminiKey
            ? await callGemini(geminiKey, prompt, image, 300, temperature)
            : await callOpenAIWithMessages(openAiKey, model, [buildUserMessage(prompt, image)], 300, temperature);
        return parseValidJsonResult(result, 'AI identify response parse failed');
    }
    if (type === 'generate') {
        const prompt = `Generate a Title and Description for a used ad. Brand: ${String(context.brand)}, Model: ${String(context.model)}. Return JSON: {"title":"...","description":"..."}`;
        const result = geminiKey
            ? await callGemini(geminiKey, prompt, undefined, maxTokens, temperature)
            : await callOpenAI(openAiKey, model, prompt, maxTokens, temperature);
        return parseValidJsonResult(result, 'AI generate response parse failed');
    }
    if (type === 'moderate') {
        const prompt = `Moderate this ad for safety. Return JSON: {"safe": boolean, "reason": string | null}. Content: "${contextText || ''}"`;
        const result = geminiKey
            ? await callGemini(geminiKey, prompt, image, maxTokens, temperature)
            : await callOpenAIWithMessages(openAiKey, model, [buildUserMessage(prompt, image)], maxTokens, temperature);
        return parseValidJsonResult(result, 'AI moderation response parse failed');
    }
    return toServiceFailure({ ok: false, status: 400, error: 'Invalid AI request type' });
};
exports.executeAiRequest = executeAiRequest;
//# sourceMappingURL=AiService.js.map