#!/usr/bin/env ts-node
/**
 * Backup Verification Script
 * 
 * Verifies the integrity of MongoDB backup files.
 * Checks file size, compression, and ability to list contents.
 * 
 * Usage:
 *   npm run verify-backup -- --file=backups/esparex_user_2026-01-31.gz
 *   npm run verify-backup -- --all  # Verify all backups
 * 
 * @module scripts/verify-backup
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const MIN_BACKUP_SIZE_MB = 0.1; // Minimum expected backup size

interface VerificationResult {
    file: string;
    valid: boolean;
    size: string;
    collections?: number;
    error?: string;
}

/**
 * Verify a single backup file
 */
async function verifyBackup(backupFile: string): Promise<VerificationResult> {
    const result: VerificationResult = {
        file: path.basename(backupFile),
        valid: false,
        size: '0 MB',
    };

    try {
        // Check if file exists
        if (!fs.existsSync(backupFile)) {
            result.error = 'File not found';
            return result;
        }

        // Check file size
        const stats = fs.statSync(backupFile);
        const sizeMB = stats.size / 1024 / 1024;
        result.size = `${sizeMB.toFixed(2)} MB`;

        if (sizeMB < MIN_BACKUP_SIZE_MB) {
            result.error = `File too small (< ${MIN_BACKUP_SIZE_MB} MB)`;
            return result;
        }

        // Try to list archive contents
        try {
            const output = execSync(`mongorestore --archive=${backupFile} --gzip --dryRun 2>&1`, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });

            // Count collections in output
            const collectionMatches = output.match(/restoring/g);
            result.collections = collectionMatches ? collectionMatches.length : 0;

            result.valid = true;
        } catch {
            result.error = 'Failed to read archive (corrupted?)';
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
async function verifyAllBackups(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    try {
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
            const result = await verifyBackup(filePath);
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
function generateReport(results: VerificationResult[]) {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;

    logger.info('Verification Report', {
        total,
        valid,
        invalid,
        successRate: `${((valid / total) * 100).toFixed(1)}%`,
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

/**
 * Main verification function
 */
async function main() {
    const args = process.argv.slice(2);
    const fileArg = args.find(arg => arg.startsWith('--file='));
    const allArg = args.includes('--all');

    logger.info('Backup Verification Script Started');

    try {
        let results: VerificationResult[] = [];

        if (fileArg) {
            // Verify single file
            const backupFile = fileArg.split('=')[1] || '';
            const result = await verifyBackup(backupFile);
            results = [result];

            if (result.valid) {
                logger.info('✅ Backup is valid', {
                    file: result.file,
                    size: result.size,
                    collections: result.collections,
                });
            } else {
                logger.error('❌ Backup is invalid', {
                    file: result.file,
                    error: result.error,
                });
            }
        } else if (allArg) {
            // Verify all backups
            results = await verifyAllBackups();
            generateReport(results);
        } else {
            logger.info('Usage:');
            logger.info('  npm run verify-backup -- --file=<backup-file>');
            logger.info('  npm run verify-backup -- --all');
            process.exit(0);
        }

        const hasInvalid = results.some(r => !r.valid);
        process.exit(hasInvalid ? 1 : 0);
    } catch (error) {
        logger.error('Verification failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { verifyBackup, verifyAllBackups };
