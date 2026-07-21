import { apiClient } from '@/lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES } from '../routes';

export interface AIInput {
    type: 'identify' | 'generate';
    image?: string; // Base64
    context?: Record<string, unknown>;
}

export interface AIOutput {
    brand?: string;
    model?: string;
    screenSize?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
}

export const generateAIContent = async (payload: AIInput): Promise<{ data: AIOutput | null; error: any }> => {
    return await toApiResult<AIOutput>(apiClient.post(API_ROUTES.USER.AI_GENERATE, payload));
};

export const checkAiStatus = async (): Promise<{ available: boolean; reason: string | null; retryAfter: number }> => {
    const { data } = await toApiResult<{ available: boolean; reason: string | null; retryAfter: number }>(
        apiClient.get('/user/ai/status', { silent: true })
    );
    return data || { available: false, reason: 'AI_UNAVAILABLE', retryAfter: 0 };
};
