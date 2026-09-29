/**
 * Centralized Text Validator
 * Single source of truth for text field validation across frontend & backend.
 * Orchestrator: combines check primitives from textValidatorChecks.ts.
 */

import type {
    TextValidationIssue,
    TextValidationOptions,
    TextValidationResult,
} from './textValidatorTypes';
import { checkBannedWords, checkGibberish, checkQuality } from './textValidatorChecks';

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

export { BANNED_WORDS, ALL_BANNED_WORDS, GIBBERISH_PATTERNS, TEXT_QUALITY_RULES } from '../constants/bannedWords';
