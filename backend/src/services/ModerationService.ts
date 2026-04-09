import { getSystemConfigDoc } from '../utils/systemConfigHelper';

/* ────────────────────────────────────────────── */
/* MODERATION SERVICE                             */
/* ────────────────────────────────────────────── */

export interface ModerationResult {
    action: 'auto_approved' | 'held_for_review' | 'rejected';
    reason?: string;
    score: number;
    isSuspicious: boolean;
}

const PHONE_REGEX = /(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\d{10}|\d{4}\s\d{3}\s\d{3}/g;
const WA_REGEX = /(whatsapp|wa\.me)/i;
const BASE_PROHIBITED_KEYWORDS = ['weapon', 'drug', 'gun', 'casino', 'betting', 'escort'];

export const moderateContent = async (text: string): Promise<ModerationResult> => {
    const lower = text.toLowerCase();

    // 0. Check Global toggle
    const config = await getSystemConfigDoc();
    const isAiEnabled = config?.ai?.moderation?.enabled ?? true;

    if (!isAiEnabled) {
        return {
            action: 'held_for_review',
            reason: 'AI Moderation is globally disabled',
            score: 60,
            isSuspicious: true
        };
    }

    // 1. Fetch Dynamic Rules from Database (REMOVED: Ghost Architecture Cleanup)
    /* 
       Dynamic rules for moderation have been temporarily removed 
       due to the decommissioning of the AutoModerationRule and KeywordBlacklist models.
       Basic safety checks remain below.
    */

    // 2. Base Contact Scrape Protection (Hardcoded Safety)
    if (PHONE_REGEX.test(text) || WA_REGEX.test(text)) {
        return {
            action: 'held_for_review',
            reason: 'Contains phone number or contact info',
            score: 60,
            isSuspicious: true
        };
    }

    // 3. Base Prohibited Content (Hardcoded Safety)
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
};

// Placeholder for Image Moderation (Future Integration)
export const moderateImages = async (imageUrls: string[]): Promise<ModerationResult> => {
    // For MVP, we pass. Real impl would call Vision API.
    if (!imageUrls || imageUrls.length === 0) {
        return { action: 'auto_approved', score: 0, isSuspicious: false };
    }
    return { action: 'auto_approved', score: 0, isSuspicious: false };
};
