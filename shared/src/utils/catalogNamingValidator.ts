const POLLUTION_PATTERNS = [
    /<script[\s>]/i,
    /<\/?[a-z][\s\S]*>/i,
    /error type/i,
    /error message/i,
    /build output/i,
    /next\.js version/i,
    /stack trace/i,
    /console error/i,
    /at\s+[\w$.<>]+\s*\([^)]*:\d+:\d+\)/i,
    /webpack|turbopack|vite/i,
];

export function hasCatalogPollution(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return POLLUTION_PATTERNS.some((pattern) => pattern.test(value));
}

export function assertCleanCatalogText(field: string, value: unknown): void {
    if (hasCatalogPollution(value)) {
        throw new Error(`${field} contains disallowed markup, stack trace, or runtime/build error content`);
    }
}

export interface CatalogValidator {
    validate(name: string, requestType: 'brand' | 'model'): { ok: boolean; reason?: string };
}

export class CharacterValidator implements CatalogValidator {
    validate(name: string): { ok: boolean; reason?: string } {
        if (/^[^a-zA-Z0-9]+$/.test(name)) {
            return { ok: false, reason: 'Name cannot consist only of special characters or punctuation.' };
        }
        return { ok: true };
    }
}

export class LengthValidator implements CatalogValidator {
    validate(name: string): { ok: boolean; reason?: string } {
        const val = (name || '').trim();
        if (val.length < 2) {
            return { ok: false, reason: 'Name must be at least 2 characters long.' };
        }
        if (val.length > 100) {
            return { ok: false, reason: 'Name cannot exceed 100 characters.' };
        }
        return { ok: true };
    }
}

export class SpamValidator implements CatalogValidator {
    validate(name: string): { ok: boolean; reason?: string } {
        const lower = name.toLowerCase().trim();
        
        // Match keyboard mashing sequences
        const mashingPatterns = [
            /^[asdfghjkl\s]+$/i,
            /^[qwertyuiop\s]+$/i,
            /^[zxcvbnm\s]+$/i,
            /^(.)\1{4,}$/ // Repetitive characters: aaaaaa
        ];
        
        if (mashingPatterns.some((pattern) => pattern.test(lower)) && lower.length >= 6) {
            return { ok: false, reason: 'Keyboard mashing or repetitive characters detected.' };
        }

        // Repetitive symbols
        if (/^[._\-+$#%*@&!]+$/.test(lower) || /^[.\-_+$#%*@&!]{2,}$/.test(lower)) {
            return { ok: false, reason: 'Invalid character repetition or symbols detected.' };
        }

        // Pure numbers length constraint
        if (/^[0-9]+$/.test(lower) && lower.length >= 8) {
            return { ok: false, reason: 'Name cannot consist of long sequences of numbers only.' };
        }

        // Content security pollution check
        if (hasCatalogPollution(name)) {
            return { ok: false, reason: 'Disallowed characters, markup, or script patterns detected.' };
        }

        return { ok: true };
    }
}

export class ReservedWordValidator implements CatalogValidator {
    validate(name: string): { ok: boolean; reason?: string } {
        const reserved = ['null', 'undefined', 'system', 'admin', 'moderator', 'root', 'anonymous'];
        if (reserved.includes(name.toLowerCase().trim())) {
            return { ok: false, reason: 'Name contains a reserved system word.' };
        }
        return { ok: true };
    }
}

const VALIDATOR_PIPELINE: CatalogValidator[] = [
    new LengthValidator(),
    new CharacterValidator(),
    new SpamValidator(),
    new ReservedWordValidator()
];

export class CatalogValidationServiceShared {
    public static validateCatalogInput(options: {
        name: string;
        requestType: 'brand' | 'model';
    }): { ok: boolean; reason?: string } {
        const name = (options.name || '').trim();
        for (const validator of VALIDATOR_PIPELINE) {
            const res = validator.validate(name, options.requestType);
            if (!res.ok) return res;
        }
        return { ok: true };
    }
}
