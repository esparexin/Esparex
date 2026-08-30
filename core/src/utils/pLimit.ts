type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

export const pLimit = (concurrency: number): LimitFunction => {
    const queue: Array<() => void> = [];
    let active = 0;

    const next = () => {
        active--;
        if (queue.length > 0) {
            const entry = queue.shift()!;
            entry();
        }
    };

    const run = async <T>(fn: () => Promise<T>, resolve: (val: T) => void, reject: (err: unknown) => void) => {
        active++;
        try {
            const result = await fn();
            resolve(result);
        } catch (err) {
            reject(err);
        }
        next();
    };

    const enqueue = <T>(fn: () => Promise<T>, resolve: (val: T) => void, reject: (err: unknown) => void) => {
        queue.push(() => run(fn, resolve, reject));
    };

    return <T>(fn: () => Promise<T>) =>
        new Promise<T>((resolve, reject) => {
            const entry = () => run(fn, resolve, reject);
            if (active < concurrency) {
                entry();
            } else {
                enqueue(fn, resolve, reject);
            }
        });
};

/**
 * Shared concurrency cap for all admin bulk moderation operations.
 *
 * Applied uniformly to:
 *   - Listing bulk approve / reject / deactivate / expire / extend
 *   - Business bulk approve / reject / deactivate / expire / renew
 *
 * Centralised here to prevent independent re-declarations diverging over time.
 * Increase with caution — higher values raise DB connection pressure under load.
 */
export const ADMIN_BULK_CONCURRENCY = 5;