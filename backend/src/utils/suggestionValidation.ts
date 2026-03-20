// backend/src/utils/suggestionValidation.ts

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    cleanName: string;
}

/**
 * Common regex patterns
 */
const URL_PATTERN = /https?:\/\/[^\s]+|\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/i;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
// Basic emojis (covers modern unicode ranges)
const EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
const REPEATED_CHARS_PATTERN = /([a-z0-9])\1{4,}/; // Matches 5 or more of the SAME alphanumeric character in a row (expect lowercase input)
const NUMBERS_ONLY_PATTERN = /^\s*[\d\s.-]+\s*$/; // Checks if string is purely numbers, spaces, dots, hyphens

/**
 * Core cleaning function that runs before validation
 */
function cleanInput(input: string, allowedPattern: RegExp): string {
    // 1. Trim leading/trailing spaces
    // 2. Convert multiple spaces into a single space
    let cleaned = input.trim().replace(/\s+/g, ' ');

    // 3. Remove unwanted symbols by keeping only allowed ones
    // allowedPattern matches what is PERMITTED. We want to strip what is NOT permitted.
    // Instead of stripping manually, we'll strip anything not matching our allowed characters
    const stripDisallowed = new RegExp(`[^${allowedPattern.source}]`, 'gi');
    cleaned = cleaned.replace(stripDisallowed, '');

    // Cleanup any extra spaces that might have formed from stripping inner chars
    return cleaned.trim().replace(/\s+/g, ' ');
}

/**
 * Auto-format function (Capitalize words, remove double hyphens)
 */
function autoFormat(input: string): string {
    return input
        // Remove double hyphens/dots
        .replace(/-{2,}/g, '-')
        .replace(/\.{2,}/g, '.')
        .toLowerCase()
        // Capitalize first letter of every word (split by space or hyphen or dot)
        .replace(/\b[a-z]/g, char => char.toUpperCase());
}

/**
 * Shared spam checks (URLs, emails, phones, emojis, >70% special chars)
 */
function hasSpamCharacteristics(input: string, originalInput: string): string | null {
    if (EMOJI_PATTERN.test(originalInput)) return 'Emojis are not allowed.';
    if (URL_PATTERN.test(input) || URL_PATTERN.test(originalInput)) return 'URLs and links are not allowed.';
    if (EMAIL_PATTERN.test(input) || EMAIL_PATTERN.test(originalInput)) return 'Email addresses are not allowed.';
    if (PHONE_PATTERN.test(input) || PHONE_PATTERN.test(originalInput)) return 'Phone numbers are not allowed.';

    // Check ratio of special chars to total length (excluding spaces)
    const noSpaceInput = input.replace(/\s/g, '');
    if (noSpaceInput.length > 0) {
        const specialChars = noSpaceInput.replace(/[a-zA-Z0-9]/g, '');
        if (specialChars.length / noSpaceInput.length > 0.7) {
            return 'Too many special characters.';
        }
    }

    if (REPEATED_CHARS_PATTERN.test(input.toLowerCase())) {
        return 'Too many repeated characters.';
    }

    return null; // Passes spam check
}

/**
 * Validates and cleans a Brand Suggestion
 * Allowed: Letters, Numbers, Space, Hyphen, Slash, Dot, Plus
 */
export function validateBrandSuggestion(input: string): ValidationResult {
    if (!input || typeof input !== 'string') {
        return { isValid: false, error: 'Name is required.', cleanName: '' };
    }

    // Capture original for strict spam testing before cleaning strips it out
    const originalInput = input;

    // 1. Basic Cleaning
    // Allowed: A-Z, a-z, 0-9, \s, -, /, ., +
    // We escape the hyphen to be safe in the character class
    let cleanName = cleanInput(input, /[a-zA-Z0-9\s\-\/\.\+]/);

    // 2. Extra Spam Protection (Run on original and cleaned)
    const spamError = hasSpamCharacteristics(cleanName, originalInput);
    if (spamError) return { isValid: false, error: spamError, cleanName };

    // 3. Length Checks
    if (cleanName.length < 2) return { isValid: false, error: 'Brand name must be at least 2 characters long.', cleanName };
    if (cleanName.length > 40) return { isValid: false, error: 'Brand name cannot exceed 40 characters.', cleanName };

    // 4. Specific Rules
    if (NUMBERS_ONLY_PATTERN.test(cleanName)) {
        return { isValid: false, error: 'Brand name cannot be numbers only.', cleanName };
    }

    // 5. Auto Format
    cleanName = autoFormat(cleanName);

    return { isValid: true, cleanName };
}

/**
 * Validates and cleans a Model Name Suggestion
 * Allowed: Letters, Numbers, Space, Hyphen, Plus
 */
export function validateModelSuggestion(input: string): ValidationResult {
    if (!input || typeof input !== 'string') {
        return { isValid: false, error: 'Name is required.', cleanName: '' };
    }

    const originalInput = input;

    // 1. Basic Cleaning
    // Allowed: A-Z, a-z, 0-9, \s, -, +
    // Wait: if a user types S24.5/Plus it strips . and / leaving S245Plus which is correct per rules,
    // but we can make it safer by replacing disallowed chars with a space first, then cleaning.
    const strippedCharsToSpaces = input.replace(/[^a-zA-Z0-9\s\-\+]/gi, ' ');
    let cleanName = cleanInput(strippedCharsToSpaces, /[a-zA-Z0-9\s\-\+]/);

    // 2. Extra Spam Protection
    const spamError = hasSpamCharacteristics(cleanName, originalInput);
    if (spamError) return { isValid: false, error: spamError, cleanName };

    // 3. Length Checks
    if (cleanName.length < 2) return { isValid: false, error: 'Model name must be at least 2 characters long.', cleanName };
    if (cleanName.length > 50) return { isValid: false, error: 'Model name cannot exceed 50 characters.', cleanName };

    // 5. Auto Format
    cleanName = autoFormat(cleanName);

    return { isValid: true, cleanName };
}

