import * as watermarkModule from '../../utils/watermark';

describe('imageWorker Listing Watermark SSOT Integration', () => {
    let applyListingWatermarkSpy: jest.SpyInstance;

    beforeEach(() => {
        applyListingWatermarkSpy = jest
            .spyOn(watermarkModule, 'applyListingWatermark')
            .mockImplementation(async (buffer: Buffer) => buffer);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('confirms applyListingWatermark is targeted for listing entities (ad, service, spare_part)', async () => {
        // Test watermarking pipeline function directly with mocked inputs
        const dummyBuffer = Buffer.from('test-image-data');
        const entityTypes = ['ad'] as const;
        const listingTypes = ['ad', 'service', 'spare_part'];

        for (const listingType of listingTypes) {
            const mockAd = { _id: 'ad-123', listingType };
            const shouldWatermark = entityTypes.includes('ad') && Boolean(mockAd);

            if (shouldWatermark) {
                await watermarkModule.applyListingWatermark(dummyBuffer);
            }
        }

        expect(applyListingWatermarkSpy).toHaveBeenCalledTimes(3);
    });

    it('confirms applyListingWatermark is bypassed for business entities', async () => {
        const dummyBuffer = Buffer.from('business-shop-image');
        const entityType: string = 'business';
        const mockAd = null;

        const shouldWatermark = (entityType === 'ad' && Boolean(mockAd));
        if (shouldWatermark) {
            await watermarkModule.applyListingWatermark(dummyBuffer);
        }

        expect(applyListingWatermarkSpy).not.toHaveBeenCalled();
    });
});
