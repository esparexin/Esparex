import { MAX_AD_TITLE_CHARS } from "@esparex/contracts";

export interface AiGenerationContext {
    brand: string;
    model: string;
    category: string;
    condition: string;
    powerStatus?: string;
    workingParts: string;
}

export function createAiContextSignature(context: AiGenerationContext): string {
    const parts = context.workingParts ? context.workingParts.split(',').map(p => p.trim()).sort() : [];
    return `brand:${context.brand}|model:${context.model}|cat:${context.category}|cond:${context.condition}|power:${context.powerStatus || ''}|parts:${parts.join(',')}`;
}

export function buildSmartTitle(
    context: { brand: string; model: string; category: string; condition: string; workingParts: string },
    variantIndex = 0
): string {
    const condLabel = context.condition === 'power_on'
        ? 'Working Condition'
        : context.condition === 'power_off'
          ? 'Power Off'
          : context.condition !== 'device' ? context.condition : '';

    const parts = [context.brand, context.model].filter(Boolean);
    const base = parts.length > 0 ? parts.join(' ') : context.category;

    const variants: string[] = [];

    // Variant 0: High-intent SEO Headline: [Brand] [Model] - [Condition]
    if (condLabel) {
        variants.push(`${base} - ${condLabel}`);
    } else {
        variants.push(`${base} for Sale`);
    }

    // Variant 1: Parts / Repair focus when power off or parts provided
    if (context.workingParts) {
        const topParts = context.workingParts.split(',').slice(0, 2).map(p => p.trim()).join(' & ');
        variants.push(`${base} - Working ${topParts}`);
    } else if (context.condition === 'power_off') {
        variants.push(`Used ${base} - For Spare Parts / Repair`);
    } else {
        variants.push(`Used ${base} (${context.category})`);
    }

    // Variant 2: Clean Category-Qualified Specification
    variants.push(`${base} (${context.category}) - ${condLabel || 'Genuine'}`);

    const index = Math.abs(variantIndex) % (variants.length || 1);
    const selectedVariant = variants[index] ?? variants[0] ?? base;
    return selectedVariant.slice(0, MAX_AD_TITLE_CHARS);
}
