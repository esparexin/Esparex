/**
 * Automated backup job runner.
 *
 * Triggered by the scheduler BullMQ worker using repeatable jobs.
 *
 * @module jobs/backup.job
 */

import { backupDatabase, cleanupOldBackups } from '../scripts/backup-database';
import { verifyBackup } from '../scripts/verify-backup';
import { env, isProduction } from '../config/env';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';

/**
 * Run backup job
 */
export async function runBackupJob() {
    const enableBackups = env.ENABLE_AUTO_BACKUPS || isProduction;
    if (!enableBackups) {
        logger.info('Automated backups disabled (set ENABLE_AUTO_BACKUPS=true to enable)');
        return;
    }

    await runWithDistributedJobLock(
        'database_backup_job',
        { ttlMs: 6 * 60 * 60 * 1000, failOpen: false },
        async () => {
            logger.info('Starting automated backup job');
            const backups: string[] = [];

            try {
                // Backup user database
                const userBackup = await backupDatabase(env.MONGODB_URI, 'User Database');
                backups.push(userBackup);

                // Backup admin database
                const adminBackup = await backupDatabase(env.ADMIN_MONGODB_URI, 'Admin Database');
                backups.push(adminBackup);

                // Verify backups
                for (const backupFile of backups) {
                    const result = await verifyBackup(backupFile);
                    if (!result.valid) {
                        logger.error('Backup verification failed', {
                            file: result.file,
                            error: result.error,
                        });
                    } else {
                        logger.info('Backup verified successfully', {
                            file: result.file,
                            size: result.size,
                            collections: result.collections,
                        });
                    }
                }

                // Clean up old backups
                cleanupOldBackups();

                logger.info('Automated backup job completed', {
                    backupsCreated: backups.length,
                });
            } catch (error) {
                logger.error('Automated backup job failed', {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
            }
        }
    );
}
