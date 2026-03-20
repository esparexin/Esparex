import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';

interface ReportDoc {
  _id: mongoose.Types.ObjectId;
  adId?: mongoose.Types.ObjectId | string | null;
  reportedBy?: mongoose.Types.ObjectId | string | null;
  targetType?: string | null;
  targetId?: mongoose.Types.ObjectId | string | null;
  reporterId?: mongoose.Types.ObjectId | string | null;
  description?: string | null;
  additionalDetails?: string | null;
}

const BATCH_SIZE = 500;
const ALLOWED_TARGET_TYPES = new Set(['ad', 'chat', 'user', 'business']);

const isMissing = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim().length === 0);

const toTrimmedOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isValidObjectIdLike = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  mongoose.Types.ObjectId.isValid(String(value));

const countMissingField = async (collection: mongoose.mongo.Collection<ReportDoc>, field: string): Promise<number> =>
  collection.countDocuments({
    $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }],
  });

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  return uri;
};

export const reportUnifyBackfillCommand: OpsCommand = {
  name: 'report-unify-backfill',
  description: 'Backfill canonical report fields: targetType, targetId, reporterId, description.',
  blastRadius: 'high',
  run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
    const mongoUri = getMongoUri();

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Mongo connection established without database handle');
    }
    const reports = db.collection<ReportDoc>('reports');

    try {
      const missingBefore = {
        targetType: await countMissingField(reports, 'targetType'),
        targetId: await countMissingField(reports, 'targetId'),
        reporterId: await countMissingField(reports, 'reporterId'),
      };

      const summary = {
        mode: context.flags.apply ? 'APPLY' : 'DRY_RUN',
        scanned: 0,
        plannedOps: 0,
        updates: {
          targetType: 0,
          targetId: 0,
          reporterId: 0,
          description: 0,
        },
        unresolved: {
          targetType: 0,
          targetId: 0,
          reporterId: 0,
        },
        missingBefore,
        missingAfter: {
          targetType: 0,
          targetId: 0,
          reporterId: 0,
        },
        writeResult: {
          matchedCount: 0,
          modifiedCount: 0,
        },
      };

      const unresolvedSamples: Array<Record<string, unknown>> = [];
      const pendingOps: mongoose.mongo.AnyBulkWriteOperation<ReportDoc>[] = [];

      const flush = async (): Promise<void> => {
        if (!context.flags.apply || pendingOps.length === 0) return;
        const result = await reports.bulkWrite(pendingOps, { ordered: false });
        summary.writeResult.matchedCount += Number(result.matchedCount || 0);
        summary.writeResult.modifiedCount += Number(result.modifiedCount || 0);
        pendingOps.length = 0;
      };

      const cursor = reports.find(
        {
          $or: [
            { targetType: { $exists: false } },
            { targetType: null },
            { targetType: '' },
            { targetId: { $exists: false } },
            { targetId: null },
            { reporterId: { $exists: false } },
            { reporterId: null },
            { reporterId: '' },
            { description: { $exists: false } },
            { description: null },
            { description: '' },
          ],
        },
        {
          projection: {
            _id: 1,
            adId: 1,
            reportedBy: 1,
            targetType: 1,
            targetId: 1,
            reporterId: 1,
            description: 1,
            additionalDetails: 1,
          },
        }
      );

      for await (const doc of cursor) {
        summary.scanned += 1;
        const setPayload: Record<string, unknown> = {};
        let unresolved = false;

        const rawTargetType = typeof doc.targetType === 'string' ? doc.targetType.trim().toLowerCase() : undefined;
        const canDeriveFromAd = isValidObjectIdLike(doc.adId);

        if (isMissing(doc.targetType)) {
          if (canDeriveFromAd) {
            setPayload.targetType = 'ad';
            summary.updates.targetType += 1;
          } else {
            summary.unresolved.targetType += 1;
            unresolved = true;
          }
        } else if (rawTargetType && ALLOWED_TARGET_TYPES.has(rawTargetType) && rawTargetType !== doc.targetType) {
          setPayload.targetType = rawTargetType;
          summary.updates.targetType += 1;
        }

        if (isMissing(doc.targetId)) {
          if (canDeriveFromAd) {
            setPayload.targetId = doc.adId;
            summary.updates.targetId += 1;
          } else {
            summary.unresolved.targetId += 1;
            unresolved = true;
          }
        }

        if (isMissing(doc.reporterId)) {
          if (isValidObjectIdLike(doc.reportedBy)) {
            setPayload.reporterId = doc.reportedBy;
            summary.updates.reporterId += 1;
          } else {
            summary.unresolved.reporterId += 1;
            unresolved = true;
          }
        }

        const canonicalDescription = toTrimmedOrUndefined(doc.description);
        const fallbackDescription = toTrimmedOrUndefined(doc.additionalDetails);
        if (!canonicalDescription && fallbackDescription) {
          setPayload.description = fallbackDescription;
          summary.updates.description += 1;
        }

        if (unresolved && unresolvedSamples.length < 20) {
          unresolvedSamples.push({
            _id: String(doc._id),
            adId: doc.adId ? String(doc.adId) : null,
            reportedBy: doc.reportedBy ? String(doc.reportedBy) : null,
            targetType: doc.targetType ?? null,
            targetId: doc.targetId ? String(doc.targetId) : null,
            reporterId: doc.reporterId ? String(doc.reporterId) : null,
          });
        }

        if (Object.keys(setPayload).length > 0) {
          summary.plannedOps += 1;
          pendingOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: setPayload },
            },
          });
        }

        if (pendingOps.length >= BATCH_SIZE) {
          await flush();
        }
      }

      await flush();

      if (context.flags.apply) {
        summary.missingAfter = {
          targetType: await countMissingField(reports, 'targetType'),
          targetId: await countMissingField(reports, 'targetId'),
          reporterId: await countMissingField(reports, 'reporterId'),
        };
      } else {
        summary.missingAfter = {
          targetType: Math.max(0, summary.missingBefore.targetType - summary.updates.targetType),
          targetId: Math.max(0, summary.missingBefore.targetId - summary.updates.targetId),
          reporterId: Math.max(0, summary.missingBefore.reporterId - summary.updates.reporterId),
        };
      }

      context.emit('ops.command.report-unify-backfill.summary', {
        ...summary,
        unresolvedSampleCount: unresolvedSamples.length,
      });

      return {
        summary: {
          ...summary,
          unresolvedSamples,
        },
        warnings: unresolvedSamples.length > 0
          ? ['Some reports could not be fully backfilled. Review unresolved samples before apply.']
          : [],
        rollbackGuidance: [
          'Use point-in-time recovery for full rollback if apply mode caused unintended mappings.',
          'Validate missingAfter counters are zero for targetType, targetId, reporterId.',
        ],
      };
    } finally {
      await mongoose.disconnect();
    }
  },
};
