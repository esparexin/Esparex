import { z } from 'zod';
import { AIResult, AIStreamChunk, GenerateTextOptions, HealthCheckResult } from './types';

export interface AIProvider {
    generateText(
        prompt: string,
        options?: GenerateTextOptions
    ): Promise<AIResult>;

    generateStructured<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        options?: GenerateTextOptions
    ): Promise<T>;

    streamText(
        prompt: string,
        options?: GenerateTextOptions
    ): AsyncIterable<AIStreamChunk>;

    healthCheck(): Promise<HealthCheckResult>;
}
