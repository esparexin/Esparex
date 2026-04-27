"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSpam = void 0;
const textValidator_1 = require("@shared/utils/textValidator");
/**
 * Spam Detector Service
 * Integrates with centralized text validator for comprehensive checks
 * Relies entirely on the single source of truth in shared/utils/textValidator
 */
const detectSpam = (text) => {
    if (!text) {
        return { isSpam: false, score: 0 };
    }
    // 1. Run centralized text validation (banned words, gibberish, quality)
    const textValidation = (0, textValidator_1.validateText)(text, {
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
exports.detectSpam = detectSpam;
//# sourceMappingURL=SpamDetectorService.js.map