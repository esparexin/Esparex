#!/usr/bin/env ts-node
"use strict";
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
exports.verifyBackup = verifyBackup;
exports.verifyAllBackups = verifyAllBackups;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const MIN_BACKUP_SIZE_MB = 0.1; // Minimum expected backup size
/**
 * Verify a single backup file
 */
function verifyBackup(backupFile) {
    const result = {
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
            const output = (0, child_process_1.execSync)(`mongorestore --archive=${backupFile} --gzip --dryRun 2>&1`, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });
            // Count collections in output
            const collectionMatches = output.match(/restoring/g);
            result.collections = collectionMatches ? collectionMatches.length : 0;
            result.valid = true;
        }
        catch {
            result.error = 'Failed to read archive (corrupted?)';
            return result;
        }
        return result;
    }
    catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        return result;
    }
}
/**
 * Verify all backups in directory
 */
async function verifyAllBackups() {
    const results = [];
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.gz'))
            .sort()
            .reverse();
        if (files.length === 0) {
            logger_1.default.warn('No backup files found', { backupDir: BACKUP_DIR });
            return results;
        }
        logger_1.default.info(`Verifying ${files.length} backup files...`);
        for (const file of files) {
            const filePath = path.join(BACKUP_DIR, file);
            const result = await verifyBackup(filePath);
            results.push(result);
            if (result.valid) {
                logger_1.default.info(`✅ ${file}`, {
                    size: result.size,
                    collections: result.collections,
                });
            }
            else {
                logger_1.default.error(`❌ ${file}`, { error: result.error });
            }
        }
        return results;
    }
    catch (error) {
        logger_1.default.error('Failed to verify backups', {
            error: error instanceof Error ? error.message : String(error),
        });
        return results;
    }
}
/**
 * Generate verification report
 */
function generateReport(results) {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;
    logger_1.default.info('Verification Report', {
        total,
        valid,
        invalid,
        successRate: `${((valid / total) * 100).toFixed(1)}%`,
    });
    if (invalid > 0) {
        logger_1.default.warn('Invalid backups found:', {
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
    logger_1.default.info('Backup Verification Script Started');
    try {
        let results = [];
        if (fileArg) {
            // Verify single file
            const backupFile = fileArg.split('=')[1] || '';
            const result = await verifyBackup(backupFile);
            results = [result];
            if (result.valid) {
                logger_1.default.info('✅ Backup is valid', {
                    file: result.file,
                    size: result.size,
                    collections: result.collections,
                });
            }
            else {
                logger_1.default.error('❌ Backup is invalid', {
                    file: result.file,
                    error: result.error,
                });
            }
        }
        else if (allArg) {
            // Verify all backups
            results = await verifyAllBackups();
            generateReport(results);
        }
        else {
            logger_1.default.info('Usage:');
            logger_1.default.info('  npm run verify-backup -- --file=<backup-file>');
            logger_1.default.info('  npm run verify-backup -- --all');
            process.exit(0);
        }
        const hasInvalid = results.some(r => !r.valid);
        process.exit(hasInvalid ? 1 : 0);
    }
    catch (error) {
        logger_1.default.error('Verification failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    void main();
}
//# sourceMappingURL=verify-backup.js.map