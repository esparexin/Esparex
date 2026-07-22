import { Connection } from 'mongoose';
import logger from '../../utils/logger';

type ConnectionCache = {
    conn: Connection | null;
    isReady: boolean;
};

export function attachUserDBLogs(conn: Connection, userCache: ConnectionCache, adminCache: ConnectionCache, isUnified: boolean) {
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

export function attachAdminDBLogs(conn: Connection, userCache: ConnectionCache, adminCache: ConnectionCache, isUnified: boolean) {
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
