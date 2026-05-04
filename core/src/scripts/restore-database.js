#!/usr/bin/env ts-node
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreDatabase = restoreDatabase;
exports.listBackups = listBackups;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const env_1 = require("@core/config/env");
const logger_1 = __importDefault(require("@core/utils/logger"));
const mongoUtils_1 = require("@core/utils/mongoUtils");
/**
 * Ask for user confirmation
 */
async function confirmRestore(database, backupFile) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(`\n⚠️  WARNING: This will REPLACE all data in database "${database}"!\n` +
            `Backup file: ${backupFile}\n` +
            `Are you sure you want to continue? (yes/no): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}
/**
 * Restore a MongoDB database from backup
 */
async function restoreDatabase(uri, backupFile, label, skipConfirmation = false) {
    const { host, port, database, username, password } = (0, mongoUtils_1.parseMongoUri)(uri);
    // Verify backup file exists
    if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
    }
    // Get backup file info
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    logger_1.default.info(`Preparing to restore: ${label}`, {
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
            logger_1.default.warn('Restore cancelled by user');
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
        logger_1.default.info(`Starting restore: ${label}`);
        (0, child_process_1.execSync)(command, { stdio: 'inherit' });
        const duration = Date.now() - startTime;
        logger_1.default.info(`Restore completed: ${label}`, {
            database,
            duration: `${duration}ms`,
        });
    }
    catch (error) {
        logger_1.default.error(`Restore failed: ${label}`, {
            database,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * List available backups
 */
function listBackups(backupDir) {
    logger_1.default.info('Available backups:');
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.gz'))
            .sort()
            .reverse(); // Most recent first
        if (files.length === 0) {
            logger_1.default.info('No backup files found');
            return;
        }
        files.forEach((file, index) => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            const date = new Date(stats.mtime).toLocaleString();
            logger_1.default.info(`  ${index + 1}. ${file}`);
            logger_1.default.info(`     Size: ${sizeMB} MB | Date: ${date}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to list backups', {
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
        logger_1.default.info('MongoDB Restore Script');
        logger_1.default.info('Usage: npm run restore -- --file=<backup-file> [--db=user|admin] [--yes]');
        listBackups(backupDir);
        process.exit(0);
    }
    const backupFile = fileArg.split('=')[1] || '';
    const targetDb = dbArg ? dbArg.split('=')[1] : 'auto';
    logger_1.default.info('MongoDB Restore Script Started', {
        backupFile,
        targetDb,
    });
    try {
        // Determine which database to restore
        let uri = '';
        let label = '';
        if (targetDb === 'user' || (backupFile && backupFile.includes('esparex_user'))) {
            uri = env_1.env.MONGODB_URI;
            label = 'User Database';
        }
        else if (targetDb === 'admin' || (backupFile && backupFile.includes('esparex_admin'))) {
            uri = env_1.env.ADMIN_MONGODB_URI;
            label = 'Admin Database';
        }
        else {
            throw new Error('Could not determine target database. Use --db=user or --db=admin');
        }
        // Restore database
        await restoreDatabase(uri, backupFile, label, skipConfirmArg);
        logger_1.default.info('Restore process completed successfully');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Restore process failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    void main();
}
//# sourceMappingURL=restore-database.js.map