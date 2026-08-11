import { AIProvider } from './AIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';

export class UnsupportedProviderError extends Error {
    constructor(provider: string) {
        super(`Unsupported AI provider: ${provider}`);
        this.name = 'UnsupportedProviderError';
    }
}

export class AIProviderFactory {
    static create(providerName: string): AIProvider {
        switch (providerName.toLowerCase()) {
            case 'gemini':
                return new GeminiProvider();
            case 'openai':
                return new OpenAIProvider();
            case 'claude':
            case 'anthropic':
                return new ClaudeProvider();
            case 'deepseek':
                return new DeepSeekProvider();
            default:
                throw new UnsupportedProviderError(providerName);
        }
    }
}
