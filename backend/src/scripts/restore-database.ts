#!/usr/bin/env ts-node
/**
 * MongoDB Restore Script
 * 
 * Restores MongoDB databases from backup files.
 * Supports both user and admin databases.
 * 
 * Usage:
 *   npm run restore -- --file=backups/esparex_user_2026-01-31.gz
 *   npm run restore -- --file=backups/esparex_admin_2026-01-31.gz --db=admin
 * 
 * @module scripts/restore-database
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { env } from '../config/env';
import logger from '../utils/logger';
import { parseMongoUri } from '../utils/mongoUtils';


/**
 * Ask for user confirmation
 */
async function confirmRestore(database: string, backupFile: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(
            `\n⚠️  WARNING: This will REPLACE all data in database "${database}"!\n` +
            `Backup file: ${backupFile}\n` +
            `Are you sure you want to continue? (yes/no): `,
            (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'yes');
            }
        );
    });
}

/**
 * Restore a MongoDB database from backup
 */
async function restoreDatabase(
    uri: string,
    backupFile: string,
    label: string,
    skipConfirmation = false
): Promise<void> {
    const { host, port, database, username, password } = parseMongoUri(uri);

    // Verify backup file exists
    if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Get backup file info
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    logger.info(`Preparing to restore: ${label}`, {
        database,
        host,
        port,
        backupFile,
        size: `${sizeMB} MB`,
    });

    // Confirm restore (unless skipped)
    if (!skipConfirmation) {
        const confirmed = await confirmRestore(database, backupFile);
        if (!confirmed) {
            logger.warn('Restore cancelled by user');
            return;
        }
    }

    try {
        // Build mongorestore command
        let command = `mongorestore --host=${host} --port=${port}`;

        if (username && password) {
            command += ` --username=${username} --password=${password} --authenticationDatabase=admin`;
        }

        command += ` --archive=${backupFile} --gzip --drop`;

        // Execute restore
        const startTime = Date.now();
        logger.info(`Starting restore: ${label}`);

        execSync(command, { stdio: 'inherit' });

        const duration = Date.now() - startTime;

        logger.info(`Restore completed: ${label}`, {
            database,
            duration: `${duration}ms`,
        });
    } catch (error) {
        logger.error(`Restore failed: ${label}`, {
            database,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * List available backups
 */
function listBackups(backupDir: string) {
    logger.info('Available backups:');

    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.gz'))
            .sort()
            .reverse(); // Most recent first

        if (files.length === 0) {
            logger.info('No backup files found');
            return;
        }

        files.forEach((file, index) => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            const date = new Date(stats.mtime).toLocaleString();

            logger.info(`  ${index + 1}. ${file}`);
            logger.info(`     Size: ${sizeMB} MB | Date: ${date}`);
        });
    } catch (error) {
        logger.error('Failed to list backups', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Main restore function
 */
async function main() {
    const args = process.argv.slice(2);
    const fileArg = args.find(arg => arg.startsWith('--file='));
    const dbArg = args.find(arg => arg.startsWith('--db='));
    const skipConfirmArg = args.includes('--yes');

    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');

    // List backups if no file specified
    if (!fileArg) {
        logger.info('MongoDB Restore Script');
        logger.info('Usage: npm run restore -- --file=<backup-file> [--db=user|admin] [--yes]');
        listBackups(backupDir);
        process.exit(0);
    }

    const backupFile = fileArg.split('=')[1] || '';
    const targetDb = dbArg ? dbArg.split('=')[1] : 'auto';

    logger.info('MongoDB Restore Script Started', {
        backupFile,
        targetDb,
    });

    try {
        // Determine which database to restore
        let uri: string = '';
        let label: string = '';

        if (targetDb === 'user' || (backupFile && backupFile.includes('esparex_user'))) {
            uri = env.MONGODB_URI;
            label = 'User Database';
        } else if (targetDb === 'admin' || (backupFile && backupFile.includes('esparex_admin'))) {
            uri = env.ADMIN_MONGODB_URI;
            label = 'Admin Database';
        } else {
            throw new Error('Could not determine target database. Use --db=user or --db=admin');
        }

        // Restore database
        await restoreDatabase(uri, backupFile, label, skipConfirmArg);

        logger.info('Restore process completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Restore process failed', {
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

export { restoreDatabase, listBackups };
