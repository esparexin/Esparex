"use strict";
/**
 * Automated backup job runner.
 *
 * Triggered by the scheduler BullMQ worker using repeatable jobs.
 *
 * @module jobs/backup.job
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBackupJob = runBackupJob;
const backup_database_1 = require("../scripts/backup-database");
const verify_backup_1 = require("../scripts/verify-backup");
const env_1 = require("@core/config/env");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
/**
 * Run backup job
 */
async function runBackupJob() {
    const enableBackups = env_1.env.ENABLE_AUTO_BACKUPS || env_1.isProduction;
    if (!enableBackups) {
        logger_1.default.info('Automated backups disabled (set ENABLE_AUTO_BACKUPS=true to enable)');
        return;
    }
    await (0, distributedJobLock_1.runWithDistributedJobLock)('database_backup_job', { ttlMs: 6 * 60 * 60 * 1000, failOpen: false }, async () => {
        logger_1.default.info('Starting automated backup job');
        const backups = [];
        try {
            // Backup user database
            const userBackup = await (0, backup_database_1.backupDatabase)(env_1.env.MONGODB_URI, 'User Database');
            backups.push(userBackup);
            // Backup admin database
            const adminBackup = await (0, backup_database_1.backupDatabase)(env_1.env.ADMIN_MONGODB_URI, 'Admin Database');
            backups.push(adminBackup);
            // Verify backups
            for (const backupFile of backups) {
                const result = await (0, verify_backup_1.verifyBackup)(backupFile);
                if (!result.valid) {
                    logger_1.default.error('Backup verification failed', {
                        file: result.file,
                        error: result.error,
                    });
                }
                else {
                    logger_1.default.info('Backup verified successfully', {
                        file: result.file,
                        size: result.size,
                        collections: result.collections,
                    });
                }
            }
            // Clean up old backups
            (0, backup_database_1.cleanupOldBackups)();
            logger_1.default.info('Automated backup job completed', {
                backupsCreated: backups.length,
            });
        }
        catch (error) {
            logger_1.default.error('Automated backup job failed', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    });
}
//# sourceMappingURL=backup.job.js.map