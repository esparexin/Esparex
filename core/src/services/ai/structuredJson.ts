import { z } from 'zod';
import { AIResult, StructuredAIResult } from './types';

/**
 * Shared JSON fence-extraction for provider `generateStructured` implementations.
 * Extracts the first `{...}` block from model text, parses it against `schema`,
 * and re-packages the provider result. Any parse failure is converted via
 * `makeValidationError` so each provider keeps its own error class/message.
 */
export function buildStructuredResult<T>(
    res: AIResult,
    schema: z.ZodSchema<T>,
    makeValidationError: () => Error
): StructuredAIResult<T> {
    try {
        const start = res.text.indexOf('{');
        const end = res.text.lastIndexOf('}');
        const jsonText = start !== -1 && end !== -1 ? res.text.slice(start, end + 1) : res.text;
        return {
            data: schema.parse(JSON.parse(jsonText)),
            provider: res.provider,
            model: res.model,
            usage: res.usage,
            latency: res.latency,
            cached: res.cached,
        };
    } catch {
        throw makeValidationError();
    }
}
