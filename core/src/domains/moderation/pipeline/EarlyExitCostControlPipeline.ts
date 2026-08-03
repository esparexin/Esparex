/**
 * Early-Exit Cost Control Pipeline (PR 3 — Stage 1 Processing)
 *
 * Runs basic file validation & local perceptual hash lookup BEFORE executing Stage 2 AI Vision Provider.
 * Catches invalid, corrupt, oversized, or duplicate image uploads locally at zero API cost.
 */
import { DuplicateImageService, ImageFingerprint } from '../classifiers/DuplicateImageService';
import logger from '../../../utils/logger';

export interface CostControlCheckResult {
    shouldCallProvider: boolean;
    reason?: 'EMPTY_BUFFER' | 'EXCEEDS_FILE_SIZE' | 'DUPLICATE_IMAGE_HASH';
    fingerprint?: ImageFingerprint;
}

export class EarlyExitCostControlPipeline {
    private duplicateService: DuplicateImageService;
    private fingerprintCache: ImageFingerprint[] = [];

    constructor(
        duplicateService: DuplicateImageService = new DuplicateImageService(),
        initialCache: ImageFingerprint[] = []
    ) {
        this.duplicateService = duplicateService;
        this.fingerprintCache = [...initialCache];
    }

    /**
     * Inspects image buffer integrity, file size, and perceptual hash against cache.
     * Determines whether Stage 2 AI Vision Moderation should proceed.
     */
    async checkBeforeProvider(
        buffer?: Buffer,
        maxBytes = 5 * 1024 * 1024
    ): Promise<CostControlCheckResult> {
        if (!buffer || buffer.length === 0) {
            logger.info('[EarlyExitCostControlPipeline] Early exit: empty buffer provided');
            return { shouldCallProvider: false, reason: 'EMPTY_BUFFER' };
        }

        if (buffer.length > maxBytes) {
            logger.info('[EarlyExitCostControlPipeline] Early exit: file size exceeds max limit', {
                sizeBytes: buffer.length,
                maxBytes,
            });
            return { shouldCallProvider: false, reason: 'EXCEEDS_FILE_SIZE' };
        }

        // Compute perceptual fingerprint
        const fp = await this.duplicateService.computeFingerprint(buffer);

        // Search cache for matching duplicate hash
        const match = this.fingerprintCache.find((existing) =>
            this.duplicateService.isDuplicate(existing, fp)
        );

        if (match) {
            logger.info('[EarlyExitCostControlPipeline] Early exit: duplicate image hash detected', {
                matchedHash: match.hash,
                newHash: fp.hash,
            });
            return {
                shouldCallProvider: false,
                reason: 'DUPLICATE_IMAGE_HASH',
                fingerprint: fp,
            };
        }

        // Cache new unique fingerprint
        this.fingerprintCache.push(fp);
        return {
            shouldCallProvider: true,
            fingerprint: fp,
        };
    }

    /**
     * Seeds or registers a unique fingerprint in the local cache.
     */
    registerFingerprint(fp: ImageFingerprint): void {
        this.fingerprintCache.push(fp);
    }

    /**
     * Returns total cached fingerprints count.
     */
    getCachedCount(): number {
        return this.fingerprintCache.length;
    }

    /**
     * Clears cached fingerprints.
     */
    clearCache(): void {
        this.fingerprintCache = [];
    }
}
