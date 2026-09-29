/**
 * Text validator domain types.
 * Extracted from textValidator.ts so the orchestrator and check modules
 * share a single type owner without circular imports.
 */

import type { BannedCategory } from '../constants/bannedWords';

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
