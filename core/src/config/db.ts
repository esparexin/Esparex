/**
 * MongoDB Connection Manager
 * ---------------------------------------
 * - Supports User DB + Admin DB
 * - Safe for local, staging, production
 * - HMR / Nodemon safe (cached connections)
 * - Fail-fast (no silent failures)
 * - Clean logging
 * - Graceful shutdown support
 */

import mongoose, { Connection } from 'mongoose';
import logger from '../utils/logger';
import { mongooseSerializationPlugin } from './mongooseSerializationPlugin';
import { env } from './env';
import { sleep, withTimeout } from '../utils/resilience';
import { validateDatabaseUris } from './db/validation';
import { attachUserDBLogs, attachAdminDBLogs } from './db/listeners';
import { getDatabaseHealthProbeImpl, DatabaseHealthProbe, DbConnectionHealth } from './db/health';

export type { DatabaseHealthProbe, DbConnectionHealth };

/* ======================================================
   GLOBAL MONGOOSE SETTINGS
====================================================== */

mongoose.plugin(mongooseSerializationPlugin);

const shouldAutoIndex = env.ALLOW_BOOT_AUTO_INDEX;
if (shouldAutoIndex) {
    logger.warn('⚠ ALLOW_BOOT_AUTO_INDEX=true — startup index mutation is enabled for maintenance mode only.');
} else {
    logger.info('Boot safety mode: mongoose autoIndex disabled. Use explicit index maintenance commands.');
}

mongoose.set('autoIndex', shouldAutoIndex);

/* ======================================================
   ENV VALIDATION & CONNECTION URIS
====================================================== */

const { userDbUri: USER_DB_URI, adminDbUri: ADMIN_DB_URI } = validateDatabaseUris();

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
    if (isUnified && adminCache.conn) {
        if (!userCache.conn) {
            userCache.conn = adminCache.conn;
            userCache.isReady = adminCache.isReady;
        }
        return adminCache.conn;
    }

    if (!userCache.conn) {
        if (skipDbConnect) {
            userCache.conn = mongoose.createConnection();
            return userCache.conn;
        }
        logger.debug('Connecting to User DB', { uri: USER_DB_URI.split('@')[1] || 'localhost' });
        userCache.conn = mongoose.createConnection(USER_DB_URI, DB_CONNECTION_OPTIONS);
        attachUserDBLogs(userCache.conn, userCache, adminCache, isUnified);

        if (isUnified) {
            adminCache.conn = userCache.conn;
            adminCache.isReady = userCache.isReady;
            logger.info('Using unified database connection for User and Admin');
        }
    }
    return userCache.conn;
}

export function getAdminConnection(): Connection {
    if (isUnified && userCache.conn) {
        if (!adminCache.conn) {
            adminCache.conn = userCache.conn;
            adminCache.isReady = userCache.isReady;
        }
        return userCache.conn;
    }

    if (!adminCache.conn) {
        if (skipDbConnect) {
            adminCache.conn = mongoose.createConnection();
            return adminCache.conn;
        }
        logger.debug('Connecting to Admin DB', { uri: ADMIN_DB_URI.split('@')[1] || 'localhost' });
        adminCache.conn = mongoose.createConnection(ADMIN_DB_URI, DB_CONNECTION_OPTIONS);

        attachAdminDBLogs(adminCache.conn, userCache, adminCache, isUnified);

        if (isUnified) {
            userCache.conn = adminCache.conn;
            userCache.isReady = userCache.isReady;
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
                throw err;
            }

            await sleep(backoffMs);
        }
    }
}

export const getDatabaseHealthProbe = async (): Promise<DatabaseHealthProbe> => {
    return getDatabaseHealthProbeImpl(userCache.conn, adminCache.conn);
};

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
