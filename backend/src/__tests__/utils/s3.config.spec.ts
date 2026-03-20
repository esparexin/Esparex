import { uploadToS3 } from '../../utils/s3';

describe('S3 bucket environment resolution', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.S3_BUCKET_NAME;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('rejects uploads when S3_BUCKET_NAME is missing', async () => {
        await expect(
            uploadToS3(Buffer.from('abc'), 'ads/test.webp', 'image/webp')
        ).rejects.toThrow('S3_BUCKET_NAME environment variable is not defined');
    });
});
