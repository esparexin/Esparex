/**
 * @deprecated Text/phone moderation rules are merged into the moderation domain
 * pipeline (P1-7). Canonical: `moderateText` in
 * `core/src/domains/moderation/pipeline/TextModerationService.ts`, with
 * phone-number detection via the single `@esparex/shared` primitive
 * (`containsPhoneNumber`, D-04).
 *
 * This module is a compatibility shim preserving the legacy public surface
 * (`ModerationResult`, `moderateContent`, `moderateImages`) with identical
 * behavior. It will be deleted in Phase 4 (DECISION-GATE §4). New code must
 * import from the moderation domain instead.
 */
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';
import {
    moderateText,
    type TextModerationResult,
} from '../../domains/moderation/pipeline/TextModerationService';

/* ────────────────────────────────────────────── */
/* MODERATION SERVICE (legacy compatibility shim) */
/* ────────────────────────────────────────────── */

export type ModerationResult = TextModerationResult;

export const moderateContent = async (text: string): Promise<ModerationResult> => {
    // Global toggle, exactly as before — now passed into the canonical pipeline.
    const config = await getSystemConfigDoc();
    const isAiEnabled = config?.ai?.moderation?.enabled ?? true;
    return moderateText(text, isAiEnabled);
};

// Placeholder for Image Moderation (Future Integration)
export const moderateImages = (imageUrls: string[]): ModerationResult => {
    // For MVP, we pass. Real impl would call Vision API.
    if (!imageUrls || imageUrls.length === 0) {
        return { action: 'auto_approved', score: 0, isSuspicious: false };
    }
    return { action: 'auto_approved', score: 0, isSuspicious: false };
};
