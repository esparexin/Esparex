import mongoose, { Connection } from 'mongoose';
import { withTimeout } from '../../utils/resilience';
import { dbConnectionStatus, reliabilityAlertsTotal } from '../../utils/metrics';

type EmitReliabilityAlert = (event: {
    type: string;
    title: string;
    severity: 'critical' | 'high' | 'warning' | 'info';
    summary: string;
    dedupeKey?: string;
    metadata?: Record<string, unknown>;
}) => void | Promise<void>;

let _emitReliabilityAlert: EmitReliabilityAlert | null = null;
function getEmitReliabilityAlert(): EmitReliabilityAlert {
    if (!_emitReliabilityAlert) {
        const alertsPath = '../../utils/reliabilityAlerts';
        _emitReliabilityAlert = require(alertsPath).emitReliabilityAlert as EmitReliabilityAlert;
    }
    return _emitReliabilityAlert;
}

type RecordDbResponseSample = (latencyMs: number) => void;

let _recordDbResponseSample: RecordDbResponseSample | null = null;
function getRecordDbResponseSample(): RecordDbResponseSample {
    if (!_recordDbResponseSample) {
        const sloPath = '../../utils/sloMonitor';
        _recordDbResponseSample = require(sloPath).recordDbResponseSample as RecordDbResponseSample;
    }
    return _recordDbResponseSample;
}

export type DbConnectionHealth = {
    status: 'up' | 'down';
    readyState: number;
    stateLabel: string;
    pingOk: boolean;
    latencyMs: number | null;
    error?: string;
};

export type DatabaseHealthProbe = {
    overall: 'up' | 'degraded' | 'down';
    user: DbConnectionHealth;
    admin: DbConnectionHealth;
};

const DB_OPERATION_TIMEOUT_MS = 2_500;

const readyStateToLabel = (readyState: number): string => {
    switch (readyState) {
        case mongoose.ConnectionStates.connected: return 'connected';
        case mongoose.ConnectionStates.connecting: return 'connecting';
        case mongoose.ConnectionStates.disconnecting: return 'disconnecting';
        case mongoose.ConnectionStates.disconnected: return 'disconnected';
        default: return 'unknown';
    }
};

export const probeConnection = async (conn: Connection | null, label: 'user' | 'admin'): Promise<DbConnectionHealth> => {
    if (!conn) {
        dbConnectionStatus.labels(label).set(0);
        return {
            status: 'down',
            readyState: mongoose.ConnectionStates.disconnected,
            stateLabel: 'not_initialized',
            pingOk: false,
            latencyMs: null,
            error: `${label} connection not initialized`
        };
    }

    const readyState = conn.readyState;
    const stateLabel = readyStateToLabel(readyState);
    if (readyState !== mongoose.ConnectionStates.connected || !conn.db) {
        dbConnectionStatus.labels(label).set(0);
        return {
            status: 'down',
            readyState,
            stateLabel,
            pingOk: false,
            latencyMs: null,
            error: `${label} connection is ${stateLabel}`
        };
    }

    const startedAt = Date.now();
    try {
        await withTimeout(
            conn.db.admin().ping().then(() => undefined),
            DB_OPERATION_TIMEOUT_MS,
            `Mongo ${label} health ping`
        );
        const latencyMs = Date.now() - startedAt;
        getRecordDbResponseSample()(latencyMs);
        dbConnectionStatus.labels(label).set(1);
        return {
            status: 'up',
            readyState,
            stateLabel,
            pingOk: true,
            latencyMs,
        };
    } catch (error) {
        const latencyMs = Date.now() - startedAt;
        getRecordDbResponseSample()(latencyMs);
        dbConnectionStatus.labels(label).set(0);
        return {
            status: 'down',
            readyState,
            stateLabel,
            pingOk: false,
            latencyMs,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const getDatabaseHealthProbeImpl = async (
    userConn: Connection | null,
    adminConn: Connection | null
): Promise<DatabaseHealthProbe> => {
    const [userHealth, adminHealth] = await Promise.all([
        probeConnection(userConn, 'user'),
        probeConnection(adminConn, 'admin'),
    ]);

    const overall: DatabaseHealthProbe['overall'] =
        userHealth.status === 'up' && adminHealth.status === 'up'
            ? 'up'
            : userHealth.status === 'down' && adminHealth.status === 'down'
                ? 'down'
                : 'degraded';

    if (overall === 'down') {
        reliabilityAlertsTotal.labels('DATABASE_DOWN', 'critical').inc();
        void getEmitReliabilityAlert()({
            type: 'DATABASE_DOWN',
            title: 'Database connectivity failure',
            severity: 'critical',
            summary: 'Both user and admin MongoDB probes are down',
            dedupeKey: 'database_down',
            metadata: {
                user: userHealth,
                admin: adminHealth,
            },
        });
    } else if (overall === 'degraded') {
        reliabilityAlertsTotal.labels('DATABASE_DEGRADED', 'high').inc();
        void getEmitReliabilityAlert()({
            type: 'DATABASE_DEGRADED',
            title: 'Database degraded',
            severity: 'high',
            summary: 'One or more MongoDB probes are degraded/down',
            dedupeKey: 'database_degraded',
            metadata: {
                user: userHealth,
                admin: adminHealth,
            },
        });
    }

    return {
        overall,
        user: userHealth,
        admin: adminHealth,
    };
};
