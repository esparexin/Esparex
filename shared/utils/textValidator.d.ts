/**
 * Centralized Text Validator
 * Single source of truth for text field validation across frontend & backend
 */
import { BANNED_WORDS, ALL_BANNED_WORDS, GIBBERISH_PATTERNS, TEXT_QUALITY_RULES, type BannedCategory } from '../constants/bannedWords';
export interface TextValidationResult {
    isValid: boolean;
    score: number;
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
    strictMode?: boolean;
}
/**
 * Main validation function - use this in schemas and middleware
 */
export declare function validateText(text: string, options?: TextValidationOptions): TextValidationResult;
/**
 * Quick check - returns true if text is acceptable
 */
export declare function isTextValid(text: string, options?: TextValidationOptions): boolean;
/**
 * Get human-readable error message
 */
export declare function getValidationError(result: TextValidationResult): string | null;
export { BANNED_WORDS, ALL_BANNED_WORDS, GIBBERISH_PATTERNS, TEXT_QUALITY_RULES };
//# sourceMappingURL=textValidator.d.ts.map