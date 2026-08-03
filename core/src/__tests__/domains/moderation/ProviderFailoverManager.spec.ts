import { ProviderFailoverManager, AllProvidersFailedError } from '../../../domains/moderation/pipeline/ProviderFailoverManager';
import { ImageModerationProvider, ImageModerationRequest, ImageModerationResponse } from '../../../services/ai/moderation/types';

describe('ProviderFailoverManager (PR 4 — Multi-Cloud Resilience)', () => {
    let mockPrimaryProvider: jest.Mocked<ImageModerationProvider>;
    let mockSecondaryProvider: jest.Mocked<ImageModerationProvider>;
    let manager: ProviderFailoverManager;

    const mockRequest: ImageModerationRequest = {
        imageUrl: 'https://example.com/test.jpg',
        imageBuffer: Buffer.from('test-image'),
    };

    const mockSuccessResponse: ImageModerationResponse = {
        provider: 'PrimaryProvider',
        latencyMs: 42,
        adultScore: 0.01,
        violenceScore: 0.02,
        racyScore: 0.01,
        goreScore: 0.01,
        labels: ['safe'],
        signals: [],
    };

    beforeEach(() => {
        mockPrimaryProvider = {
            providerName: 'PrimaryProvider',
            moderateImage: jest.fn(),
        };

        mockSecondaryProvider = {
            providerName: 'SecondaryProvider',
            moderateImage: jest.fn(),
        };

        manager = new ProviderFailoverManager([
            { name: 'PrimaryProvider', provider: mockPrimaryProvider, breakerOptions: { failureThreshold: 2, cooldownMs: 1000 } },
            { name: 'SecondaryProvider', provider: mockSecondaryProvider, breakerOptions: { failureThreshold: 2, cooldownMs: 1000 } },
        ]);
    });

    it('executes primary provider when healthy', async () => {
        mockPrimaryProvider.moderateImage.mockResolvedValueOnce(mockSuccessResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response).toEqual(mockSuccessResponse);
        expect(mockPrimaryProvider.moderateImage).toHaveBeenCalledTimes(1);
        expect(mockSecondaryProvider.moderateImage).not.toHaveBeenCalled();
    });

    it('fails over to secondary provider when primary provider throws an error', async () => {
        mockPrimaryProvider.moderateImage.mockRejectedValueOnce(new Error('Primary API Timeout'));
        const secondaryResponse: ImageModerationResponse = {
            ...mockSuccessResponse,
            provider: 'SecondaryProvider',
        };
        mockSecondaryProvider.moderateImage.mockResolvedValueOnce(secondaryResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response.provider).toBe('SecondaryProvider');
        expect(mockPrimaryProvider.moderateImage).toHaveBeenCalledTimes(1);
        expect(mockSecondaryProvider.moderateImage).toHaveBeenCalledTimes(1);
    });

    it('bypasses provider when circuit breaker state is OPEN', async () => {
        // Trigger failures to trip primary circuit breaker to OPEN state
        mockPrimaryProvider.moderateImage.mockRejectedValue(new Error('Persistent Outage'));
        mockSecondaryProvider.moderateImage.mockResolvedValue(mockSuccessResponse);

        // 2 failures trip circuit breaker (failureThreshold = 2)
        await manager.executeWithFailover(mockRequest);
        await manager.executeWithFailover(mockRequest);

        const healthBefore = manager.getProviderHealthStatuses();
        expect(healthBefore.find((h) => h.name === 'PrimaryProvider')?.state).toBe('open');

        // Third call should bypass primary completely without calling its moderateImage method
        jest.clearAllMocks();
        mockSecondaryProvider.moderateImage.mockResolvedValueOnce(mockSuccessResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response).toEqual(mockSuccessResponse);
        expect(mockPrimaryProvider.moderateImage).not.toHaveBeenCalled();
        expect(mockSecondaryProvider.moderateImage).toHaveBeenCalledTimes(1);
    });

    it('throws AllProvidersFailedError when all providers fail', async () => {
        mockPrimaryProvider.moderateImage.mockRejectedValueOnce(new Error('Primary Down'));
        mockSecondaryProvider.moderateImage.mockRejectedValueOnce(new Error('Secondary Down'));

        await expect(manager.executeWithFailover(mockRequest)).rejects.toThrow(AllProvidersFailedError);
    });

    it('accurately reports health statuses of registered providers', () => {
        const statuses = manager.getProviderHealthStatuses();
        expect(statuses).toHaveLength(2);
        expect(statuses[0]).toEqual({ name: 'PrimaryProvider', state: 'closed' });
        expect(statuses[1]).toEqual({ name: 'SecondaryProvider', state: 'closed' });
    });
});
