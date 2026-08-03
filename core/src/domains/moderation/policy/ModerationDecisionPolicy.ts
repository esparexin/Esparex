/**
 * Moderation Decision Policy (PR 5 — Decoupled Policy Engine)
 *
 * Evaluates raw AI vision scores against configurable action thresholds (REJECT / FLAG / APPROVE).
 * Kept isolated from the ImageModerationOrchestrator to allow independent policy evolution.
 */
import { ImageModerationResponse } from '../../../services/ai/moderation/types';

export type ModerationAction = 'APPROVE' | 'FLAG' | 'REJECT';

export interface DecisionPolicyConfig {
    rejectThreshold?: number; // Default 0.8
    flagThreshold?: number;   // Default 0.5
}

export interface ModerationDecision {
    action: ModerationAction;
    reason?: string;
    highestScore: number;
}

export class ModerationDecisionPolicy {
    private rejectThreshold: number;
    private flagThreshold: number;

    constructor(config: DecisionPolicyConfig = {}) {
        this.rejectThreshold = config.rejectThreshold ?? 0.8;
        this.flagThreshold = config.flagThreshold ?? 0.5;
    }

    /**
     * Evaluates provider classification scores and returns actionable decision.
     */
    evaluate(response: ImageModerationResponse): ModerationDecision {
        const highestScore = Math.max(
            response.adultScore,
            response.violenceScore,
            response.racyScore,
            response.goreScore
        );

        if (highestScore >= this.rejectThreshold) {
            return {
                action: 'REJECT',
                reason: 'EXCEEDS_REJECT_THRESHOLD',
                highestScore,
            };
        }

        if (highestScore >= this.flagThreshold) {
            return {
                action: 'FLAG',
                reason: 'EXCEEDS_FLAG_THRESHOLD',
                highestScore,
            };
        }

        return {
            action: 'APPROVE',
            highestScore,
        };
    }
}
