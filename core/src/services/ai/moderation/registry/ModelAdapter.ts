/**
 * Model Adapter Interface (PR 1)
 *
 * Defines the contract for vision, safety, and OCR model adapters.
 * Implementations handle specific model runtimes (ONNX, TensorFlow.js, local inference, etc.)
 * while exposing a standard lifecycle and prediction interface to the registry.
 */

export type ModelType = 'nsfw' | 'object_detection' | 'ocr' | 'safety' | 'custom';

export interface ModelAdapterMetadata {
    modelId: string;
    modelType: ModelType;
    version: string;
    isLoaded: boolean;
    initializedAt?: number;
}

export interface ModelAdapter<TInput = unknown, TOutput = unknown> {
    readonly modelId: string;
    readonly modelType: ModelType;
    readonly version: string;

    /**
     * Initializes the underlying model weights and runtime resources.
     */
    initialize(): Promise<void>;

    /**
     * Executes prediction/inference using the underlying model.
     * @throws Error if model is not initialized (isLoaded is false).
     */
    predict(input: TInput): Promise<TOutput>;

    /**
     * Returns true if model weights and resources are loaded and ready.
     */
    isLoaded(): boolean;

    /**
     * Returns timestamp when model was initialized, or undefined if not initialized.
     */
    getInitializedAt(): number | undefined;

    /**
     * Disposes model weights and releases memory/GPU resources.
     */
    dispose(): Promise<void>;
}
