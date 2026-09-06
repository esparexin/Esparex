#!/usr/bin/env ts-node
/**
 * MongoDB Backup CLI Script
 *
 * Creates compressed backups of MongoDB databases.
 * Supports both user and admin databases.
 *
 * Usage:
 *   npx ts-node scripts/backup-database.ts              # Backup all databases
 *   npx ts-node scripts/backup-database.ts -- --db=user # Backup user database only
 *   npx ts-node scripts/backup-database.ts -- --db=admin # Backup admin database only
 *
 * @module scripts/backup-database
 */

import logger from '../src/utils/logger';
import env from '../src/config/env';
import {
    BACKUP_DIR,
    RETENTION_DAYS,
    ensureBackupDir,
    backupDatabase,
    cleanupOldBackups,
} from '../src/db/backup';

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
        ensureBackupDir();

        const backups: string[] = [];

        // Backup user database
        if (targetDb === 'all' || targetDb === 'user') {
            const userBackup = backupDatabase(env.MONGODB_URI, 'User Database');
            backups.push(userBackup);
        }

        // Backup admin database
        if (targetDb === 'all' || targetDb === 'admin') {
            const adminBackup = backupDatabase(env.ADMIN_MONGODB_URI, 'Admin Database');
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

if (require.main === module) {
    void main();
}

export { main };
