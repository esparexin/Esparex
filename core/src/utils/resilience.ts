import logger from './logger';

export class TimeoutError extends Error {
    public readonly code = 'TIMEOUT_ERROR';
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export const sleep = async (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

export async function withTimeout<T>(
    operation: Promise<T> | (() => Promise<T>),
    timeoutMs: number,
    label: string
): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const runtimePromise = typeof operation === 'function' ? operation() : operation;
        return await Promise.race([runtimePromise, timeoutPromise]);
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}

type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
    name: string;
    failureThreshold?: number;
    cooldownMs?: number;
    halfOpenSuccessThreshold?: number;
    timeoutMs?: number;
}

export class CircuitBreaker {
    private state: CircuitState = 'closed';
    private failureCount = 0;
    private halfOpenSuccessCount = 0;
    private openedAt = 0;
    private autoProbeTimer: NodeJS.Timeout | null = null;

    private readonly failureThreshold: number;
    private readonly cooldownMs: number;
    private readonly halfOpenSuccessThreshold: number;
    private readonly timeoutMs?: number;
    private readonly name: string;

    constructor(options: CircuitBreakerOptions) {
        this.name = options.name;
        this.failureThreshold = options.failureThreshold ?? 5;
        this.cooldownMs = options.cooldownMs ?? 30_000;
        this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 1;
        this.timeoutMs = options.timeoutMs;
        registeredCircuitBreakers.add(this);
    }

    private clearAutoProbeTimer(): void {
        if (!this.autoProbeTimer) return;
        clearTimeout(this.autoProbeTimer);
        this.autoProbeTimer = null;
    }

    private scheduleAutoProbe(): void {
        this.clearAutoProbeTimer();
        const timer = setTimeout(() => {
            this.autoProbeTimer = null;
            if (this.state === 'open') {
                this.transitionTo('half-open');
            }
        }, this.cooldownMs);
        timer.unref();
        this.autoProbeTimer = timer;
    }

    private transitionTo(next: CircuitState): void {
        if (this.state === next) return;
        this.state = next;
        if (next === 'closed') {
            this.clearAutoProbeTimer();
            this.failureCount = 0;
            this.halfOpenSuccessCount = 0;
            this.openedAt = 0;
        } else if (next === 'open') {
            this.openedAt = Date.now();
            this.halfOpenSuccessCount = 0;
            this.scheduleAutoProbe();
        } else if (next === 'half-open') {
            this.clearAutoProbeTimer();
            this.halfOpenSuccessCount = 0;
        }
        logger.warn('[CircuitBreaker] state transition', {
            breaker: this.name,
            state: this.state,
            failureCount: this.failureCount
        });
    }

    private canProbeHalfOpen(): boolean {
        return Date.now() - this.openedAt >= this.cooldownMs;
    }

    private beforeExecute(): void {
        if (this.state !== 'open') return;
        if (this.canProbeHalfOpen()) {
            this.transitionTo('half-open');
            return;
        }
        throw new Error(`[CircuitBreaker:${this.name}] OPEN`);
    }

    private onSuccess(): void {
        if (this.state === 'half-open') {
            this.halfOpenSuccessCount += 1;
            if (this.halfOpenSuccessCount >= this.halfOpenSuccessThreshold) {
                this.transitionTo('closed');
            }
            return;
        }
        this.failureCount = 0;
    }

    private onFailure(error: unknown): void {
        this.failureCount += 1;

        logger.error('[CircuitBreaker] execution failure', {
            breaker: this.name,
            state: this.state,
            failureCount: this.failureCount,
            error: error instanceof Error ? error.message : String(error),
        });

        if (this.state === 'half-open' || this.failureCount >= this.failureThreshold) {
            this.transitionTo('open');
        }
    }

    async execute<T>(
        operation: () => Promise<T>,
        fallback?: (error: unknown) => Promise<T> | T
    ): Promise<T> {
        try {
            this.beforeExecute();
            const result = this.timeoutMs
                ? await withTimeout(operation, this.timeoutMs, this.name)
                : await operation();
            this.onSuccess();
            return result;
        } catch (error: unknown) {
            this.onFailure(error);
            if (fallback) {
                logger.warn('[CircuitBreaker] fallback executed', {
                    breaker: this.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                return await fallback(error);
            }
            throw error;
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    getName(): string {
        return this.name;
    }

    forceReset(reason = 'manual_reset'): void {
        if (this.state === 'closed') return;
        logger.warn('[CircuitBreaker] force reset', {
            breaker: this.name,
            previousState: this.state,
            reason,
        });
        this.transitionTo('closed');
    }
}

export const isTimeoutError = (error: unknown): boolean =>
    error instanceof TimeoutError ||
    (error instanceof Error && error.message.toLowerCase().includes('timed out'));

const registeredCircuitBreakers = new Set<CircuitBreaker>();

export const getCircuitBreakerSnapshot = (): Array<{
    name: string;
    state: CircuitState;
}> => {
    return Array.from(registeredCircuitBreakers.values()).map((breaker) => ({
        name: breaker.getName(),
        state: breaker.getState(),
    }));
};

export const resetAllOpenCircuitBreakers = (reason = 'system_recovery'): number => {
    let resetCount = 0;
    for (const breaker of registeredCircuitBreakers.values()) {
        if (breaker.getState() !== 'closed') {
            breaker.forceReset(reason);
            resetCount += 1;
        }
    }
    return resetCount;
};
