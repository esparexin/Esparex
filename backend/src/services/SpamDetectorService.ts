import { validateText, type TextValidationResult } from '../../../shared/utils/textValidator';

export interface SpamDetectionResult {
    isSpam: boolean;
    score: number;
    reason?: string;
    action?: TextValidationResult['action'];
    issues?: TextValidationResult['issues'];
}

/**
 * Spam Detector Service
 * Integrates with centralized text validator for comprehensive checks
 * Relies entirely on the single source of truth in shared/utils/textValidator
 */
export const detectSpam = (text: string): SpamDetectionResult => {
    if (!text) {
        return { isSpam: false, score: 0 };
    }

    // 1. Run centralized text validation (banned words, gibberish, quality)
    const textValidation = validateText(text, {
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
        allowEmpty: true
    });

    const reasons = textValidation.issues.map(issue => issue.message);

    return {
        isSpam: textValidation.score >= 60 || textValidation.action === 'reject',
        score: textValidation.score,
        reason: reasons.length > 0 ? reasons.join(' | ') : undefined,
        action: textValidation.action,
        issues: textValidation.issues
    };
};
