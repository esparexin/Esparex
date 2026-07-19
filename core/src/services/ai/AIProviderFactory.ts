import { AIProvider } from './AIProvider';
import { GeminiProvider } from './providers/GeminiProvider';

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
            default:
                throw new UnsupportedProviderError(providerName);
        }
    }
}
