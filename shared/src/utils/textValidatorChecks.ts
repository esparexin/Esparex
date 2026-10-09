/**
 * Text validation check primitives (banned words, gibberish, quality).
 * Pure functions consumed by the validateText orchestrator in textValidator.ts.
 */

import {
    BANNED_WORDS,
    GIBBERISH_PATTERNS,
    TEXT_QUALITY_RULES,
    HARD_REJECT_CATEGORIES,
    MODERATION_CATEGORIES,
} from '../constants/bannedWords';
import type { TextValidationIssue } from './textValidatorTypes';

/**
 * Check for banned words in text
 */
export function checkBannedWords(text: string): TextValidationIssue[] {
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
                    category: category as TextValidationIssue['category'],
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
export function checkGibberish(text: string): TextValidationIssue[] {
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
export function checkQuality(text: string): TextValidationIssue[] {
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
export function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
