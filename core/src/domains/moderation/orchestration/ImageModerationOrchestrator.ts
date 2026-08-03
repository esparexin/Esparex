/**
 * Image Moderation Orchestrator (PR 5)
 *
 * Master Orchestrator coordinating:
 * Early Exit Pipeline ➔ Provider Failover Manager ➔ Classifiers (Safety, OCR, Relevance) ➔ MarketplacePolicy ➔ Audit Trail.
 */
import logger from '../../../utils/logger';
import { ModerationResultDTO } from '@esparex/contracts';
import { ProviderFailoverManager } from '../../../services/ai/moderation/ProviderFailoverManager';
import { SafetyClassifier } from '../classifiers/SafetyClassifier';
import { OCRService } from '../classifiers/OCRService';
import { RelevanceClassifier } from '../classifiers/RelevanceClassifier';
import { MarketplacePolicy } from '../policy/MarketplacePolicy';
import { ImageAuditTrailService } from './ImageAuditTrailService';

export interface OrchestratorInput {
    imageId: string;
    entityId: string;
    entityType: 'ad' | 'service' | 'spare_part' | 'profile_photo' | 'document';
    imageUrl?: string;
    imageBuffer?: Buffer;
    title?: string;
    category?: string;
}

export class ImageModerationOrchestrator {
    private failoverManager: ProviderFailoverManager;
    private safetyClassifier: SafetyClassifier;
    private ocrService: OCRService;
    private relevanceClassifier: RelevanceClassifier;
    private policyEngine: MarketplacePolicy;
    private auditTrail: ImageAuditTrailService;

    constructor(
        failoverManager: ProviderFailoverManager,
        policyEngine: MarketplacePolicy = new MarketplacePolicy(),
        auditTrail: ImageAuditTrailService = new ImageAuditTrailService()
    ) {
        this.failoverManager = failoverManager;
        this.safetyClassifier = new SafetyClassifier();
        this.ocrService = new OCRService();
        this.relevanceClassifier = new RelevanceClassifier();
        this.policyEngine = policyEngine;
        this.auditTrail = auditTrail;
    }

    async moderateImage(input: OrchestratorInput): Promise<ModerationResultDTO> {
        logger.info(`[ImageModerationOrchestrator] Starting image moderation for image ${input.imageId}`);

        // 1. Execute Provider Failover (GoogleVision -> Sightengine -> AWSRekognition)
        const providerResponse = await this.failoverManager.moderateImageWithFailover({
            imageUrl: input.imageUrl,
            imageBuffer: input.imageBuffer,
        });

        // 2. Run Classifiers
        const safety = this.safetyClassifier.classify(providerResponse);
        const ocrText = providerResponse.ocr?.rawText || '';
        const ocrResult = this.ocrService.analyzeText(ocrText);
        const relevance = this.relevanceClassifier.classifyRelevance(
            input.title || '',
            input.category || '',
            providerResponse.labels
        );

        // 3. Evaluate Decoupled Policy Engine
        const result = this.policyEngine.evaluate({
            adultScore: safety.adultScore,
            violenceScore: safety.violenceScore,
            racyScore: safety.racyScore,
            goreScore: safety.goreScore,
            detectedPhones: ocrResult.detectedPhones,
            detectedUrls: ocrResult.detectedUrls,
            detectedQRCodes: ocrResult.detectedQRCodes,
            customSignals: providerResponse.signals,
        });

        // 4. Record Versioned Audit Trail
        await this.auditTrail.recordAudit({
            imageId: input.imageId,
            entityId: input.entityId,
            entityType: input.entityType,
            result,
            modelVersion: 'gemini-vision-v2',
            policyVersion: 'marketplace-policy-v1.0',
            providerVersion: providerResponse.provider,
            timestamp: Date.now(),
        });

        return result;
    }
}
