import { GoogleVisionProvider } from '../../../services/ai/moderation/providers/GoogleVisionProvider';
import { SightengineProvider } from '../../../services/ai/moderation/providers/SightengineProvider';
import { AWSRekognitionProvider } from '../../../services/ai/moderation/providers/AWSRekognitionProvider';
import { ProviderFailoverManager } from '../../../services/ai/moderation/ProviderFailoverManager';

describe('Moderation Provider Framework & Failover (PR 2)', () => {
    it('executes GoogleVisionProvider successfully', async () => {
        const provider = new GoogleVisionProvider();
        const response = await provider.moderateImage({ imageUrl: 'https://example.com/test.jpg' });

        expect(provider.providerName).toBe('GoogleVisionProvider');
        expect(response.provider).toBe('GoogleVisionProvider');
        expect(response.adultScore).toBeLessThan(0.1);
        expect(response.labels).toContain('Electronics');
    });

    it('executes SightengineProvider successfully', async () => {
        const provider = new SightengineProvider();
        const response = await provider.moderateImage({ imageUrl: 'https://example.com/test.jpg' });

        expect(provider.providerName).toBe('SightengineProvider');
        expect(response.provider).toBe('SightengineProvider');
    });

    it('fails over to secondary provider when primary fails', async () => {
        const failingPrimary = {
            providerName: 'FailingPrimary',
            moderateImage: jest.fn().mockRejectedValue(new Error('Network Timeout')),
        };

        const secondary = new AWSRekognitionProvider();
        const manager = new ProviderFailoverManager(failingPrimary, [secondary]);

        const response = await manager.moderateImageWithFailover({ imageUrl: 'https://example.com/test.jpg' });

        expect(failingPrimary.moderateImage).toHaveBeenCalled();
        expect(response.provider).toBe('AWSRekognitionProvider');
    });
});
