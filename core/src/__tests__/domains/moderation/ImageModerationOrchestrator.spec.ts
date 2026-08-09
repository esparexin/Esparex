import { ImageModerationOrchestrator } from '../../../domains/moderation/pipeline/ImageModerationOrchestrator';
import { EarlyExitCostControlPipeline } from '../../../domains/moderation/pipeline/EarlyExitCostControlPipeline';
import { ProviderFailoverManager } from '../../../domains/moderation/pipeline/ProviderFailoverManager';
import { ModerationDecisionPolicy } from '../../../domains/moderation/policy/ModerationDecisionPolicy';
import { Stage3Processor, Stage3Result } from '../../../domains/moderation/pipeline/Stage3Processor';
import { ImageModerationResponse } from '../../../services/ai/moderation/types';
import sharp from 'sharp';

describe('ImageModerationOrchestrator (PR 5 — 3-Stage Pipeline Composition)', () => {
    jest.setTimeout(30000);

    let mockStage1Pipeline: jest.Mocked<EarlyExitCostControlPipeline>;
    let mockStage2FailoverManager: jest.Mocked<ProviderFailoverManager>;
    let mockStage3Processor: jest.Mocked<Stage3Processor>;
    let decisionPolicy: ModerationDecisionPolicy;
    let orchestrator: ImageModerationOrchestrator;
    let validBuffer: Buffer;

    const mockSafeVisionResponse: ImageModerationResponse = {
        provider: 'LocalVisionProvider',
        latencyMs: 15,
        adultScore: 0.05,
        violenceScore: 0.02,
        racyScore: 0.01,
        goreScore: 0.01,
        labels: ['safe'],
        signals: [],
    };

    const mockUnsafeVisionResponse: ImageModerationResponse = {
        provider: 'LocalVisionProvider',
        latencyMs: 18,
        adultScore: 0.95,
        violenceScore: 0.10,
        racyScore: 0.05,
        goreScore: 0.02,
        labels: ['adult'],
        signals: [],
    };

    beforeAll(async () => {
        validBuffer = await sharp({
            create: {
                width: 10,
                height: 10,
                channels: 3,
                background: { r: 0, g: 0, b: 255 },
            },
        })
            .png()
            .toBuffer();
    });

    beforeEach(() => {
        mockStage1Pipeline = {
            checkBeforeProvider: jest.fn(),
            registerFingerprint: jest.fn(),
            getCachedCount: jest.fn(),
            clearCache: jest.fn(),
        } as any<EarlyExitCostControlPipeline>;

        mockStage2FailoverManager = {
            executeWithFailover: jest.fn(),
            registerProvider: jest.fn(),
            getProviderHealthStatuses: jest.fn(),
            getProviderCount: jest.fn(),
        } as any<ProviderFailoverManager>;

        mockStage3Processor = {
            name: 'MockOCRProcessor',
            process: jest.fn(),
        };

        decisionPolicy = new ModerationDecisionPolicy({ rejectThreshold: 0.8, flagThreshold: 0.5 });

        orchestrator = new ImageModerationOrchestrator(
            mockStage1Pipeline,
            mockStage2FailoverManager,
            decisionPolicy,
            mockStage3Processor
        );
    });

    it('early exits at Stage 1 when buffer is empty or invalid', async () => {
        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({
            shouldCallProvider: false,
            reason: 'EMPTY_BUFFER',
        });

        const result = await orchestrator.moderate(undefined);

        expect(result.action).toBe('REJECT');
        expect(result.stage).toBe('STAGE_1_EARLY_EXIT');
        expect(result.reason).toBe('STAGE_1_EARLY_EXIT_EMPTY_BUFFER');
        expect(mockStage2FailoverManager.executeWithFailover).not.toHaveBeenCalled();
    });

    it('early exits at Stage 1 when duplicate image fingerprint is detected', async () => {
        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({
            shouldCallProvider: false,
            reason: 'DUPLICATE_IMAGE_HASH',
            fingerprint: { hash: '1234567890abcdef', createdAt: Date.now() },
        });

        const result = await orchestrator.moderate(validBuffer);

        expect(result.action).toBe('REJECT');
        expect(result.stage).toBe('STAGE_1_EARLY_EXIT');
        expect(result.reason).toBe('STAGE_1_EARLY_EXIT_DUPLICATE_IMAGE_HASH');
        expect(mockStage2FailoverManager.executeWithFailover).not.toHaveBeenCalled();
    });

    it('proceeds to Stage 2 and approves safe images', async () => {
        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({
            shouldCallProvider: true,
            fingerprint: { hash: '0000000000000000', createdAt: Date.now() },
        });
        mockStage2FailoverManager.executeWithFailover.mockResolvedValueOnce(mockSafeVisionResponse);
        mockStage3Processor.process.mockResolvedValueOnce({ passed: true });

        const result = await orchestrator.moderate(validBuffer);

        expect(result.action).toBe('APPROVE');
        expect(result.stage).toBe('STAGE_3_INTELLIGENCE');
        expect(result.visionResponse).toEqual(mockSafeVisionResponse);
        expect(mockStage1Pipeline.checkBeforeProvider).toHaveBeenCalledTimes(1);
        expect(mockStage2FailoverManager.executeWithFailover).toHaveBeenCalledTimes(1);
        expect(mockStage3Processor.process).toHaveBeenCalledTimes(1);
    });

    it('rejects at Stage 2 when AI vision scores exceed reject threshold', async () => {
        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({
            shouldCallProvider: true,
        });
        mockStage2FailoverManager.executeWithFailover.mockResolvedValueOnce(mockUnsafeVisionResponse);

        const result = await orchestrator.moderate(validBuffer);

        expect(result.action).toBe('REJECT');
        expect(result.stage).toBe('STAGE_2_VISION');
        expect(result.reason).toBe('EXCEEDS_REJECT_THRESHOLD');
        expect(mockStage3Processor.process).not.toHaveBeenCalled();
    });

    it('rejects at Stage 3 when Stage 3 processor fails validation', async () => {
        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({
            shouldCallProvider: true,
        });
        mockStage2FailoverManager.executeWithFailover.mockResolvedValueOnce(mockSafeVisionResponse);
        mockStage3Processor.process.mockResolvedValueOnce({
            passed: false,
            reason: 'PROHIBITED_CONTACT_TEXT_FOUND',
        });

        const result = await orchestrator.moderate(validBuffer);

        expect(result.action).toBe('REJECT');
        expect(result.stage).toBe('STAGE_3_INTELLIGENCE');
        expect(result.reason).toBe('PROHIBITED_CONTACT_TEXT_FOUND');
    });

    it('evaluates decision policy correctly for flag threshold', async () => {
        const mockFlagVisionResponse: ImageModerationResponse = {
            ...mockSafeVisionResponse,
            racyScore: 0.65, // Exceeds flag threshold 0.5
        };

        mockStage1Pipeline.checkBeforeProvider.mockResolvedValueOnce({ shouldCallProvider: true });
        mockStage2FailoverManager.executeWithFailover.mockResolvedValueOnce(mockFlagVisionResponse);

        const orchestratorNoStage3 = new ImageModerationOrchestrator(
            mockStage1Pipeline,
            mockStage2FailoverManager,
            decisionPolicy
        );

        const result = await orchestratorNoStage3.moderate(validBuffer);

        expect(result.action).toBe('FLAG');
        expect(result.stage).toBe('STAGE_2_VISION');
        expect(result.reason).toBe('EXCEEDS_FLAG_THRESHOLD');
    });
});
