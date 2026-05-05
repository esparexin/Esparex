/**
 * Centralized Text Validator
 * Single source of truth for text field validation across frontend & backend
 */

import {
    BANNED_WORDS,
    ALL_BANNED_WORDS,
    GIBBERISH_PATTERNS,
    TEXT_QUALITY_RULES,
    HARD_REJECT_CATEGORIES,
    MODERATION_CATEGORIES,
    type BannedCategory
} from '../constants/bannedWords';

export interface TextValidationResult {
    isValid: boolean;
    score: number; // 0-100, higher = more problematic
    issues: TextValidationIssue[];
    action: 'allow' | 'flag' | 'moderate' | 'reject';
}

export interface TextValidationIssue {
    type: 'banned_word' | 'gibberish' | 'quality' | 'spam';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category?: BannedCategory;
    matchedText?: string;
}

export interface TextValidationOptions {
    allowEmpty?: boolean;
    minLength?: number;
    maxLength?: number;
    checkBannedWords?: boolean;
    checkGibberish?: boolean;
    checkQuality?: boolean;
    strictMode?: boolean; // If true, flag becomes reject
}

const DEFAULT_OPTIONS: TextValidationOptions = {
    allowEmpty: false,
    minLength: 1,
    maxLength: 10000,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true,
    strictMode: false
};

/**
 * Check for banned words in text
 */
function checkBannedWords(text: string): TextValidationIssue[] {
    const issues: TextValidationIssue[] = [];
    const lowerText = text.toLowerCase();

    for (const [category, words] of Object.entries(BANNED_WORDS)) {
        for (const word of words) {
            // Use word boundary matching for accuracy
            const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
            if (regex.test(lowerText)) {
                const isHardReject = HARD_REJECT_CATEGORIES.includes(category as typeof HARD_REJECT_CATEGORIES[number]);
                const isModeration = MODERATION_CATEGORIES.includes(category as typeof MODERATION_CATEGORIES[number]);

                issues.push({
                    type: 'banned_word',
                    message: `Prohibited content detected: ${category}`,
                    severity: isHardReject ? 'critical' : isModeration ? 'high' : 'medium',
                    category: category as BannedCategory,
                    matchedText: word
                });
            }
        }
    }

    return issues;
}

/**
 * Check for gibberish patterns
 */
function checkGibberish(text: string): TextValidationIssue[] {
    const issues: TextValidationIssue[] = [];

    // Check no-vowel sequences
    if (GIBBERISH_PATTERNS.noVowelSequence.test(text)) {
        const matches = text.match(GIBBERISH_PATTERNS.noVowelSequence);
        issues.push({
            type: 'gibberish',
            message: 'Text contains consonant-only sequences',
            severity: 'medium',
            matchedText: matches?.[0]
        });
    }

    // Check repeated characters
    if (GIBBERISH_PATTERNS.repeatedChar.test(text)) {
        issues.push({
            type: 'gibberish',
            message: 'Text contains excessive repeated characters',
            severity: 'low'
        });
    }

    // Check keyboard mash
    if (GIBBERISH_PATTERNS.keyboardMash.test(text)) {
        const matches = text.match(GIBBERISH_PATTERNS.keyboardMash);
        issues.push({
            type: 'gibberish',
            message: 'Text appears to be keyboard mashing',
            severity: 'medium',
            matchedText: matches?.[0]
        });
    }

    // Check vowel ratio for meaningful text
    const vowelCount = (text.match(/[aeiou]/gi) || []).length;
    const letterCount = (text.match(/[a-z]/gi) || []).length;
    if (letterCount > 10) {
        const vowelRatio = vowelCount / letterCount;
        if (vowelRatio < TEXT_QUALITY_RULES.minVowelRatio) {
            issues.push({
                type: 'gibberish',
                message: 'Text has unusually low vowel ratio (likely gibberish)',
                severity: 'medium'
            });
        }
    }

    return issues;
}

/**
 * Check text quality (spam patterns, repetition)
 */
function checkQuality(text: string): TextValidationIssue[] {
    const issues: TextValidationIssue[] = [];
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    if (words.length > 3) {
        // Check for repeated words (spam indicator)
        const wordCounts = new Map<string, number>();
        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }

        const maxRepeats = Math.max(...wordCounts.values());
        const repeatedRatio = maxRepeats / words.length;

        if (repeatedRatio > TEXT_QUALITY_RULES.maxRepeatedWordRatio) {
            issues.push({
                type: 'spam',
                message: 'Text contains excessive word repetition',
                severity: 'medium'
            });
        }
    }

    // Check for ALL CAPS abuse (more than 50% caps in text > 20 chars)
    if (text.length > 20) {
        const upperCount = (text.match(/[A-Z]/g) || []).length;
        const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
        if (letterCount > 0 && upperCount / letterCount > 0.7) {
            issues.push({
                type: 'quality',
                message: 'Excessive use of capital letters',
                severity: 'low'
            });
        }
    }

    return issues;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate action based on issues
 */
function determineAction(issues: TextValidationIssue[], strictMode: boolean): TextValidationResult['action'] {
    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasHigh = issues.some(i => i.severity === 'high');
    const hasMedium = issues.some(i => i.severity === 'medium');

    if (hasCritical) return 'reject';
    if (hasHigh) return strictMode ? 'reject' : 'moderate';
    if (hasMedium) return strictMode ? 'moderate' : 'flag';
    if (issues.length > 0) return 'flag';

    return 'allow';
}

/**
 * Calculate overall score (0-100)
 */
function calculateScore(issues: TextValidationIssue[]): number {
    let score = 0;

    for (const issue of issues) {
        switch (issue.severity) {
            case 'critical': score += 50; break;
            case 'high': score += 30; break;
            case 'medium': score += 15; break;
            case 'low': score += 5; break;
        }
    }

    return Math.min(100, score);
}

/**
 * Main validation function - use this in schemas and middleware
 */
export function validateText(
    text: string,
    options: TextValidationOptions = {}
): TextValidationResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const issues: TextValidationIssue[] = [];

    // Handle empty text
    if (!text || text.trim().length === 0) {
        if (opts.allowEmpty) {
            return { isValid: true, score: 0, issues: [], action: 'allow' };
        }
        return {
            isValid: false,
            score: 100,
            issues: [{
                type: 'quality',
                message: 'Text cannot be empty',
                severity: 'high'
            }],
            action: 'reject'
        };
    }

    const trimmedText = text.trim();

    // Length checks
    if (opts.minLength && trimmedText.length < opts.minLength) {
        issues.push({
            type: 'quality',
            message: `Text must contain at least ${opts.minLength} characters`,
            severity: 'critical'
        });
    }

    if (opts.maxLength && trimmedText.length > opts.maxLength) {
        issues.push({
            type: 'quality',
            message: `Text must be at most ${opts.maxLength} characters`,
            severity: 'critical'
        });
    }

    // Run content checks
    if (opts.checkBannedWords) {
        issues.push(...checkBannedWords(trimmedText));
    }

    if (opts.checkGibberish) {
        issues.push(...checkGibberish(trimmedText));
    }

    if (opts.checkQuality) {
        issues.push(...checkQuality(trimmedText));
    }

    const score = calculateScore(issues);
    const action = determineAction(issues, opts.strictMode ?? false);

    return {
        isValid: action === 'allow' || action === 'flag',
        score,
        issues,
        action
    };
}

/**
 * Quick check - returns true if text is acceptable
 */
export function isTextValid(text: string, options?: TextValidationOptions): boolean {
    return validateText(text, options).isValid;
}

/**
 * Get human-readable error message
 */
export function getValidationError(result: TextValidationResult): string | null {
    if (result.isValid) return null;

    const critical = result.issues.find(i => i.severity === 'critical');
    if (critical) return critical.message;

    const high = result.issues.find(i => i.severity === 'high');
    if (high) return high.message;

    return result.issues[0]?.message || 'Text validation failed';
}

export { BANNED_WORDS, ALL_BANNED_WORDS, GIBBERISH_PATTERNS, TEXT_QUALITY_RULES };
