/**
 * Canonical text-moderation rules (P1-7).
 *
 * Merges the text / phone-number / prohibited-keyword rules from the legacy
 * `core/src/services/lifecycle/ModerationService.ts` into the moderation
 * domain pipeline (DECISION-GATE §3: the moderation domain owns moderation).
 *
 * Phone-number detection uses the single canonical primitive
 * `containsPhoneNumber` from `@esparex/shared` (D-04) — the legacy service's
 * own `PHONE_REGEX` and the chat `PHONE_REGEX` are both retired in favor of it.
 *
 * The domain stays free of persistence imports: the global AI-moderation
 * toggle is supplied by the caller (the legacy compatibility wrapper reads it
 * from the system config document, exactly as before).
 */
import { containsPhoneNumber } from '@esparex/shared';

export interface TextModerationResult {
    action: 'auto_approved' | 'held_for_review' | 'rejected';
    reason?: string;
    score: number;
    isSuspicious: boolean;
}

const WHATSAPP_PATTERN = /(whatsapp|wa\.me)/i;
const BASE_PROHIBITED_KEYWORDS = ['weapon', 'drug', 'gun', 'casino', 'betting', 'escort'];

/**
 * Applies the canonical text-moderation rules to `text`.
 *
 * Rule order and outcomes are preserved from the legacy implementation:
 * 0. global AI-moderation toggle off → held_for_review (score 60)
 * 1. phone number / WhatsApp contact info → held_for_review (score 60)
 * 2. prohibited keyword → held_for_review (score 70)
 * 3. otherwise → auto_approved (score 0)
 */
export async function moderateText(
    text: string,
    isAiModerationEnabled = true
): Promise<TextModerationResult> {
    // 0. Global toggle (supplied by the caller; persistence stays outside the domain)
    if (!isAiModerationEnabled) {
        return {
            action: 'held_for_review',
            reason: 'AI Moderation is globally disabled',
            score: 60,
            isSuspicious: true
        };
    }

    // 1. Contact-scrape protection (canonical phone primitive + WhatsApp hints)
    if (containsPhoneNumber(text) || WHATSAPP_PATTERN.test(text)) {
        return {
            action: 'held_for_review',
            reason: 'Contains phone number or contact info',
            score: 60,
            isSuspicious: true
        };
    }

    // 2. Base prohibited content (hardcoded safety list, as before)
    const lower = text.toLowerCase();
    for (const keyword of BASE_PROHIBITED_KEYWORDS) {
        if (lower.includes(keyword)) {
            return {
                action: 'held_for_review',
                reason: `Contains prohibited keyword: ${keyword}`,
                score: 70,
                isSuspicious: true
            };
        }
    }

    return { action: 'auto_approved', score: 0, isSuspicious: false };
}
