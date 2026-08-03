/**
 * Moderation Model Registry (PR 1)
 *
 * Provides lifecycle management, registration, and resolution for AI moderation model adapters.
 * Does NOT perform inference directly; delegates prediction to registered ModelAdapters.
 */
import { ModelAdapter, ModelAdapterMetadata, ModelType } from './ModelAdapter';

export class DuplicateModelRegistrationError extends Error {
    constructor(modelId: string) {
        super(`Model adapter with ID "${modelId}" is already registered in ModerationModelRegistry.`);
        this.name = 'DuplicateModelRegistrationError';
    }
}

export class ModelNotFoundError extends Error {
    constructor(modelId: string) {
        super(`Model adapter with ID "${modelId}" was not found in ModerationModelRegistry.`);
        this.name = 'ModelNotFoundError';
    }
}

export class ModerationModelRegistry {
    private adapters: Map<string, ModelAdapter<any, any>> = new Map();

    /**
     * Registers a model adapter in the registry.
     * Does NOT automatically call initialize() on registration (explicit loading strategy).
     * @throws DuplicateModelRegistrationError if an adapter with the same modelId is already registered.
     */
    registerAdapter<TInput, TOutput>(adapter: ModelAdapter<TInput, TOutput>): void {
        if (this.adapters.has(adapter.modelId)) {
            throw new DuplicateModelRegistrationError(adapter.modelId);
        }
        this.adapters.set(adapter.modelId, adapter);
    }

    /**
     * Checks whether an adapter with the specified modelId exists in the registry.
     */
    hasAdapter(modelId: string): boolean {
        return this.adapters.has(modelId);
    }

    /**
     * Resolves a registered adapter by its unique modelId.
     * @throws ModelNotFoundError if no adapter matches the modelId.
     */
    getAdapter<TInput = unknown, TOutput = unknown>(modelId: string): ModelAdapter<TInput, TOutput> {
        const adapter = this.adapters.get(modelId);
        if (!adapter) {
            throw new ModelNotFoundError(modelId);
        }
        return adapter as ModelAdapter<TInput, TOutput>;
    }

    /**
     * Resolves all registered adapters matching the specified ModelType category.
     */
    getAdaptersByType<TInput = unknown, TOutput = unknown>(
        modelType: ModelType
    ): ModelAdapter<TInput, TOutput>[] {
        const results: ModelAdapter<TInput, TOutput>[] = [];
        for (const adapter of this.adapters.values()) {
            if (adapter.modelType === modelType) {
                results.push(adapter as ModelAdapter<TInput, TOutput>);
            }
        }
        return results;
    }

    /**
     * Lists diagnostic metadata for all registered models in the registry.
     */
    listRegisteredModels(): ModelAdapterMetadata[] {
        return Array.from(this.adapters.values()).map((adapter) => ({
            modelId: adapter.modelId,
            modelType: adapter.modelType,
            version: adapter.version,
            isLoaded: adapter.isLoaded(),
            initializedAt: adapter.getInitializedAt(),
        }));
    }

    /**
     * Unregisters an adapter by modelId, disposing it if loaded.
     */
    async unregisterAdapter(modelId: string): Promise<void> {
        const adapter = this.adapters.get(modelId);
        if (adapter) {
            if (adapter.isLoaded()) {
                await adapter.dispose();
            }
            this.adapters.delete(modelId);
        }
    }

    /**
     * Disposes all registered model adapters and clears the registry.
     */
    async disposeAll(): Promise<void> {
        for (const adapter of this.adapters.values()) {
            try {
                if (adapter.isLoaded()) {
                    await adapter.dispose();
                }
            } catch {
                // Ignore disposal errors during bulk cleanup
            }
        }
        this.adapters.clear();
    }
}
