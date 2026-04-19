import fs from 'fs';
import path from 'path';
import mongoose, { type Types } from 'mongoose';
import Ad from '../models/Ad';
import AdminMetrics from '../models/AdminMetrics';
import { connectDB, getUserConnection } from '../config/db';
import logger from '../utils/logger';
import { inferListingType, type ListingTypeIntegrityInput } from '../utils/listingTypeIntegrity';

type ListingTypeValue = 'ad' | 'service' | 'spare_part';
type ScriptMode = 'dry-run' | 'apply';

type ScriptOptions = {
    mode: ScriptMode;
    batchSize: number;
    sleepMs: number;
    checkpointPath: string;
    reportPath: string;
    resume: boolean;
    maxBatches?: number;
};

type CheckpointState = {
    mode: ScriptMode;
    lastProcessedId: string | null;
    batchesProcessed: number;
    docsScanned: number;
    docsUpdated: number;
    conflicts: number;
    updatedAt: string;
};

type BackfillReport = {
    mode: ScriptMode;
    startedAt: string;
    completedAt?: string;
    options: ScriptOptions;
    precheck: {
        missingListingType: number;
        invalidListingType: number;
    };
    summary: {
        batchesProcessed: number;
        docsScanned: number;
        docsUpdated: number;
        conflicts: number;
        inferred: Record<ListingTypeValue, number>;
        stoppedEarly: boolean;
    };
    postcheck?: {
        missingListingType: number;
        invalidListingType: number;
    };
    conflictSamples: string[];
    checkpointPath: string;
};

type AdBackfillCandidate = {
    _id: Types.ObjectId;
    listingType?: ListingTypeValue | null;
    sparePartId?: Types.ObjectId;
    sparePartIds?: Types.ObjectId[];
    stock?: number;
    priceMin?: number;
    priceMax?: number;
    serviceTypeIds?: Types.ObjectId[];
    onsiteService?: boolean;
    diagnosticFee?: number;
    turnaroundTime?: string;
    included?: string;
    excluded?: string;
};

type InferenceResult = {
    listingType: ListingTypeValue;
    reason: string;
    conflict: boolean;
};

type MissingListingTypeFilter = {
    $or: Array<{ listingType: { $exists: false } } | { listingType: null }>;
    _id?: { $gt: Types.ObjectId };
};

const DEFAULT_CHECKPOINT_PATH = path.resolve(process.cwd(), 'logs/listingtype-backfill-checkpoint.json');
const DEFAULT_REPORT_DIR = path.resolve(process.cwd(), 'logs');
const CONFLICT_SAMPLE_LIMIT = 200;
const DRIFT_METRIC_MODULE = 'ad_listingtype_drift';

const parseArgValue = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const arg = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
    if (!arg) return undefined;
    return arg.slice(prefix.length);
};

const parseBooleanFlag = (name: string): boolean =>
    process.argv.slice(2).includes(`--${name}`);

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

const resolveScriptOptions = (): ScriptOptions => {
    const modeRaw = parseArgValue('mode') || 'dry-run';
    if (modeRaw !== 'dry-run' && modeRaw !== 'apply') {
        throw new Error(`Invalid --mode value "${modeRaw}". Use --mode=dry-run or --mode=apply`);
    }

    const checkpointPath = path.resolve(process.cwd(), parseArgValue('checkpoint') || DEFAULT_CHECKPOINT_PATH);
    const reportPath = path.resolve(
        process.cwd(),
        parseArgValue('report') || path.join(DEFAULT_REPORT_DIR, `listingtype-backfill-${new Date().toISOString().slice(0, 10)}.json`)
    );

    const maxBatchesRaw = parseArgValue('max-batches');
    const maxBatches = maxBatchesRaw ? parsePositiveInt(maxBatchesRaw, 0) : undefined;

    return {
        mode: modeRaw,
        batchSize: parsePositiveInt(parseArgValue('batch-size'), 500),
        sleepMs: parsePositiveInt(parseArgValue('sleep-ms'), 0),
        checkpointPath,
        reportPath,
        resume: parseBooleanFlag('resume'),
        maxBatches: maxBatches && maxBatches > 0 ? maxBatches : undefined
    };
};

const ensureParentDirectory = (filePath: string): void => {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
};

const readCheckpoint = (checkpointPath: string): CheckpointState | null => {
    if (!fs.existsSync(checkpointPath)) return null;
    const raw = fs.readFileSync(checkpointPath, 'utf8');
    const parsed = JSON.parse(raw) as CheckpointState;
    return parsed;
};

const writeCheckpoint = (checkpointPath: string, checkpoint: CheckpointState): void => {
    ensureParentDirectory(checkpointPath);
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf8');
};

const writeReport = (reportPath: string, report: BackfillReport): void => {
    ensureParentDirectory(reportPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
};

const sleep = async (ms: number): Promise<void> => {
    if (ms <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, ms));
};

const buildMissingListingTypeFilter = (lastProcessedId?: Types.ObjectId): MissingListingTypeFilter => {
    const filter: MissingListingTypeFilter = {
        $or: [
            { listingType: { $exists: false } },
            { listingType: null }
        ]
    };
    if (lastProcessedId) {
        filter._id = { $gt: lastProcessedId };
    }
    return filter;
};

const toIntegrityInput = (doc: AdBackfillCandidate): ListingTypeIntegrityInput => ({
    sparePartId: doc.sparePartId,
    sparePartIds: doc.sparePartIds,
    stock: doc.stock,
    serviceTypeIds: doc.serviceTypeIds,
    priceMin: doc.priceMin,
    priceMax: doc.priceMax,
    diagnosticFee: doc.diagnosticFee,
    onsiteService: doc.onsiteService,
    turnaroundTime: doc.turnaroundTime,
    included: doc.included,
    excluded: doc.excluded,
});

const getDriftSnapshot = async (): Promise<{ missingListingType: number; invalidListingType: number }> => {
    const [missingListingType, invalidListingType] = await Promise.all([
        Ad.countDocuments({
            $or: [
                { listingType: { $exists: false } },
                { listingType: null }
            ]
        }),
        Ad.countDocuments({
            listingType: { $exists: true, $nin: ['ad', 'service', 'spare_part'] }
        })
    ]);
    return { missingListingType, invalidListingType };
};

const recordDriftMetric = async (
    mode: ScriptMode,
    precheck: { missingListingType: number; invalidListingType: number },
    postcheck: { missingListingType: number; invalidListingType: number },
    summary: BackfillReport['summary']
): Promise<void> => {
    try {
        const aggregationDate = new Date();
        aggregationDate.setHours(0, 0, 0, 0);

        await AdminMetrics.findOneAndUpdate(
            { metricModule: DRIFT_METRIC_MODULE, aggregationDate },
            {
                $inc: {
                    'payload.runs': 1,
                    'payload.docsScanned': summary.docsScanned,
                    'payload.docsUpdated': summary.docsUpdated,
                    'payload.conflicts': summary.conflicts,
                    [`payload.mode.${mode}`]: 1
                },
                $set: {
                    'payload.latest': {
                        mode,
                        missingBefore: precheck.missingListingType,
                        missingAfter: postcheck.missingListingType,
                        invalidBefore: precheck.invalidListingType,
                        invalidAfter: postcheck.invalidListingType,
                        batchesProcessed: summary.batchesProcessed,
                        updatedAt: new Date()
                    }
                }
            },
            { upsert: true }
        );
    } catch (error) {
        logger.warn('[ListingTypeBackfill] Failed to record drift metric', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const runAdListingTypeBackfill = async (): Promise<void> => {
    const options = resolveScriptOptions();
    ensureParentDirectory(options.checkpointPath);
    ensureParentDirectory(options.reportPath);

    logger.info('[ListingTypeBackfill] Starting', {
        mode: options.mode,
        batchSize: options.batchSize,
        sleepMs: options.sleepMs,
        checkpointPath: options.checkpointPath,
        reportPath: options.reportPath,
        resume: options.resume,
        maxBatches: options.maxBatches ?? null
    });

    await connectDB();
    const conn = getUserConnection();
    await conn.asPromise();

    const precheck = await getDriftSnapshot();
    const report: BackfillReport = {
        mode: options.mode,
        startedAt: new Date().toISOString(),
        options,
        precheck,
        summary: {
            batchesProcessed: 0,
            docsScanned: 0,
            docsUpdated: 0,
            conflicts: 0,
            inferred: {
                ad: 0,
                service: 0,
                spare_part: 0
            },
            stoppedEarly: false
        },
        conflictSamples: [],
        checkpointPath: options.checkpointPath
    };

    let checkpoint: CheckpointState = {
        mode: options.mode,
        lastProcessedId: null,
        batchesProcessed: 0,
        docsScanned: 0,
        docsUpdated: 0,
        conflicts: 0,
        updatedAt: new Date().toISOString()
    };

    if (options.resume) {
        const existing = readCheckpoint(options.checkpointPath);
        if (existing) {
            if (existing.mode !== options.mode) {
                throw new Error(
                    `Checkpoint mode mismatch at ${options.checkpointPath}: found "${existing.mode}", requested "${options.mode}". ` +
                    'Use a mode-specific checkpoint file or remove the old checkpoint.'
                );
            }
            checkpoint = existing;
            logger.info('[ListingTypeBackfill] Resuming from checkpoint', checkpoint);
        } else {
            logger.warn('[ListingTypeBackfill] Resume requested but no checkpoint found; starting from beginning');
        }
    }

    let stopRequested = false;
    process.on('SIGINT', () => {
        stopRequested = true;
        logger.warn('[ListingTypeBackfill] SIGINT received; stopping after current batch');
    });
    process.on('SIGTERM', () => {
        stopRequested = true;
        logger.warn('[ListingTypeBackfill] SIGTERM received; stopping after current batch');
    });

    while (!stopRequested) {
        if (options.maxBatches && checkpoint.batchesProcessed >= options.maxBatches) {
            logger.info('[ListingTypeBackfill] max-batches limit reached', { maxBatches: options.maxBatches });
            report.summary.stoppedEarly = true;
            break;
        }

        const lastProcessedObjectId = checkpoint.lastProcessedId && mongoose.Types.ObjectId.isValid(checkpoint.lastProcessedId)
            ? new mongoose.Types.ObjectId(checkpoint.lastProcessedId)
            : undefined;

        const batchFilter = buildMissingListingTypeFilter(lastProcessedObjectId);
        const batch = await Ad.find(batchFilter)
            .sort({ _id: 1 })
            .limit(options.batchSize)
            .select('_id listingType sparePartId sparePartIds stock priceMin priceMax serviceTypeIds onsiteService diagnosticFee turnaroundTime included excluded')
            .lean<AdBackfillCandidate[]>();

        if (batch.length === 0) {
            break;
        }

        const bulkOps: Parameters<typeof Ad.bulkWrite>[0] = [];

        for (const doc of batch) {
            const inferredResult = inferListingType(toIntegrityInput(doc));
            const inferred: InferenceResult = {
                listingType: inferredResult.listingType,
                reason: inferredResult.reason,
                conflict: inferredResult.confidence === 'conflict'
            };
            report.summary.inferred[inferred.listingType] += 1;
            checkpoint.docsScanned += 1;

            if (inferred.conflict) {
                checkpoint.conflicts += 1;
                if (report.conflictSamples.length < CONFLICT_SAMPLE_LIMIT) {
                    report.conflictSamples.push(String(doc._id));
                }
                continue;
            }

            if (options.mode === 'apply') {
                bulkOps.push({
                    updateOne: {
                        filter: {
                            _id: doc._id,
                            $or: [
                                { listingType: { $exists: false } },
                                { listingType: null }
                            ]
                        },
                        update: {
                            $set: { listingType: inferred.listingType }
                        }
                    }
                });
            } else {
                checkpoint.docsUpdated += 1;
            }
        }

        if (options.mode === 'apply' && bulkOps.length > 0) {
            const result = await Ad.bulkWrite(bulkOps, { ordered: false });
            checkpoint.docsUpdated += result.modifiedCount ?? 0;
        }

        checkpoint.batchesProcessed += 1;
        checkpoint.lastProcessedId = String(batch[batch.length - 1]?._id || checkpoint.lastProcessedId);
        checkpoint.updatedAt = new Date().toISOString();
        writeCheckpoint(options.checkpointPath, checkpoint);

        report.summary.batchesProcessed = checkpoint.batchesProcessed;
        report.summary.docsScanned = checkpoint.docsScanned;
        report.summary.docsUpdated = checkpoint.docsUpdated;
        report.summary.conflicts = checkpoint.conflicts;

        if (checkpoint.batchesProcessed % 10 === 0) {
            const snapshot = await getDriftSnapshot();
            logger.info('[ListingTypeBackfill] Progress snapshot', {
                batchesProcessed: checkpoint.batchesProcessed,
                docsScanned: checkpoint.docsScanned,
                docsUpdated: checkpoint.docsUpdated,
                conflicts: checkpoint.conflicts,
                missingListingType: snapshot.missingListingType,
                invalidListingType: snapshot.invalidListingType
            });
        }

        if (options.sleepMs > 0) {
            await sleep(options.sleepMs);
        }
    }

    if (stopRequested) {
        report.summary.stoppedEarly = true;
    }

    report.completedAt = new Date().toISOString();
    report.postcheck = await getDriftSnapshot();
    writeReport(options.reportPath, report);

    await recordDriftMetric(options.mode, report.precheck, report.postcheck, report.summary);

    logger.info('[ListingTypeBackfill] Completed', {
        mode: options.mode,
        docsScanned: report.summary.docsScanned,
        docsUpdated: report.summary.docsUpdated,
        conflicts: report.summary.conflicts,
        missingBefore: report.precheck.missingListingType,
        missingAfter: report.postcheck.missingListingType,
        invalidBefore: report.precheck.invalidListingType,
        invalidAfter: report.postcheck.invalidListingType,
        reportPath: options.reportPath
    });
};

if (require.main === module) {
    runAdListingTypeBackfill()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('[ListingTypeBackfill] Failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            process.exit(1);
        });
}
