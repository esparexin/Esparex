/**
 * Centralized Banned Words & Content Rules
 * Used across frontend and backend for consistent text validation
 */

// Prohibited content categories
export const BANNED_WORDS = {
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
} as const;

// Flatten all banned words into a single array (lowercase)
export const ALL_BANNED_WORDS: string[] = Object.values(BANNED_WORDS)
    .flat()
    .map(word => word.toLowerCase());

// Gibberish detection patterns
export const GIBBERISH_PATTERNS = {
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
} as const;

// Minimum content quality thresholds
export const TEXT_QUALITY_RULES = {
    // Minimum vowel ratio for meaningful text (helps detect gibberish)
    minVowelRatio: 0.15,

    // Maximum consecutive consonants allowed
    maxConsecutiveConsonants: 5,

    // Minimum word length for single-word inputs
    minWordLength: 2,

    // Maximum repeated word ratio (spam detection)
    maxRepeatedWordRatio: 0.5
} as const;

// Categories that should trigger immediate rejection
export const HARD_REJECT_CATEGORIES = ['adult', 'weapons', 'drugs', 'hate'] as const;

// Categories that should flag for moderation
export const MODERATION_CATEGORIES = ['scam', 'counterfeit'] as const;

export type BannedCategory = keyof typeof BANNED_WORDS;
