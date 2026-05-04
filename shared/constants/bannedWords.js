"use strict";
/**
 * Centralized Banned Words & Content Rules
 * Used across frontend and backend for consistent text validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODERATION_CATEGORIES = exports.HARD_REJECT_CATEGORIES = exports.TEXT_QUALITY_RULES = exports.GIBBERISH_PATTERNS = exports.ALL_BANNED_WORDS = exports.BANNED_WORDS = void 0;
// Prohibited content categories
exports.BANNED_WORDS = {
    // Adult/Explicit content
    adult: [
        'porn', 'xxx', 'nude', 'naked', 'sex', 'escort', 'prostitute',
        'onlyfans', 'webcam', 'erotic', 'adult content', 'nsfw'
    ],
    // Weapons & Violence
    weapons: [
        'gun', 'rifle', 'pistol', 'firearm', 'ammunition', 'ammo',
        'explosive', 'bomb', 'grenade', 'weapon', 'knife attack'
    ],
    // Drugs & Illegal substances
    drugs: [
        'cocaine', 'heroin', 'meth', 'marijuana', 'weed', 'cannabis',
        'drug dealer', 'narcotics', 'pills for sale'
    ],
    // Scam/Fraud indicators
    scam: [
        'make money fast', 'get rich quick', 'wire transfer',
        'western union', 'bitcoin payment only', 'crypto only',
        'advance payment', 'pay before delivery', 'lottery winner',
        'nigerian prince', 'inheritance claim'
    ],
    // Hate speech / Discrimination
    hate: [
        'kill all', 'death to', 'terrorist', 'bomb threat'
    ],
    // Counterfeit / Illegal goods
    counterfeit: [
        'fake id', 'fake passport', 'forged document', 'replica rolex',
        'counterfeit', 'stolen goods', 'black market'
    ]
};
// Flatten all banned words into a single array (lowercase)
exports.ALL_BANNED_WORDS = Object.values(exports.BANNED_WORDS)
    .flat()
    .map(word => word.toLowerCase());
// Gibberish detection patterns
exports.GIBBERISH_PATTERNS = {
    // Repeated consonants without vowels (e.g., "bllb", "jfhfhf")
    noVowelSequence: /\b[bcdfghjklmnpqrstvwxyz]{4,}\b/i,
    // Same character repeated 4+ times (e.g., "aaaa", "!!!!")
    repeatedChar: /(.)\1{3,}/,
    // Random keyboard mash patterns
    keyboardMash: /\b[qwerty]{5,}\b|\b[asdfgh]{5,}\b|\b[zxcvbn]{5,}\b/i,
    // All caps gibberish (but allow legit acronyms like "LED", "USB")
    allCapsGibberish: /\b[A-Z]{8,}\b/,
    // Mixed numbers and letters with no meaning (e.g., "abc123def456")
    randomAlphaNum: /\b(?:[a-z]+\d+){3,}\b/i
};
// Minimum content quality thresholds
exports.TEXT_QUALITY_RULES = {
    // Minimum vowel ratio for meaningful text (helps detect gibberish)
    minVowelRatio: 0.15,
    // Maximum consecutive consonants allowed
    maxConsecutiveConsonants: 5,
    // Minimum word length for single-word inputs
    minWordLength: 2,
    // Maximum repeated word ratio (spam detection)
    maxRepeatedWordRatio: 0.5
};
// Categories that should trigger immediate rejection
exports.HARD_REJECT_CATEGORIES = ['adult', 'weapons', 'drugs', 'hate'];
// Categories that should flag for moderation
exports.MODERATION_CATEGORIES = ['scam', 'counterfeit'];
//# sourceMappingURL=bannedWords.js.map