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

export const generateAIContent = async (payload: AIInput): Promise<AIOutput | null> => {
    const { data } = await toApiResult<AIOutput>(apiClient.post(API_ROUTES.USER.AI_GENERATE, payload));
    return data;
};
