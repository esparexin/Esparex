/**
 * Moderation Feature Flags Engine (PR 7)
 *
 * Enables gradual feature rollouts, dark launches, and emergency kill-switches:
 * - IMAGE_MODERATION
 * - OCR_DETECTION
 * - DUPLICATE_DETECTION
 * - AUTO_BLOCK
 */
export interface ModerationFlagsConfig {
    IMAGE_MODERATION: boolean;
    OCR_DETECTION: boolean;
    DUPLICATE_DETECTION: boolean;
    AUTO_BLOCK: boolean;
}

export const DEFAULT_MODERATION_FLAGS: ModerationFlagsConfig = {
    IMAGE_MODERATION: true,
    OCR_DETECTION: true,
    DUPLICATE_DETECTION: true,
    AUTO_BLOCK: true,
};

export class ModerationFeatureFlags {
    private flags: ModerationFlagsConfig;

    constructor(flags: ModerationFlagsConfig = DEFAULT_MODERATION_FLAGS) {
        this.flags = flags;
    }

    isEnabled(flag: keyof ModerationFlagsConfig): boolean {
        return !!this.flags[flag];
    }

    setFlag(flag: keyof ModerationFlagsConfig, value: boolean): void {
        this.flags[flag] = value;
    }
}
