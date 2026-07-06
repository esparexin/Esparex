/**
 * MongoDB Connection Manager
 * ---------------------------------------
 * - Supports User DB + Admin DB
 * - Safe for local, staging, production
 * - HMR / Nodemon safe (cached connections)
 * - Fail-fast (no silent failures)
 * - Clean logging
 * - Graceful shutdown support
 *
 * NOTE:
 * This is a backend-only module.
 * Browser / CORS concerns do NOT apply here.
 */

import mongoose, { Connection } from 'mongoose';
import logger from '../../utils/logger';
import { mongooseSerializationPlugin } from './mongooseSerializationPlugin';
import { env } from '../../config/env';
import { sleep, withTimeout } from '../../utils/resilience';
import { dbConnectionStatus, reliabilityAlertsTotal } from '../telemetry/metrics';
// Lazy import to break circular dependency: db → reliabilityAlerts → EmailService → db
// Static import causes isUnified TDZ crash during module initialization.
type EmitReliabilityAlert = typeof import('../telemetry/reliabilityAlerts').emitReliabilityAlert;
let _emitReliabilityAlert: EmitReliabilityAlert | null = null;
function getEmitReliabilityAlert(): EmitReliabilityAlert {
    if (!_emitReliabilityAlert) {
         
        _emitReliabilityAlert = require('../telemetry/reliabilityAlerts').emitReliabilityAlert as EmitReliabilityAlert;
    }
    return _emitReliabilityAlert;
}
// Lazy import to break circular dependency: db → sloMonitor → reliabilityAlerts → EmailService → db
type RecordDbResponseSample = typeof import('../telemetry/sloMonitor').recordDbResponseSample;
let _recordDbResponseSample: RecordDbResponseSample | null = null;
function getRecordDbResponseSample(): RecordDbResponseSample {
    if (!_recordDbResponseSample) {
         
        _recordDbResponseSample = require('../telemetry/sloMonitor').recordDbResponseSample as RecordDbResponseSample;
    }
    return _recordDbResponseSample;
}

/* ======================================================
   GLOBAL MONGOOSE SETTINGS
====================================================== */

mongoose.plugin(mongooseSerializationPlugin);

// Boot safety: index mutation is disabled on normal startup.
// Use explicit maintenance commands/migrations for index changes.
const shouldAutoIndex = env.ALLOW_BOOT_AUTO_INDEX;
if (shouldAutoIndex) {
    logger.warn('⚠ ALLOW_BOOT_AUTO_INDEX=true — startup index mutation is enabled for maintenance mode only.');
} else {
    logger.info('Boot safety mode: mongoose autoIndex disabled. Use explicit index maintenance commands.');
}

mongoose.set('autoIndex', shouldAutoIndex);
// Fail fast on disconnected/default-connection queries instead of buffering.


/* ======================================================
   ENV VALIDATION
====================================================== */

const isProd = env.NODE_ENV === 'production';

if (isProd && !env.MONGODB_URI) {
    throw new Error('❌ MONGODB_URI is required in production');
}

if (isProd && !env.ADMIN_MONGODB_URI) {
    throw new Error('❌ ADMIN_MONGODB_URI is required in production');
}

if (isProd) {
    const mongoUri = env.MONGODB_URI;
    const adminUri = env.ADMIN_MONGODB_URI;

    const validateUri = (uri: string | undefined, label: string) => {
        if (!uri) return;
        if (uri.includes('root:')) {
            throw new Error(`🚨 SECURITY ERROR: Root user detected in ${label} MONGODB_URI. Use a least-privilege DB user.`);
        }
        if (!uri.includes('tls=true') && !uri.includes('ssl=true')) {
            logger.warn(`⚠️  SECURITY: ${label} MONGODB_URI should enforce tls=true or ssl=true in production.`);
        }
        if (!uri.includes('authMechanism=SCRAM')) {
            logger.warn(`⚠️  SECURITY: ${label} MONGODB_URI should explicitly use authMechanism=SCRAM-SHA-256 for secure handshakes.`);
        }
    };

    validateUri(mongoUri, 'Main');
    
    // Only validate Admin URI separately if it's different from Main URI to avoid duplicate logs
    if (adminUri !== mongoUri) {
        validateUri(adminUri, 'Admin');
    }
}

/* ======================================================
   CONNECTION URIS (BACKEND ONLY)
====================================================== */

const USER_DB_URI =
    env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

const ADMIN_DB_URI =
    env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';

if (!env.MONGODB_URI) {
    logger.warn('Using local User MongoDB (development mode)');
}

if (!env.ADMIN_MONGODB_URI) {
    logger.warn('ADMIN_MONGODB_URI not set. Using local Admin MongoDB default (development mode).');
}

if (env.MONGODB_URI && env.ADMIN_MONGODB_URI && env.MONGODB_URI === env.ADMIN_MONGODB_URI) {
    logger.warn('User and Admin databases point to the same URI. Split architecture is disabled for this runtime.');
}

/* ======================================================
   GLOBAL CACHE (HMR / NODEMON SAFE)
====================================================== */

interface ConnectionCache {
    conn: Connection | null;
    isReady: boolean;
}

const globalWithMongoose = global as typeof globalThis & {
    mongooseUserCache?: ConnectionCache;
    mongooseAdminCache?: ConnectionCache;
};

if (!globalWithMongoose.mongooseUserCache) {
    globalWithMongoose.mongooseUserCache = { conn: null, isReady: false };
}

if (!globalWithMongoose.mongooseAdminCache) {
    globalWithMongoose.mongooseAdminCache = { conn: null, isReady: false };
}

const userCache = globalWithMongoose.mongooseUserCache;
const adminCache = globalWithMongoose.mongooseAdminCache;

const isUnified = USER_DB_URI === ADMIN_DB_URI;
const skipDbConnect = env.NODE_ENV === 'test' && !env.ALLOW_DB_CONNECT;
const DB_CONNECT_MAX_ATTEMPTS = env.NODE_ENV === 'production' ? 5 : 3;
const DB_CONNECT_BASE_BACKOFF_MS = 1_000;
const DB_CONNECT_TIMEOUT_MS = 15_000;
const DB_OPERATION_TIMEOUT_MS = 2_500;
const DB_CONNECTION_OPTIONS = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 50,
    minPoolSize: 5,
    heartbeatFrequencyMS: 10_000,
    retryWrites: true,
};

/* ======================================================
   READINESS CHECK
====================================================== */

export function isDbReady(): boolean {
    return userCache.isReady && adminCache.isReady;
}

/* ======================================================
   CONNECTION FACTORIES
====================================================== */

export function getUserConnection(): Connection {
    // 1. If we are unified and Admin is already connected, reuse it
    if (isUnified && adminCache.conn) {
        if (!userCache.conn) {
            userCache.conn = adminCache.conn;
            userCache.isReady = adminCache.isReady;
        }
        return adminCache.conn;
    }

    // 2. Otherwise create new connection if needed
    if (!userCache.conn) {
        if (skipDbConnect) {
            userCache.conn = mongoose.createConnection();
            return userCache.conn;
        }
        logger.debug('Connecting to User DB', { uri: USER_DB_URI.split('@')[1] || 'localhost' });
        userCache.conn = mongoose.createConnection(USER_DB_URI, DB_CONNECTION_OPTIONS);
        attachUserDBLogs(userCache.conn);

        // 3. Share with Admin if unified
        if (isUnified) {
            adminCache.conn = userCache.conn;
            adminCache.isReady = userCache.isReady;
            logger.info('Using unified database connection for User and Admin');
        }
    }
    return userCache.conn;
}

export function getAdminConnection(): Connection {
    // 1. If we are unified and User is already connected, reuse it
    if (isUnified && userCache.conn) {
        if (!adminCache.conn) {
            adminCache.conn = userCache.conn;
            adminCache.isReady = userCache.isReady;
        }
        return userCache.conn;
    }

    // 2. Otherwise create new connection if needed
    if (!adminCache.conn) {
        if (skipDbConnect) {
            adminCache.conn = mongoose.createConnection();
            return adminCache.conn;
        }
        logger.debug('Connecting to Admin DB', { uri: ADMIN_DB_URI.split('@')[1] || 'localhost' });
        adminCache.conn = mongoose.createConnection(ADMIN_DB_URI, DB_CONNECTION_OPTIONS);

        attachAdminDBLogs(adminCache.conn);

        // 3. Share with User if unified (handle case where Admin initialized first)
        if (isUnified) {
            userCache.conn = adminCache.conn;
            userCache.isReady = adminCache.isReady;
            logger.info('Using unified database connection for Admin and User');
        }
    }
    return adminCache.conn;
}


const closeConnectionForRetry = async (conn: Connection | null): Promise<void> => {
    if (!conn) return;
    try {
        await conn.close(true);
    } catch (error) {
        logger.warn('Failed closing Mongo connection during retry reset', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

const resetConnectionCaches = async (): Promise<void> => {
    await Promise.all([
        closeConnectionForRetry(userCache.conn),
        isUnified ? Promise.resolve() : closeConnectionForRetry(adminCache.conn),
    ]);
    userCache.conn = null;
    adminCache.conn = null;
    userCache.isReady = false;
    adminCache.isReady = false;
};

const computeBackoffMs = (attempt: number): number =>
    Math.min(DB_CONNECT_BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1)), 15_000);

const pingConnection = async (conn: Connection, label: 'user' | 'admin'): Promise<void> => {
    if (!conn.db) {
        throw new Error(`${label} connection has no database handle`);
    }
    await withTimeout(
        conn.db.admin().ping().then(() => undefined),
        DB_OPERATION_TIMEOUT_MS,
        `Mongo ${label} ping`
    );
};

/* ======================================================
   INITIALIZE DATABASES (FAIL FAST)
====================================================== */

export async function connectDB() {
    if (skipDbConnect) {
        logger.info('Skipping DB connection in test environment');
        return;
    }

    for (let attempt = 1; attempt <= DB_CONNECT_MAX_ATTEMPTS; attempt += 1) {
        try {
            const userConn = getUserConnection();
            const adminConn = getAdminConnection();

            await withTimeout(
                Promise.all([
                    userConn.asPromise(),
                    adminConn.asPromise(),
                ]).then(() => undefined),
                DB_CONNECT_TIMEOUT_MS,
                'Mongo bootstrap'
            );

            await Promise.all([
                pingConnection(userConn, 'user'),
                pingConnection(adminConn, 'admin'),
            ]);

            logger.info('All databases connected successfully', { attempt });
            return;
        } catch (err) {
            const backoffMs = computeBackoffMs(attempt);
            logger.error('Database connection attempt failed', {
                attempt,
                maxAttempts: DB_CONNECT_MAX_ATTEMPTS,
                backoffMs,
                error: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined,
            });

            await resetConnectionCaches();

            if (attempt >= DB_CONNECT_MAX_ATTEMPTS) {
                throw err; // 🚫 STOP SERVER BOOT
            }

            await sleep(backoffMs);
        }
    }
}

type DbConnectionHealth = {
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

const readyStateToLabel = (readyState: number): string => {
    switch (readyState) {
        case mongoose.ConnectionStates.connected: return 'connected';
        case mongoose.ConnectionStates.connecting: return 'connecting';
        case mongoose.ConnectionStates.disconnecting: return 'disconnecting';
        case mongoose.ConnectionStates.disconnected: return 'disconnected';
        default: return 'unknown';
    }
};

const probeConnection = async (conn: Connection | null, label: 'user' | 'admin'): Promise<DbConnectionHealth> => {
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

export const getDatabaseHealthProbe = async (): Promise<DatabaseHealthProbe> => {
    const [userHealth, adminHealth] = await Promise.all([
        probeConnection(userCache.conn, 'user'),
        probeConnection(adminCache.conn, 'admin'),
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

/* ======================================================
   LOGGING HELPERS
====================================================== */

function attachUserDBLogs(conn: Connection) {
    conn.on('connected', () => {
        userCache.isReady = true;
        if (isUnified) adminCache.isReady = true;
        logger.info('User DB connected', { database: 'esparex_user' });
    });

    conn.on('error', (err: Error) => {
        userCache.isReady = false;
        if (isUnified) adminCache.isReady = false;
        logger.error('User DB error', { error: err.message });
    });

    conn.on('disconnected', () => {
        userCache.isReady = false;
        if (isUnified) adminCache.isReady = false;
        logger.warn('User DB disconnected');
    });

    conn.on('reconnected', () => {
        userCache.isReady = true;
        if (isUnified) adminCache.isReady = true;
        logger.info('User DB reconnected');
    });
}

function attachAdminDBLogs(conn: Connection) {
    conn.on('connected', () => {
        adminCache.isReady = true;
        if (isUnified) userCache.isReady = true;
        logger.info('Admin DB connected', { database: 'esparex_admin' });
    });

    conn.on('error', (err: Error) => {
        adminCache.isReady = false;
        if (isUnified) userCache.isReady = false;
        logger.error('Admin DB error', { error: err.message });
    });

    conn.on('disconnected', () => {
        adminCache.isReady = false;
        if (isUnified) userCache.isReady = false;
        logger.warn('Admin DB disconnected');
    });

    conn.on('reconnected', () => {
        adminCache.isReady = true;
        if (isUnified) userCache.isReady = true;
        logger.info('Admin DB reconnected');
    });
}

/* ======================================================
   GRACEFUL SHUTDOWN (NO ZOMBIE CONNECTIONS)
====================================================== */

export async function closeDB() {
    try {
        const seenConnectionIds = new Set<number>();
        const closeOperations: Promise<unknown>[] = [];
        [userCache.conn, adminCache.conn].forEach((conn) => {
            if (!conn) return;
            if (seenConnectionIds.has(conn.id)) return;
            seenConnectionIds.add(conn.id);
            closeOperations.push(conn.close());
        });
        await Promise.all(closeOperations);
        userCache.isReady = false;
        adminCache.isReady = false;
        userCache.conn = null;
        adminCache.conn = null;
    } catch (err) {
        logger.error('Error during DB shutdown', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

async function shutdown(signal: string) {
    logger.warn(`${signal} received. Closing database connections...`, { signal });
    await closeDB();
    process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

/* ======================================================
   CRASH SAFETY (FAIL FAST)
====================================================== */

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', {
        error: err.message,
        stack: err.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED REJECTION', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    process.exit(1);
});
