import redis from '../redis';
import logger from '../../utils/logger';

export type WorkerHealthState = 'starting' | 'up' | 'degraded' | 'down';

export interface WorkerStatusEntry {
    name: string;
    status: WorkerHealthState;
    lastSeen: string | null;
    details?: Record<string, unknown>;
}

const WORKER_HEARTBEAT_PREFIX = 'system:worker:heartbeat';
const WORKER_HEARTBEAT_TTL_SECONDS = 45;

const knownWorkers = [
    'AdWorker',
    'NotificationDeliveryWorker',
    'NotificationMatchWorker',
    'PaymentWorker',
    'ImageOptimizationWorker',
] as const;

const localWorkerState = new Map<string, WorkerStatusEntry>();

const heartbeatKey = (workerName: string): string => `${WORKER_HEARTBEAT_PREFIX}:${workerName}`;

const normalizeEntry = (
    workerName: string,
    entry: Partial<WorkerStatusEntry> | null | undefined
): WorkerStatusEntry => ({
    name: workerName,
    status: entry?.status || 'down',
    lastSeen: entry?.lastSeen || null,
    details: entry?.details,
});

export const setLocalWorkerStatus = (
    workerName: string,
    status: WorkerHealthState,
    details?: Record<string, unknown>
): void => {
    localWorkerState.set(workerName, {
        name: workerName,
        status,
        lastSeen: new Date().toISOString(),
        details,
    });
};

export const getLocalWorkerStatuses = (): WorkerStatusEntry[] => {
    return Array.from(localWorkerState.values());
};

export const publishWorkerHeartbeat = async (
    workerName: string,
    status: WorkerHealthState,
    details?: Record<string, unknown>
): Promise<void> => {
    const entry = normalizeEntry(workerName, {
        status,
        lastSeen: new Date().toISOString(),
        details,
    });

    setLocalWorkerStatus(workerName, status, details);

    try {
        await redis.set(heartbeatKey(workerName), JSON.stringify(entry), 'EX', WORKER_HEARTBEAT_TTL_SECONDS);
    } catch (error) {
        logger.warn('[WORKER_HEARTBEAT] failed to publish worker heartbeat', {
            workerName,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

const readRemoteWorkerEntries = async (): Promise<WorkerStatusEntry[]> => {
    const keys = knownWorkers.map((workerName) => heartbeatKey(workerName));
    try {
        const rawEntries = await redis.mget(...keys);
        return rawEntries.map((raw, index) => {
            const workerName = knownWorkers[index];
            if (!raw) return normalizeEntry(workerName, null);

            try {
                const parsed = JSON.parse(raw) as Partial<WorkerStatusEntry>;
                return normalizeEntry(workerName, parsed);
            } catch {
                return normalizeEntry(workerName, null);
            }
        });
    } catch (error) {
        logger.warn('[WORKER_HEALTH] failed to read worker heartbeats', {
            error: error instanceof Error ? error.message : String(error),
        });
        return knownWorkers.map((workerName) => normalizeEntry(workerName, null));
    }
};

export const getWorkerStatusProbe = async (): Promise<{
    status: 'up' | 'degraded' | 'down';
    workers: WorkerStatusEntry[];
}> => {
    const remoteEntries = await readRemoteWorkerEntries();

    const merged = remoteEntries.map((entry) => {
        const local = localWorkerState.get(entry.name);
        if (!local) return entry;
        if (!entry.lastSeen) return local;
        return entry;
    });

    const upCount = merged.filter((entry) => entry.status === 'up').length;
    const degradedCount = merged.filter((entry) => entry.status === 'degraded' || entry.status === 'starting').length;

    const status: 'up' | 'degraded' | 'down' =
        upCount === merged.length
            ? 'up'
            : upCount > 0 || degradedCount > 0
                ? 'degraded'
                : 'down';

    return {
        status,
        workers: merged,
    };
};

export const getKnownWorkers = (): readonly string[] => knownWorkers;
