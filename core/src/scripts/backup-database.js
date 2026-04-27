#!/usr/bin/env ts-node
"use strict";
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
exports.backupDatabase = backupDatabase;
exports.cleanupOldBackups = cleanupOldBackups;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = __importDefault(require("@core/config/env"));
const mongoUtils_1 = require("@core/utils/mongoUtils");
// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        logger_1.default.info('Created backup directory', { path: BACKUP_DIR });
    }
}
/**
 * Generate backup filename with timestamp
 */
function getBackupFilename(database, isEncrypted) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${database}_${timestamp}.gz${isEncrypted ? '.enc' : ''}`;
}
/**
 * Backup a MongoDB database
 */
function backupDatabase(uri, label) {
    const { host, port, database, username, password } = (0, mongoUtils_1.parseMongoUri)(uri);
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (env_1.default.NODE_ENV === 'production' && !encryptionKey) {
        logger_1.default.warn('⚠️ BACKUP_ENCRYPTION_KEY missing in production. Daily snapshot backups will be unencrypted.');
    }
    const isEncrypted = !!encryptionKey;
    const backupFile = path.join(BACKUP_DIR, getBackupFilename(database, isEncrypted));
    logger_1.default.info(`Starting backup: ${label}`, {
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
        }
        else {
            command += ` --archive=${backupFile} --gzip`;
        }
        // Execute backup
        const startTime = Date.now();
        (0, child_process_1.execSync)(command, { stdio: 'pipe' });
        const duration = Date.now() - startTime;
        // Get backup file size
        const stats = fs.statSync(backupFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        logger_1.default.info(`Backup completed: ${label}`, {
            database,
            backupFile,
            size: `${sizeMB} MB`,
            duration: `${duration}ms`,
        });
        return backupFile;
    }
    catch (error) {
        logger_1.default.error(`Backup failed: ${label}`, {
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
    logger_1.default.info('Cleaning up old backups', { retentionDays: RETENTION_DAYS });
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        for (const file of files) {
            if (!file.endsWith('.gz') && !file.endsWith('.enc'))
                continue;
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;
            if (age > retentionMs) {
                fs.unlinkSync(filePath);
                deletedCount++;
                logger_1.default.info('Deleted old backup', { file, ageDays: Math.floor(age / (24 * 60 * 60 * 1000)) });
            }
        }
        logger_1.default.info('Cleanup & Oplog Retention Check completed', { deletedCount });
    }
    catch (error) {
        logger_1.default.error('Cleanup failed', {
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
    logger_1.default.info('MongoDB Backup Script Started', {
        target: targetDb,
        backupDir: BACKUP_DIR,
        retentionDays: RETENTION_DAYS,
    });
    try {
        // Ensure backup directory exists
        ensureBackupDir();
        const backups = [];
        // Backup user database
        if (targetDb === 'all' || targetDb === 'user') {
            const userBackup = await backupDatabase(env_1.default.MONGODB_URI, 'User Database');
            backups.push(userBackup);
        }
        // Backup admin database
        if (targetDb === 'all' || targetDb === 'admin') {
            const adminBackup = await backupDatabase(env_1.default.ADMIN_MONGODB_URI, 'Admin Database');
            backups.push(adminBackup);
        }
        // Clean up old backups
        cleanupOldBackups();
        logger_1.default.info('Backup process completed successfully', {
            backupsCreated: backups.length,
            backups,
        });
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Backup process failed', {
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
//# sourceMappingURL=backup-database.js.map