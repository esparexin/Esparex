"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDuplicateRolloutReadiness = void 0;
const db_1 = require("@core/config/db");
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = require("@core/config/env");
const STRICT_ENV_FLAG = 'ENABLE_STRICT_DUPLICATE_INDEX';
const DEFAULT_MIGRATION_TAG = '20260219193000_backfill_duplicate_fingerprint_and_image_hashes';
const REPORT_COLLECTION = 'duplicate_fingerprint_backfill_reports';
const CONFLICT_COLLECTION = 'duplicate_fingerprint_conflicts';
const STRICT_INDEX_NAME = 'duplicateFingerprint_1';
const isStrictIndexEnabled = () => env_1.env.ENABLE_STRICT_DUPLICATE_INDEX;
const getMigrationTag = () => env_1.env.DUPLICATE_ROLLOUT_MIGRATION_TAG ?? DEFAULT_MIGRATION_TAG;
const assertDuplicateRolloutReadiness = async () => {
    if (!isStrictIndexEnabled()) {
        return;
    }
    const migrationTag = getMigrationTag();
    const db = (0, db_1.getUserConnection)().db;
    if (!db) {
        throw new Error(`[duplicate-rollout] Strict duplicate index mode is enabled, but user database is unavailable.`);
    }
    const reports = db.collection(REPORT_COLLECTION);
    const conflicts = db.collection(CONFLICT_COLLECTION);
    const ads = db.collection('ads');
    const [report, unresolvedConflicts, strictIndexExists] = await Promise.all([
        reports.findOne({ migrationTag }),
        conflicts.countDocuments({ migrationTag }),
        ads.indexExists(STRICT_INDEX_NAME),
    ]);
    const conflictCount = Number(report?.conflictCount || 0);
    const strictIndexCreated = report?.strictIndexCreated === true;
    const isReady = Boolean(report) &&
        conflictCount === 0 &&
        unresolvedConflicts === 0 &&
        strictIndexCreated &&
        strictIndexExists;
    if (!isReady) {
        throw new Error(`[duplicate-rollout] ${STRICT_ENV_FLAG}=true requires rollout readiness. ` +
            `migrationTag=${migrationTag}, reportFound=${Boolean(report)}, ` +
            `conflictCount=${conflictCount}, unresolvedConflicts=${unresolvedConflicts}, ` +
            `strictIndexCreated=${strictIndexCreated}, strictIndexExists=${strictIndexExists}.`);
    }
    logger_1.default.info('Duplicate rollout readiness check passed', {
        migrationTag,
        conflictCount,
        unresolvedConflicts,
        strictIndexCreated,
        strictIndexExists,
    });
};
exports.assertDuplicateRolloutReadiness = assertDuplicateRolloutReadiness;
//# sourceMappingURL=DuplicateRolloutGuard.js.map