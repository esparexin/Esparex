jest.mock('@esparex/core/config/env', () => ({
    env: {
        NODE_ENV: 'test',
        AWS_REGION: 'ap-south-1',
        S3_BUCKET_NAME: '',
    }
}));

import { uploadToS3 } from '@esparex/core';

describe('S3 bucket environment resolution', () => {
    it('rejects uploads when S3_BUCKET_NAME is missing', async () => {
        await expect(
            uploadToS3(Buffer.from('abc'), 'ads/test.webp', 'image/webp')
        ).rejects.toThrow('S3_BUCKET_NAME environment variable is not defined');
    });
});

