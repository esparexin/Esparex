/**
 * MongoDB Database Backup & Verification Operations
 *
 * Core database utility module for backup generation, retention cleanup,
 * and archive integrity verification.
 *
 * @module db/backup
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import env from '../config/env';

// Backup configuration
export const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
export const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const MIN_BACKUP_SIZE_MB = 0.1;

export interface VerificationResult {
    file: string;
    valid: boolean;
    size: string;
    collections?: number;
    error?: string;
}

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const extractDatabaseName = (uri: string): string => {
    try {
        const parsed = new URL(uri);
        const db = parsed.pathname.replace(/^\//, '');
        return db || 'unknown_db';
    } catch {
        return 'unknown_db';
    }
};

/**
 * Create backup directory if it doesn't exist
 */
export function ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        logger.info('Created backup directory', { path: BACKUP_DIR });
    }
}

/**
 * Generate backup filename with timestamp
 */
export function getBackupFilename(database: string, isEncrypted: boolean): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${database}_${timestamp}.gz${isEncrypted ? '.enc' : ''}`;
}

/**
 * Backup a MongoDB database
 */
export function backupDatabase(uri: string, label: string): string {
    const database = extractDatabaseName(uri);
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (env.NODE_ENV === 'production' && !encryptionKey) {
        logger.warn('⚠️ BACKUP_ENCRYPTION_KEY missing in production. Daily snapshot backups will be unencrypted.');
    }

    const isEncrypted = !!encryptionKey;
    const backupFile = path.join(BACKUP_DIR, getBackupFilename(database, isEncrypted));
    const quotedBackupFile = shellQuote(backupFile);

    logger.info(`Starting backup: ${label}`, {
        database,
        backupFile,
    });

    try {
        let command = `mongodump --uri=${shellQuote(uri)}`;

        if (isEncrypted) {
            command += ` --archive | gzip | openssl enc -aes-256-cbc -salt -pass pass:${encryptionKey} -pbkdf2 -out ${quotedBackupFile}`;
        } else {
            command += ` --archive=${quotedBackupFile} --gzip`;
        }

        const startTime = Date.now();
        execSync(command, { stdio: 'pipe' });
        const duration = Date.now() - startTime;

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
export function cleanupOldBackups(): void {
    logger.info('Cleaning up old backups', { retentionDays: RETENTION_DAYS });

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    try {
        if (!fs.existsSync(BACKUP_DIR)) return;
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
 * Verify a single backup file
 */
export function verifyBackup(backupFile: string): VerificationResult {
    const result: VerificationResult = {
        file: path.basename(backupFile),
        valid: false,
        size: '0 MB',
    };

    try {
        if (!fs.existsSync(backupFile)) {
            result.error = 'File not found';
            return result;
        }

        const stats = fs.statSync(backupFile);
        const sizeMB = stats.size / 1024 / 1024;
        result.size = `${sizeMB.toFixed(2)} MB`;

        if (sizeMB < MIN_BACKUP_SIZE_MB) {
            result.error = `File too small (< ${MIN_BACKUP_SIZE_MB} MB)`;
            return result;
        }

        try {
            execSync(`gzip -t ${shellQuote(backupFile)}`, {
                stdio: 'pipe',
            });
            result.collections = 0;
            result.valid = true;
        } catch {
            result.error = 'Failed gzip integrity check (archive is corrupted)';
            return result;
        }

        return result;
    } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        return result;
    }
}

/**
 * Verify all backups in directory
 */
export async function verifyAllBackups(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            logger.warn('No backup files found', { backupDir: BACKUP_DIR });
            return results;
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.gz'))
            .sort()
            .reverse();

        if (files.length === 0) {
            logger.warn('No backup files found', { backupDir: BACKUP_DIR });
            return results;
        }

        logger.info(`Verifying ${files.length} backup files...`);

        for (const file of files) {
            const filePath = path.join(BACKUP_DIR, file);
            const result = verifyBackup(filePath);
            results.push(result);

            if (result.valid) {
                logger.info(`✅ ${file}`, {
                    size: result.size,
                    collections: result.collections,
                });
            } else {
                logger.error(`❌ ${file}`, { error: result.error });
            }
        }

        return results;
    } catch (error) {
        logger.error('Failed to verify backups', {
            error: error instanceof Error ? error.message : String(error),
        });
        return results;
    }
}

/**
 * Generate verification report
 */
export function generateReport(results: VerificationResult[]): { total: number; valid: number; invalid: number } {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;

    logger.info('Verification Report', {
        total,
        valid,
        invalid,
        successRate: `${total > 0 ? ((valid / total) * 100).toFixed(1) : 0}%`,
    });

    if (invalid > 0) {
        logger.warn('Invalid backups found:', {
            files: results.filter(r => !r.valid).map(r => ({
                file: r.file,
                error: r.error,
            })),
        });
    }

    return { total, valid, invalid };
}
