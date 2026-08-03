/**
 * Moderation Feature Flags (PR 7 — Operational Controls)
 *
 * Provides runtime toggles for enabling/disabling the moderation pipeline
 * or individual pipeline stages (Stage 1 pre-filtering, Stage 2 vision, Stage 3 OCR).
 */

export interface ModerationFeatureFlagConfig {
    enabled?: boolean;
    stage1Enabled?: boolean;
    stage2Enabled?: boolean;
    stage3OcrEnabled?: boolean;
}

export class ModerationFeatureFlags {
    private flags: Required<ModerationFeatureFlagConfig>;

    constructor(initialFlags: ModerationFeatureFlagConfig = {}) {
        this.flags = {
            enabled: initialFlags.enabled ?? true,
            stage1Enabled: initialFlags.stage1Enabled ?? true,
            stage2Enabled: initialFlags.stage2Enabled ?? true,
            stage3OcrEnabled: initialFlags.stage3OcrEnabled ?? true,
        };
    }

    /**
     * Checks if overall AI moderation is enabled.
     */
    isModerationEnabled(): boolean {
        return this.flags.enabled;
    }

    /**
     * Checks if Stage 1 Pre-filtering is enabled.
     */
    isStage1Enabled(): boolean {
        return this.flags.enabled && this.flags.stage1Enabled;
    }

    /**
     * Checks if Stage 2 AI Vision Moderation is enabled.
     */
    isStage2Enabled(): boolean {
        return this.flags.enabled && this.flags.stage2Enabled;
    }

    /**
     * Checks if Stage 3 Intelligence (OCR / Contact Detection) is enabled.
     */
    isStage3OcrEnabled(): boolean {
        return this.flags.enabled && this.flags.stage3OcrEnabled;
    }

    /**
     * Dynamically updates feature flag settings at runtime.
     */
    updateFlags(updates: Partial<ModerationFeatureFlagConfig>): void {
        this.flags = { ...this.flags, ...updates };
    }

    /**
     * Returns a snapshot of current feature flag configuration.
     */
    getSnapshot(): Required<ModerationFeatureFlagConfig> {
        return { ...this.flags };
    }
}
