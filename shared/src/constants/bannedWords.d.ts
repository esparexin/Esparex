/**
 * Centralized Banned Words & Content Rules
 * Used across frontend and backend for consistent text validation
 */
export declare const BANNED_WORDS: {
    readonly adult: readonly ["porn", "xxx", "nude", "naked", "sex", "escort", "prostitute", "onlyfans", "webcam", "erotic", "adult content", "nsfw"];
    readonly weapons: readonly ["gun", "rifle", "pistol", "firearm", "ammunition", "ammo", "explosive", "bomb", "grenade", "weapon", "knife attack"];
    readonly drugs: readonly ["cocaine", "heroin", "meth", "marijuana", "weed", "cannabis", "drug dealer", "narcotics", "pills for sale"];
    readonly scam: readonly ["make money fast", "get rich quick", "wire transfer", "western union", "bitcoin payment only", "crypto only", "advance payment", "pay before delivery", "lottery winner", "nigerian prince", "inheritance claim"];
    readonly hate: readonly ["kill all", "death to", "terrorist", "bomb threat"];
    readonly counterfeit: readonly ["fake id", "fake passport", "forged document", "replica rolex", "counterfeit", "stolen goods", "black market"];
};
export declare const ALL_BANNED_WORDS: string[];
export declare const GIBBERISH_PATTERNS: {
    readonly noVowelSequence: RegExp;
    readonly repeatedChar: RegExp;
    readonly keyboardMash: RegExp;
    readonly allCapsGibberish: RegExp;
    readonly randomAlphaNum: RegExp;
};
export declare const TEXT_QUALITY_RULES: {
    readonly minVowelRatio: 0.15;
    readonly maxConsecutiveConsonants: 5;
    readonly minWordLength: 2;
    readonly maxRepeatedWordRatio: 0.5;
};
export declare const HARD_REJECT_CATEGORIES: readonly ["adult", "weapons", "drugs", "hate"];
export declare const MODERATION_CATEGORIES: readonly ["scam", "counterfeit"];
export type BannedCategory = keyof typeof BANNED_WORDS;
//# sourceMappingURL=bannedWords.d.ts.map