export const TAXONOMY_AI_PROMPT_VERSIONS = {
    BRAND: 'v1.0.0',
    MODEL: 'v1.0.0',
    VARIANT: 'v1.0.0',
};

export class TaxonomyAiPromptBuilder {
    static buildBrandPrompt(name: string): string {
        return `Analyze the following brand name suggestion for an electronics marketplace:
Suggestion: "${name}"

Rules:
1. Identify the most likely "Category" (e.g., Mobile Phones, Laptops, Tablets, etc.).
2. Identify the canonical "Brand" name (e.g., "Apple" for "i-phone", "Samsung" for "galaxy").
3. Determine if it's a "Duplicate" of an existing major brand.
4. Return a strict JSON object:
{
  "categorySuggestion": "...",
  "brandSuggestion": "...",
  "confidence": 0.95,
  "explanation": "Brief reasoning",
  "isDuplicate": boolean
}`;
    }

    static buildModelPrompt(name: string, brandContext?: string): string {
        return `Analyze the following model name suggestion for an electronics marketplace:
Suggestion: "${name}"
${brandContext ? `Brand Context: "${brandContext}"` : ''}

Rules:
1. Identify the most likely "Category".
2. Identify the canonical "Brand".
3. Identify the canonical "Model" name (without storage/color variants).
4. Detect if this is a "Variant" of a model (e.g., "iPhone 15 Pro 256GB" is a variant of "iPhone 15 Pro").
5. Extract variant attributes (storage, ram, color) if present.
6. Return a strict JSON object:
{
  "categorySuggestion": "...",
  "brandSuggestion": "...",
  "modelSuggestion": "...",
  "variantSuggestion": "...",
  "variantAttributes": { "storage": "...", "ram": "..." },
  "confidence": 0.95,
  "explanation": "Brief reasoning",
  "isVariant": boolean
}`;
    }
}
