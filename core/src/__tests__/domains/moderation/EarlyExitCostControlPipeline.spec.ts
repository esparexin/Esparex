import { EarlyExitCostControlPipeline } from '../../../domains/moderation/pipeline/EarlyExitCostControlPipeline';
import sharp from 'sharp';

describe('EarlyExitCostControlPipeline (PR 3 — Stage 1 Pre-filtering)', () => {
    let pipeline: EarlyExitCostControlPipeline;

    beforeEach(() => {
        pipeline = new EarlyExitCostControlPipeline();
    });

    it('early exits with EMPTY_BUFFER when buffer is missing or zero-length', async () => {
        const nullResult = await pipeline.checkBeforeProvider(undefined);
        expect(nullResult.shouldCallProvider).toBe(false);
        expect(nullResult.reason).toBe('EMPTY_BUFFER');

        const emptyResult = await pipeline.checkBeforeProvider(Buffer.from([]));
        expect(emptyResult.shouldCallProvider).toBe(false);
        expect(emptyResult.reason).toBe('EMPTY_BUFFER');
    });

    it('early exits with EXCEEDS_FILE_SIZE when buffer size exceeds limit', async () => {
        const largeBuffer = Buffer.alloc(100);
        const result = await pipeline.checkBeforeProvider(largeBuffer, 50);

        expect(result.shouldCallProvider).toBe(false);
        expect(result.reason).toBe('EXCEEDS_FILE_SIZE');
    });

    it('allows valid unique image buffer to proceed to Stage 2 provider', async () => {
        const imageBuffer = await sharp({
            create: {
                width: 50,
                height: 50,
                channels: 3,
                background: { r: 100, g: 150, b: 200 },
            },
        })
            .png()
            .toBuffer();

        const result = await pipeline.checkBeforeProvider(imageBuffer);

        expect(result.shouldCallProvider).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.fingerprint).toBeDefined();
        expect(pipeline.getCachedCount()).toBe(1);
    });

    it('early exits with DUPLICATE_IMAGE_HASH when exact image is uploaded twice', async () => {
        const imageBuffer = await sharp({
            create: {
                width: 50,
                height: 50,
                channels: 3,
                background: { r: 0, g: 255, b: 0 },
            },
        })
            .png()
            .toBuffer();

        const firstCheck = await pipeline.checkBeforeProvider(imageBuffer);
        expect(firstCheck.shouldCallProvider).toBe(true);

        const duplicateCheck = await pipeline.checkBeforeProvider(imageBuffer);
        expect(duplicateCheck.shouldCallProvider).toBe(false);
        expect(duplicateCheck.reason).toBe('DUPLICATE_IMAGE_HASH');
        expect(duplicateCheck.fingerprint).toBeDefined();
    });

    it('allows cache registration and cache clearing', () => {
        pipeline.registerFingerprint({ hash: 'abc123', createdAt: Date.now() });
        expect(pipeline.getCachedCount()).toBe(1);

        pipeline.clearCache();
        expect(pipeline.getCachedCount()).toBe(0);
    });
});
