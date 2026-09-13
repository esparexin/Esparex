#!/usr/bin/env npx tsx
/**
 * Backup Verification CLI Script
 *
 * Verifies the integrity of MongoDB backup files.
 * Checks file size, compression, and ability to list contents.
 *
 * Usage:
 *   npx tsx scripts/verify-backup.ts -- --file=backups/esparex_user_2026-01-31.gz
 *   npx tsx scripts/verify-backup.ts -- --all  # Verify all backups
 *
 * @module scripts/verify-backup
 */

import logger from '../src/utils/logger';
import {
    verifyBackup,
    verifyAllBackups,
    generateReport,
    VerificationResult,
} from '../src/db/backup';

async function main() {
    const args = process.argv.slice(2);
    const fileArg = args.find(arg => arg.startsWith('--file='));
    const allArg = args.includes('--all');

    logger.info('Backup Verification Script Started');

    try {
        let results: VerificationResult[] = [];

        if (fileArg) {
            const backupFile = fileArg.split('=')[1] || '';
            const result = verifyBackup(backupFile);
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
            results = await verifyAllBackups();
            generateReport(results);
        } else {
            logger.info('Usage:');
            logger.info('  npx ts-node scripts/verify-backup.ts -- --file=<backup-file>');
            logger.info('  npx ts-node scripts/verify-backup.ts -- --all');
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

if (require.main === module) {
    void main();
}

export { main };
