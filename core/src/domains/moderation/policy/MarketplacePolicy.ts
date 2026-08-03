/**
 * Decoupled Marketplace Policy Engine (PR 3)
 *
 * Standalone domain service evaluating raw classifier scores and signals
 * to determine normalized RiskLevel and ModerationOutcome.
 * Zero vendor code or LLM API calls exist in this class.
 */
import {
    MODERATION_OUTCOME,
    RISK_LEVEL,
    MODERATION_REASON,
    ModerationOutcomeValue,
    RiskLevelValue,
    ModerationReasonValue,
    ModerationResultDTO,
    ModerationSignalDTO,
} from '@esparex/contracts';
import {
    MarketplacePolicyThresholds,
    DEFAULT_MARKETPLACE_POLICY_THRESHOLDS,
} from './policyConfig';

export interface PolicyEvaluationInput {
    adultScore: number;
    violenceScore: number;
    racyScore: number;
    goreScore: number;
    detectedPhones?: string[];
    detectedUrls?: string[];
    detectedQRCodes?: string[];
    isDuplicateImage?: boolean;
    isUnverifiedDocument?: boolean;
    customSignals?: ModerationSignalDTO[];
}

export class MarketplacePolicy {
    private thresholds: MarketplacePolicyThresholds;

    constructor(thresholds: MarketplacePolicyThresholds = DEFAULT_MARKETPLACE_POLICY_THRESHOLDS) {
        this.thresholds = thresholds;
    }

    evaluate(input: PolicyEvaluationInput): ModerationResultDTO {
        const reasons: ModerationReasonValue[] = [];
        const signals: ModerationSignalDTO[] = input.customSignals ? [...input.customSignals] : [];

        // 1. Evaluate Explicit Adult / Nudity Content
        if (input.adultScore >= this.thresholds.adultRejectThreshold) {
            reasons.push(MODERATION_REASON.EXPLICIT_NUDITY);
        } else if (input.adultScore >= this.thresholds.adultReviewThreshold) {
            reasons.push(MODERATION_REASON.EXPLICIT_NUDITY);
        }

        // 2. Evaluate Violence & Gore
        if (
            input.violenceScore >= this.thresholds.violenceRejectThreshold ||
            input.goreScore >= this.thresholds.violenceRejectThreshold
        ) {
            reasons.push(MODERATION_REASON.GRAPHIC_VIOLENCE);
        } else if (
            input.violenceScore >= this.thresholds.violenceReviewThreshold ||
            input.goreScore >= this.thresholds.violenceReviewThreshold
        ) {
            reasons.push(MODERATION_REASON.GRAPHIC_VIOLENCE);
        }

        // 3. Evaluate OCR Contact Information (Phone / URL / QR Code)
        if (input.detectedPhones && input.detectedPhones.length > 0) {
            reasons.push(MODERATION_REASON.PHONE_NUMBER_IN_IMAGE);
        }
        if (input.detectedUrls && input.detectedUrls.length > 0) {
            reasons.push(MODERATION_REASON.URL_IN_IMAGE);
        }
        if (input.detectedQRCodes && input.detectedQRCodes.length > 0) {
            reasons.push(MODERATION_REASON.QR_CODE_IN_IMAGE);
        }

        // 4. Evaluate Duplicate Image
        if (input.isDuplicateImage) {
            reasons.push(MODERATION_REASON.DUPLICATE_IMAGE);
        }

        // 5. Evaluate Unverified Document
        if (input.isUnverifiedDocument) {
            reasons.push(MODERATION_REASON.UNVERIFIED_DOCUMENT);
        }

        // Compute Normalized Risk Level
        const maxScore = Math.max(input.adultScore, input.violenceScore, input.goreScore, input.racyScore);
        let riskLevel: RiskLevelValue = RISK_LEVEL.LOW;

        if (
            input.adultScore >= this.thresholds.adultRejectThreshold ||
            input.violenceScore >= this.thresholds.violenceRejectThreshold
        ) {
            riskLevel = RISK_LEVEL.CRITICAL;
        } else if (maxScore >= 0.5 || input.detectedPhones?.length || input.detectedUrls?.length) {
            riskLevel = RISK_LEVEL.HIGH;
        } else if (maxScore >= 0.25 || input.isDuplicateImage) {
            riskLevel = RISK_LEVEL.MEDIUM;
        }

        // Compute Decision Outcome
        let outcome: ModerationOutcomeValue = MODERATION_OUTCOME.APPROVED;

        if (
            input.adultScore >= this.thresholds.adultRejectThreshold ||
            input.violenceScore >= this.thresholds.violenceRejectThreshold
        ) {
            outcome = MODERATION_OUTCOME.REJECTED;
        } else if (
            riskLevel === RISK_LEVEL.HIGH ||
            riskLevel === RISK_LEVEL.MEDIUM ||
            reasons.length > 0
        ) {
            outcome = MODERATION_OUTCOME.HELD_FOR_REVIEW;
        }

        return {
            outcome,
            riskLevel,
            reasons: Array.from(new Set(reasons)),
            signals,
        };
    }
}
