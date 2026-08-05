/**
 * Image Moderation Orchestrator (PR 5 — 3-Stage Pipeline Orchestration)
 *
 * Composes Stage 1 Pre-filtering (EarlyExitCostControlPipeline), Stage 2 Vision Moderation (ProviderFailoverManager),
 * and Stage 3 Intelligence (Stage3Processor hook) into a unified, resourced execution pipeline.
 */
import { EarlyExitCostControlPipeline } from './EarlyExitCostControlPipeline';
import { ProviderFailoverManager } from './ProviderFailoverManager';
import { Stage3Processor, Stage3Result } from './Stage3Processor';
import { ModerationDecisionPolicy, ModerationAction } from '../policy/ModerationDecisionPolicy';
import { ImageFingerprint } from '../classifiers/DuplicateImageService';
import { ImageModerationRequest, ImageModerationResponse } from '../../../services/ai/moderation/types';

export interface OrchestratedModerationResult {
    action: ModerationAction;
    reason?: string;
    stage: 'STAGE_1_EARLY_EXIT' | 'STAGE_2_VISION' | 'STAGE_3_INTELLIGENCE';
    fingerprint?: ImageFingerprint;
    visionResponse?: ImageModerationResponse;
    stage3Result?: Stage3Result;
    latencyMs: number;
}

export class ImageModerationOrchestrator {
    private stage1Pipeline: EarlyExitCostControlPipeline;
    private stage2FailoverManager: ProviderFailoverManager;
    private decisionPolicy: ModerationDecisionPolicy;
    private stage3Processor?: Stage3Processor;

    constructor(
        stage1Pipeline: EarlyExitCostControlPipeline,
        stage2FailoverManager: ProviderFailoverManager,
        decisionPolicy: ModerationDecisionPolicy = new ModerationDecisionPolicy(),
        stage3Processor?: Stage3Processor
    ) {
        this.stage1Pipeline = stage1Pipeline;
        this.stage2FailoverManager = stage2FailoverManager;
        this.decisionPolicy = decisionPolicy;
        this.stage3Processor = stage3Processor;
    }

    /**
     * Executes 3-stage image moderation pipeline.
     */
    async moderate(
        buffer?: Buffer,
        requestDetails: { imageUrl?: string; mimeType?: string } = {}
    ): Promise<OrchestratedModerationResult> {
        const startTime = Date.now();

        // Stage 1: Early Exit & Cost Control Pre-filtering
        const stage1Result = await this.stage1Pipeline.checkBeforeProvider(buffer);
        if (!stage1Result.shouldCallProvider) {
            return {
                action: 'REJECT',
                reason: `STAGE_1_EARLY_EXIT_${stage1Result.reason}`,
                stage: 'STAGE_1_EARLY_EXIT',
                fingerprint: stage1Result.fingerprint,
                latencyMs: Date.now() - startTime,
            };
        }

        // Stage 2: AI Vision Moderation via ProviderFailoverManager
        const visionRequest: ImageModerationRequest = {
            imageUrl: requestDetails.imageUrl,
            imageBuffer: buffer,
            mimeType: requestDetails.mimeType,
        };

        const visionResponse = await this.stage2FailoverManager.executeWithFailover(visionRequest);
        const decision = this.decisionPolicy.evaluate(visionResponse);

        // If Stage 2 vision triggers REJECT, exit immediately
        if (decision.action === 'REJECT') {
            return {
                action: 'REJECT',
                reason: decision.reason,
                stage: 'STAGE_2_VISION',
                fingerprint: stage1Result.fingerprint,
                visionResponse,
                latencyMs: Date.now() - startTime,
            };
        }

        // Stage 3: Intelligence & Text/OCR Extension Point
        let stage3Result: Stage3Result | undefined;
        if (this.stage3Processor && buffer) {
            stage3Result = await this.stage3Processor.process(buffer);
            if (!stage3Result.passed) {
                return {
                    action: 'REJECT',
                    reason: stage3Result.reason ?? 'STAGE_3_INTELLIGENCE_FAILED',
                    stage: 'STAGE_3_INTELLIGENCE',
                    fingerprint: stage1Result.fingerprint,
                    visionResponse,
                    stage3Result,
                    latencyMs: Date.now() - startTime,
                };
            }
        }

        return {
            action: decision.action,
            reason: decision.reason,
            stage: stage3Result ? 'STAGE_3_INTELLIGENCE' : 'STAGE_2_VISION',
            fingerprint: stage1Result.fingerprint,
            visionResponse,
            stage3Result,
            latencyMs: Date.now() - startTime,
        };
    }
}
