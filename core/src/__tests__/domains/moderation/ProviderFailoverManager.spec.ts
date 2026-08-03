import { ProviderFailoverManager, AllProvidersFailedError } from '../../../domains/moderation/pipeline/ProviderFailoverManager';
import { ImageModerationProvider, ImageModerationRequest, ImageModerationResponse } from '../../../domains/moderation/types';

describe('ProviderFailoverManager (PR 4 — Multi-Cloud Resilience)', () => {
    let mockPrimaryProvider: jest.Mocked<ImageModerationProvider>;
    let mockSecondaryProvider: jest.Mocked<ImageModerationProvider>;
    let manager: ProviderFailoverManager;

    const mockRequest: ImageModerationRequest = {
        imageId: 'img-123',
        buffer: Buffer.from('test-image'),
    };

    const mockSuccessResponse: ImageModerationResponse = {
        providerName: 'PrimaryProvider',
        flagged: false,
        confidence: 0.99,
        categories: [],
        rawResponse: {},
    };

    beforeEach(() => {
        mockPrimaryProvider = {
            name: 'PrimaryProvider',
            moderate: jest.fn(),
        };

        mockSecondaryProvider = {
            name: 'SecondaryProvider',
            moderate: jest.fn(),
        };

        manager = new ProviderFailoverManager([
            { name: 'PrimaryProvider', provider: mockPrimaryProvider, breakerOptions: { failureThreshold: 2, cooldownMs: 1000 } },
            { name: 'SecondaryProvider', provider: mockSecondaryProvider, breakerOptions: { failureThreshold: 2, cooldownMs: 1000 } },
        ]);
    });

    it('executes primary provider when healthy', async () => {
        mockPrimaryProvider.moderate.mockResolvedValueOnce(mockSuccessResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response).toEqual(mockSuccessResponse);
        expect(mockPrimaryProvider.moderate).toHaveBeenCalledTimes(1);
        expect(mockSecondaryProvider.moderate).not.toHaveBeenCalled();
    });

    it('fails over to secondary provider when primary provider throws an error', async () => {
        mockPrimaryProvider.moderate.mockRejectedValueOnce(new Error('Primary API Timeout'));
        const secondaryResponse: ImageModerationResponse = {
            ...mockSuccessResponse,
            providerName: 'SecondaryProvider',
        };
        mockSecondaryProvider.moderate.mockResolvedValueOnce(secondaryResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response.providerName).toBe('SecondaryProvider');
        expect(mockPrimaryProvider.moderate).toHaveBeenCalledTimes(1);
        expect(mockSecondaryProvider.moderate).toHaveBeenCalledTimes(1);
    });

    it('bypasses provider when circuit breaker state is OPEN', async () => {
        // Trigger failures to trip primary circuit breaker to OPEN state
        mockPrimaryProvider.moderate.mockRejectedValue(new Error('Persistent Outage'));
        mockSecondaryProvider.moderate.mockResolvedValue(mockSuccessResponse);

        // 2 failures trip circuit breaker (failureThreshold = 2)
        await manager.executeWithFailover(mockRequest);
        await manager.executeWithFailover(mockRequest);

        const healthBefore = manager.getProviderHealthStatuses();
        expect(healthBefore.find((h) => h.name === 'PrimaryProvider')?.state).toBe('open');

        // Third call should bypass primary completely without calling its moderate method
        jest.clearAllMocks();
        mockSecondaryProvider.moderate.mockResolvedValueOnce(mockSuccessResponse);

        const response = await manager.executeWithFailover(mockRequest);

        expect(response).toEqual(mockSuccessResponse);
        expect(mockPrimaryProvider.moderate).not.toHaveBeenCalled();
        expect(mockSecondaryProvider.moderate).toHaveBeenCalledTimes(1);
    });

    it('throws AllProvidersFailedError when all providers fail', async () => {
        mockPrimaryProvider.moderate.mockRejectedValueOnce(new Error('Primary Down'));
        mockSecondaryProvider.moderate.mockRejectedValueOnce(new Error('Secondary Down'));

        await expect(manager.executeWithFailover(mockRequest)).rejects.toThrow(AllProvidersFailedError);
    });

    it('accurately reports health statuses of registered providers', () => {
        const statuses = manager.getProviderHealthStatuses();
        expect(statuses).toHaveLength(2);
        expect(statuses[0]).toEqual({ name: 'PrimaryProvider', state: 'closed' });
        expect(statuses[1]).toEqual({ name: 'SecondaryProvider', state: 'closed' });
    });
});
