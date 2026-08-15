import { MAX_AD_TITLE_CHARS, MAX_AD_DESCRIPTION_CHARS } from '@esparex/contracts';
import { AiErrorCode } from '@esparex/contracts/v1/common/enums';
import { AIProviderError } from './types';

export type AIServiceFailure = {
    ok: false;
    status: number;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
};

export function buildFallbackListingContent(context: Record<string, unknown>): { title: string; description: string } {
    const brand = String(context.brand || '').trim();
    const model = String(context.model || '').trim();
    const condition = String(context.condition || '').trim();
    const category = String(context.category || '').trim();
    const powerStatus = String(context.powerStatus || context.power || '').trim();
    const workingParts = String(context.workingParts || context.spareParts || '').trim();

    const condLabel = condition === 'power_on' ? 'Working Condition' : condition === 'power_off' ? 'Power Off' : condition ? `${condition.replace(/_/g, ' ')}` : '';
    const titleParts = [brand, model, condLabel].filter(Boolean);
    const title = (titleParts.length > 0 ? titleParts.join(' - ') : 'Electronic Item for Sale').slice(0, MAX_AD_TITLE_CHARS);

    const descLines = [
        `${brand} ${model} ${category ? `(${category})` : ''} for sale.`.trim(),
        condLabel ? `Condition: ${condLabel}.` : '',
        powerStatus ? `Power status: ${powerStatus.replace(/_/g, ' ')}.` : '',
        workingParts ? `Working parts: ${workingParts}.` : '',
        'Genuine item listed for sale on Esparex marketplace.'
    ].filter(Boolean);
    const description = descLines.join(' ').slice(0, MAX_AD_DESCRIPTION_CHARS);

    return { title, description };
}

export function mapProviderError(error: unknown): AIServiceFailure {
    if ((error as AIProviderError)?.code) {
        const providerError = error as AIProviderError;
        const code = providerError.code;
        const status = providerError.status || 502;
        
        switch (code) {
            case 'Timeout': return { ok: false, status: 504, error: 'AI provider timeout', code: AiErrorCode.AI_PROVIDER_TIMEOUT };
            case 'RateLimit': return { ok: false, status: 429, error: 'AI quota exceeded or rate limit reached', code: AiErrorCode.AI_QUOTA_EXHAUSTED };
            case 'Authentication': return { ok: false, status: 500, error: 'AI provider authentication failed (Invalid API Key)', code: AiErrorCode.AI_INVALID_API_KEY };
            case 'ServiceUnavailable': return { ok: false, status: 503, error: 'AI provider unavailable', code: AiErrorCode.AI_UNAVAILABLE };
            case 'Validation': return { ok: false, status: 502, error: 'AI Provider Validation Error', code: AiErrorCode.AI_INVALID_JSON };
        }
        return { ok: false, status, error: providerError.message, code: AiErrorCode.AI_PROVIDER_ERROR };
    }
    return { ok: false, status: 502, error: error instanceof Error ? error.message : 'Unknown AI Error', code: AiErrorCode.AI_UNKNOWN_ERROR };
}
