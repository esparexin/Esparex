import {
    ModerationModelRegistry,
    DuplicateModelRegistrationError,
    ModelNotFoundError,
} from '../../../services/ai/moderation/registry/ModerationModelRegistry';
import { ModelAdapter, ModelType } from '../../../services/ai/moderation/registry/ModelAdapter';

class MockModelAdapter<TInput = string, TOutput = Record<string, number>>
    implements ModelAdapter<TInput, TOutput> {
    readonly modelId: string;
    readonly modelType: ModelType;
    readonly version: string;
    private loaded = false;
    private initializedTimestamp?: number;

    constructor(modelId: string, modelType: ModelType = 'nsfw', version = '1.0.0') {
        this.modelId = modelId;
        this.modelType = modelType;
        this.version = version;
    }

    async initialize(): Promise<void> {
        this.loaded = true;
        this.initializedTimestamp = Date.now();
    }

    async predict(input: TInput): Promise<TOutput> {
        if (!this.loaded) {
            throw new Error(`Model ${this.modelId} is not initialized.`);
        }
        return { score: 0.95 } as any;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    getInitializedAt(): number | undefined {
        return this.initializedTimestamp;
    }

    async dispose(): Promise<void> {
        this.loaded = false;
        this.initializedTimestamp = undefined;
    }
}

describe('ModerationModelRegistry (PR 1)', () => {
    let registry: ModerationModelRegistry;

    beforeEach(() => {
        registry = new ModerationModelRegistry();
    });

    afterEach(async () => {
        await registry.disposeAll();
    });

    it('registers and resolves a model adapter by modelId', () => {
        const adapter = new MockModelAdapter('nsfw-v1', 'nsfw');
        registry.registerAdapter(adapter);

        expect(registry.hasAdapter('nsfw-v1')).toBe(true);
        const resolved = registry.getAdapter<string, Record<string, number>>('nsfw-v1');
        expect(resolved).toBe(adapter);
        expect(resolved.modelId).toBe('nsfw-v1');
    });

    it('returns false for non-existent modelId in hasAdapter()', () => {
        expect(registry.hasAdapter('unknown-model')).toBe(false);
    });

    it('throws DuplicateModelRegistrationError on duplicate registration', () => {
        const adapter1 = new MockModelAdapter('nsfw-v1', 'nsfw');
        const adapter2 = new MockModelAdapter('nsfw-v1', 'nsfw');

        registry.registerAdapter(adapter1);
        expect(() => registry.registerAdapter(adapter2)).toThrow(DuplicateModelRegistrationError);
    });

    it('throws ModelNotFoundError when resolving unknown modelId', () => {
        expect(() => registry.getAdapter('missing-id')).toThrow(ModelNotFoundError);
    });

    it('enforces explicit loading strategy — does NOT auto-initialize on registration', () => {
        const adapter = new MockModelAdapter('nsfw-lazy', 'nsfw');
        registry.registerAdapter(adapter);

        expect(adapter.isLoaded()).toBe(false);
        expect(adapter.getInitializedAt()).toBeUndefined();
    });

    it('supports explicit initialize() call and predict() workflow', async () => {
        const adapter = new MockModelAdapter('nsfw-active', 'nsfw');
        registry.registerAdapter(adapter);

        const resolved = registry.getAdapter<string, { score: number }>('nsfw-active');
        await resolved.initialize();

        expect(resolved.isLoaded()).toBe(true);
        expect(resolved.getInitializedAt()).toBeGreaterThan(0);

        const result = await resolved.predict('test-image-data');
        expect(result.score).toBe(0.95);
    });

    it('lists registered models metadata including initializedAt timestamp', async () => {
        const adapter1 = new MockModelAdapter('nsfw-v1', 'nsfw', '1.0.0');
        const adapter2 = new MockModelAdapter('ocr-v1', 'ocr', '2.1.0');

        registry.registerAdapter(adapter1);
        registry.registerAdapter(adapter2);

        await adapter1.initialize();

        const metadataList = registry.listRegisteredModels();
        expect(metadataList).toHaveLength(2);

        const nsfwMeta = metadataList.find((m) => m.modelId === 'nsfw-v1');
        const ocrMeta = metadataList.find((m) => m.modelId === 'ocr-v1');

        expect(nsfwMeta).toBeDefined();
        expect(nsfwMeta?.isLoaded).toBe(true);
        expect(nsfwMeta?.initializedAt).toBeGreaterThan(0);

        expect(ocrMeta).toBeDefined();
        expect(ocrMeta?.isLoaded).toBe(false);
        expect(ocrMeta?.initializedAt).toBeUndefined();
    });

    it('queries multiple adapters of the same ModelType category', () => {
        const nsfwPrimary = new MockModelAdapter('nsfw-primary', 'nsfw');
        const nsfwSecondary = new MockModelAdapter('nsfw-secondary', 'nsfw');
        const ocrPrimary = new MockModelAdapter('ocr-primary', 'ocr');

        registry.registerAdapter(nsfwPrimary);
        registry.registerAdapter(nsfwSecondary);
        registry.registerAdapter(ocrPrimary);

        const nsfwAdapters = registry.getAdaptersByType('nsfw');
        expect(nsfwAdapters).toHaveLength(2);
        expect(nsfwAdapters.map((a) => a.modelId)).toEqual(['nsfw-primary', 'nsfw-secondary']);

        const ocrAdapters = registry.getAdaptersByType('ocr');
        expect(ocrAdapters).toHaveLength(1);
    });

    it('handles disposal before initialization gracefully', async () => {
        const adapter = new MockModelAdapter('uninitialized-model', 'safety');
        registry.registerAdapter(adapter);

        await expect(registry.unregisterAdapter('uninitialized-model')).resolves.not.toThrow();
        expect(registry.hasAdapter('uninitialized-model')).toBe(false);
    });

    it('unregisters an adapter and disposes its resources', async () => {
        const adapter = new MockModelAdapter('to-remove', 'safety');
        registry.registerAdapter(adapter);
        await adapter.initialize();

        expect(adapter.isLoaded()).toBe(true);
        await registry.unregisterAdapter('to-remove');

        expect(registry.hasAdapter('to-remove')).toBe(false);
        expect(adapter.isLoaded()).toBe(false);
    });

    it('disposes all registered models and clears the registry on disposeAll()', async () => {
        const model1 = new MockModelAdapter('m1', 'nsfw');
        const model2 = new MockModelAdapter('m2', 'ocr');

        registry.registerAdapter(model1);
        registry.registerAdapter(model2);

        await model1.initialize();
        await model2.initialize();

        await registry.disposeAll();

        expect(registry.listRegisteredModels()).toHaveLength(0);
        expect(model1.isLoaded()).toBe(false);
        expect(model2.isLoaded()).toBe(false);
    });

    it('handles concurrent model registrations cleanly', async () => {
        const adapters = Array.from({ length: 10 }, (_, i) => new MockModelAdapter(`concurrent-${i}`, 'custom'));

        await Promise.all(adapters.map((a) => Promise.resolve(registry.registerAdapter(a))));

        expect(registry.listRegisteredModels()).toHaveLength(10);
    });
});
