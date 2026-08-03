import { LocalVisionModerationProvider } from '../../../services/ai/moderation/providers/LocalVisionModerationProvider';
import { ModerationModelRegistry } from '../../../services/ai/moderation/registry/ModerationModelRegistry';
import { ModelAdapter, ModelType } from '../../../services/ai/moderation/registry/ModelAdapter';
import { ImageModerationRequest } from '../../../services/ai/moderation/types';

class MockSafetyAdapter implements ModelAdapter<ImageModerationRequest, { adultScore: number; violenceScore: number; racyScore: number; goreScore: number }> {
    readonly modelId = 'mock-safety-adapter';
    readonly modelType: ModelType = 'safety';
    readonly version = '1.0.0';
    private loaded = false;
    private initTime?: number;

    async initialize(): Promise<void> {
        this.loaded = true;
        this.initTime = Date.now();
    }

    async predict(_input: ImageModerationRequest): Promise<{ adultScore: number; violenceScore: number; racyScore: number; goreScore: number }> {
        if (!this.loaded) throw new Error('Model not initialized');
        return { adultScore: 0.1, violenceScore: 0.05, racyScore: 0.2, goreScore: 0.01 };
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    getInitializedAt(): number | undefined {
        return this.initTime;
    }

    async dispose(): Promise<void> {
        this.loaded = false;
    }
}

class MockObjectDetectionAdapter implements ModelAdapter<ImageModerationRequest, { labels: string[] }> {
    readonly modelId = 'mock-object-adapter';
    readonly modelType: ModelType = 'object_detection';
    readonly version = '1.0.0';
    private loaded = false;
    private initTime?: number;

    async initialize(): Promise<void> {
        this.loaded = true;
        this.initTime = Date.now();
    }

    async predict(_input: ImageModerationRequest): Promise<{ labels: string[] }> {
        if (!this.loaded) throw new Error('Model not initialized');
        return { labels: ['Mobile Phone', 'Electronics', 'Mobile Phone'] };
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    getInitializedAt(): number | undefined {
        return this.initTime;
    }

    async dispose(): Promise<void> {
        this.loaded = false;
    }
}

describe('LocalVisionModerationProvider (PR 2)', () => {
    let registry: ModerationModelRegistry;

    beforeEach(() => {
        registry = new ModerationModelRegistry();
    });

    afterEach(async () => {
        await registry.disposeAll();
    });

    it('returns default baseline response when registry is empty', async () => {
        const provider = new LocalVisionModerationProvider(registry);
        const response = await provider.moderateImage({ imageUrl: 'https://example.com/item.jpg' });

        expect(provider.providerName).toBe('LocalVisionModerationProvider');
        expect(response.provider).toBe('LocalVisionModerationProvider');
        expect(response.adultScore).toBe(0);
        expect(response.violenceScore).toBe(0);
        expect(response.labels).toEqual([]);
        expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('aggregates scores and deduplicates labels from registered loaded model adapters', async () => {
        const safetyAdapter = new MockSafetyAdapter();
        const objectAdapter = new MockObjectDetectionAdapter();

        registry.registerAdapter(safetyAdapter);
        registry.registerAdapter(objectAdapter);

        await safetyAdapter.initialize();
        await objectAdapter.initialize();

        const provider = new LocalVisionModerationProvider(registry);
        const response = await provider.moderateImage({ imageUrl: 'https://example.com/phone.jpg' });

        expect(response.adultScore).toBe(0.1);
        expect(response.racyScore).toBe(0.2);
        expect(response.labels).toEqual(['Mobile Phone', 'Electronics']);
        expect(response.signals[0].classifier).toBe('LocalVisionModerationProvider');
        expect(response.signals[0].details?.registeredModelsCount).toBe(2);
    });

    it('ignores uninitialized model adapters gracefully during moderation execution', async () => {
        const safetyAdapter = new MockSafetyAdapter();
        registry.registerAdapter(safetyAdapter);
        // Do NOT call initialize()

        const provider = new LocalVisionModerationProvider(registry);
        const response = await provider.moderateImage({ imageUrl: 'https://example.com/unloaded.jpg' });

        expect(response.adultScore).toBe(0);
        expect(response.signals[0].details?.registeredModelsCount).toBe(1);
    });
});
