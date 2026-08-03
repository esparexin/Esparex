/**
 * Early-Exit Cost Control Pipeline (PR 7)
 *
 * Runs basic file validation & local perceptual hash lookup BEFORE calling paid Vision AI APIs.
 * Prevents sending invalid or duplicate files to paid providers.
 */
import { DuplicateImageService, ImageFingerprint } from '../classifiers/DuplicateImageService';
import { ModerationMetricsService } from '../monitoring/ModerationMetricsService';

export interface CostControlCheckResult {
    shouldCallProvider: boolean;
    reason?: 'INVALID_FILE_TYPE' | 'EXCEEDS_FILE_SIZE' | 'DUPLICATE_IMAGE_HASH';
    fingerprint?: ImageFingerprint;
}

export class EarlyExitCostControlPipeline {
    private duplicateService: DuplicateImageService;
    private metricsService: ModerationMetricsService;
    private existingFingerprints: ImageFingerprint[] = [];

    constructor(metricsService: ModerationMetricsService = new ModerationMetricsService()) {
        this.duplicateService = new DuplicateImageService();
        this.metricsService = metricsService;
    }

    checkBeforeProvider(buffer: Buffer, maxBytes = 5242880): CostControlCheckResult {
        if (!buffer || buffer.length === 0 || buffer.length > maxBytes) {
            this.metricsService.recordEarlyExit();
            return { shouldCallProvider: false, reason: 'EXCEEDS_FILE_SIZE' };
        }

        const fp = this.duplicateService.computeFingerprint(buffer);
        const match = this.existingFingerprints.find((existing) =>
            this.duplicateService.isDuplicate(existing, fp)
        );

        if (match) {
            this.metricsService.recordEarlyExit();
            return { shouldCallProvider: false, reason: 'DUPLICATE_IMAGE_HASH', fingerprint: fp };
        }

        this.existingFingerprints.push(fp);
        return { shouldCallProvider: true, fingerprint: fp };
    }
}
