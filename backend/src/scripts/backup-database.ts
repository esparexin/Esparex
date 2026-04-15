#!/usr/bin/env ts-node
/**
 * MongoDB Backup Script
 * 
 * Creates compressed backups of MongoDB databases.
 * Supports both user and admin databases.
 * 
 * Usage:
 *   npm run backup              # Backup all databases
 *   npm run backup -- --db=user # Backup user database only
 *   npm run backup -- --db=admin # Backup admin database only
 * 
 * @module scripts/backup-database
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import env from '../config/env';
import { parseMongoUri } from '../utils/mongoUtils';

// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);


/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        logger.info('Created backup directory', { path: BACKUP_DIR });
    }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename(database: string, isEncrypted: boolean): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${database}_${timestamp}.gz${isEncrypted ? '.enc' : ''}`;
}

/**
 * Backup a MongoDB database
 */
function backupDatabase(uri: string, label: string): string {
    const { host, port, database, username, password } = parseMongoUri(uri);
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (env.NODE_ENV === 'production' && !encryptionKey) {
        logger.warn('⚠️ BACKUP_ENCRYPTION_KEY missing in production. Daily snapshot backups will be unencrypted.');
    }

    const isEncrypted = !!encryptionKey;
    const backupFile = path.join(BACKUP_DIR, getBackupFilename(database, isEncrypted));

    logger.info(`Starting backup: ${label}`, {
        database,
        host,
        port,
        backupFile,
    });

    try {
        let command = `mongodump --host=${host} --port=${port} --db=${database}`;

        if (username && password) {
            command += ` --username=${username} --password=${password} --authenticationDatabase=admin`;
        }

        if (isEncrypted) {
            // 🔒 AES-256-CBC Encryption Pipeline
            command += ` --archive | gzip | openssl enc -aes-256-cbc -salt -pass pass:${encryptionKey} -pbkdf2 -out ${backupFile}`;
        } else {
            command += ` --archive=${backupFile} --gzip`;
        }

        // Execute backup
        const startTime = Date.now();
        execSync(command, { stdio: 'pipe' });
        const duration = Date.now() - startTime;

        // Get backup file size
        const stats = fs.statSync(backupFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        logger.info(`Backup completed: ${label}`, {
            database,
            backupFile,
            size: `${sizeMB} MB`,
            duration: `${duration}ms`,
        });

        return backupFile;
    } catch (error) {
        logger.error(`Backup failed: ${label}`, {
            database,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups() {
    logger.info('Cleaning up old backups', { retentionDays: RETENTION_DAYS });

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    try {
        const files = fs.readdirSync(BACKUP_DIR);

        for (const file of files) {
            if (!file.endsWith('.gz') && !file.endsWith('.enc')) continue;

            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > retentionMs) {
                fs.unlinkSync(filePath);
                deletedCount++;
                logger.info('Deleted old backup', { file, ageDays: Math.floor(age / (24 * 60 * 60 * 1000)) });
            }
        }

        logger.info('Cleanup & Oplog Retention Check completed', { deletedCount });
    } catch (error) {
        logger.error('Cleanup failed', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Main backup function
 */
async function main() {
    const args = process.argv.slice(2);
    const dbArg = args.find(arg => arg.startsWith('--db='));
    const targetDb = dbArg ? dbArg.split('=')[1] : 'all';

    logger.info('MongoDB Backup Script Started', {
        target: targetDb,
        backupDir: BACKUP_DIR,
        retentionDays: RETENTION_DAYS,
    });

    try {
        // Ensure backup directory exists
        ensureBackupDir();

        const backups: string[] = [];

        // Backup user database
        if (targetDb === 'all' || targetDb === 'user') {
            const userBackup = await backupDatabase(env.MONGODB_URI, 'User Database');
            backups.push(userBackup);
        }

        // Backup admin database
        if (targetDb === 'all' || targetDb === 'admin') {
            const adminBackup = await backupDatabase(env.ADMIN_MONGODB_URI, 'Admin Database');
            backups.push(adminBackup);
        }

        // Clean up old backups
        cleanupOldBackups();

        logger.info('Backup process completed successfully', {
            backupsCreated: backups.length,
            backups,
        });

        process.exit(0);
    } catch (error) {
        logger.error('Backup process failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { backupDatabase, cleanupOldBackups };
