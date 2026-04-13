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
import logger from '../utils/logger';
import { mongooseSerializationPlugin } from '../plugins/mongooseSerializationPlugin';
import { env } from './env';

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
        userCache.conn = mongoose.createConnection(USER_DB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 30000,
        });
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
        adminCache.conn = mongoose.createConnection(ADMIN_DB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 30000,
        });

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


/* ======================================================
   INITIALIZE DATABASES (FAIL FAST)
====================================================== */

export async function connectDB() {
    try {
        if (skipDbConnect) {
            logger.info('Skipping DB connection in test environment');
            return;
        }
        const userConn = getUserConnection();
        const adminConn = getAdminConnection();

        await Promise.all([
            userConn.asPromise(),
            adminConn.asPromise(),
        ]);

        logger.info('All databases connected successfully');
    } catch (err) {
        logger.error('Database connection failed', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
        throw err; // 🚫 STOP SERVER BOOT
    }
}

/* ======================================================
   LOGGING HELPERS
====================================================== */

function attachUserDBLogs(conn: Connection) {
    conn.on('connected', () => {
        userCache.isReady = true;
        if (isUnified) adminCache.isReady = true;
        logger.info('User DB connected', { database: 'esparex_user' });
    });

    conn.on('error', (err) => {
        userCache.isReady = false;
        if (isUnified) adminCache.isReady = false;
        logger.error('User DB error', { error: err.message });
    });

    conn.on('disconnected', () => {
        userCache.isReady = false;
        if (isUnified) adminCache.isReady = false;
        logger.warn('User DB disconnected');
    });
}

function attachAdminDBLogs(conn: Connection) {
    conn.on('connected', () => {
        adminCache.isReady = true;
        if (isUnified) userCache.isReady = true;
        logger.info('Admin DB connected', { database: 'esparex_admin' });
    });

    conn.on('error', (err) => {
        adminCache.isReady = false;
        if (isUnified) userCache.isReady = false;
        logger.error('Admin DB error', { error: err.message });
    });

    conn.on('disconnected', () => {
        adminCache.isReady = false;
        if (isUnified) userCache.isReady = false;
        logger.warn('Admin DB disconnected');
    });
}

/* ======================================================
   GRACEFUL SHUTDOWN (NO ZOMBIE CONNECTIONS)
====================================================== */

export async function closeDB() {
    try {
        await Promise.all([
            userCache.conn?.close(),
            adminCache.conn?.close(),
        ]);
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

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

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
