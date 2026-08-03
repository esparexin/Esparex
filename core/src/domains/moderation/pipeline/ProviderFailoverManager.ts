/**
 * Provider Failover Manager (PR 4 — Multi-Cloud Resilience)
 *
 * Manages provider ordering, circuit breaker state tracking, failover routing,
 * and availability health reporting across registered provider adapters.
 * Reuses the enterprise CircuitBreaker from core/src/utils/resilience.ts.
 */
import { CircuitBreaker, CircuitBreakerOptions } from '../../../utils/resilience';
import { ImageModerationProvider, ImageModerationRequest, ImageModerationResponse } from '../../../services/ai/moderation/types';
import logger from '../../../utils/logger';

export interface ProviderHealthStatus {
    name: string;
    state: 'closed' | 'open' | 'half-open';
}

export interface RegisteredProvider {
    name: string;
    provider: ImageModerationProvider;
    breaker: CircuitBreaker;
}

export class AllProvidersFailedError extends Error {
    public readonly code = 'ALL_PROVIDERS_FAILED';
    public readonly errors: Array<{ providerName: string; error: string }>;

    constructor(message: string, errors: Array<{ providerName: string; error: string }>) {
        super(message);
        this.name = 'AllProvidersFailedError';
        this.errors = errors;
    }
}

export class ProviderFailoverManager {
    private registeredProviders: RegisteredProvider[] = [];

    constructor(
        providers: Array<{
            name: string;
            provider: ImageModerationProvider;
            breakerOptions?: Partial<CircuitBreakerOptions>;
        }> = []
    ) {
        providers.forEach((item) => this.registerProvider(item.name, item.provider, item.breakerOptions));
    }

    /**
     * Registers a new provider along with its circuit breaker configuration.
     */
    registerProvider(
        name: string,
        provider: ImageModerationProvider,
        breakerOptions: Partial<CircuitBreakerOptions> = {}
    ): void {
        const breaker = new CircuitBreaker({
            name: `provider:${name}`,
            failureThreshold: breakerOptions.failureThreshold ?? 3,
            cooldownMs: breakerOptions.cooldownMs ?? 15_000,
            halfOpenSuccessThreshold: breakerOptions.halfOpenSuccessThreshold ?? 1,
            timeoutMs: breakerOptions.timeoutMs ?? 10_000,
        });

        this.registeredProviders.push({ name, provider, breaker });
        logger.info('[ProviderFailoverManager] Registered provider', { name });
    }

    /**
     * Executes moderation request across registered providers in sequence.
     * Skips OPEN circuit breakers and automatically falls back to the next healthy provider.
     */
    async executeWithFailover(request: ImageModerationRequest): Promise<ImageModerationResponse> {
        if (this.registeredProviders.length === 0) {
            throw new AllProvidersFailedError('No providers registered in failover manager', []);
        }

        const errorLog: Array<{ providerName: string; error: string }> = [];

        for (const item of this.registeredProviders) {
            const state = item.breaker.getState();

            // Skip providers currently in OPEN circuit breaker state
            if (state === 'open') {
                logger.warn('[ProviderFailoverManager] Bypassing provider in OPEN circuit breaker state', {
                    providerName: item.name,
                });
                errorLog.push({ providerName: item.name, error: 'CircuitBreaker OPEN' });
                continue;
            }

            try {
                const response = await item.breaker.execute(() => item.provider.moderateImage(request));
                logger.info('[ProviderFailoverManager] Request successfully processed by provider', {
                    providerName: item.name,
                });
                return response;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.warn('[ProviderFailoverManager] Provider execution failed, attempting failover', {
                    providerName: item.name,
                    error: errorMessage,
                });
                errorLog.push({ providerName: item.name, error: errorMessage });
            }
        }

        throw new AllProvidersFailedError(
            `All ${this.registeredProviders.length} moderation providers failed or were unavailable`,
            errorLog
        );
    }

    /**
     * Returns health status and circuit states for all registered providers.
     */
    getProviderHealthStatuses(): ProviderHealthStatus[] {
        return this.registeredProviders.map((item) => ({
            name: item.name,
            state: item.breaker.getState(),
        }));
    }

    /**
     * Returns total number of registered providers.
     */
    getProviderCount(): number {
        return this.registeredProviders.length;
    }
}
