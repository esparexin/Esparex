import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';

type ReportStatus = 'open' | 'pending' | 'reviewed' | 'dismissed' | string;

interface ReportDoc {
  _id: mongoose.Types.ObjectId;
  status: ReportStatus;
  targetType?: string | null;
  targetId?: mongoose.Types.ObjectId | null;
  adId?: mongoose.Types.ObjectId | null;
}

interface AdDoc {
  _id: mongoose.Types.ObjectId;
  isDeleted?: boolean;
}

interface CaseSamples {
  caseA: Array<Record<string, unknown>>;
  caseB: Array<Record<string, unknown>>;
  caseC: Array<Record<string, unknown>>;
  caseD: Array<Record<string, unknown>>;
}

const ACTIVE_STATUSES: ReportStatus[] = ['open', 'pending', 'reviewed'];
const BATCH_SIZE = 300;

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  return uri;
};

export const orphanReportRemediateCommand: OpsCommand = {
  name: 'report-orphan-remediate',
  description: 'Classify and remediate orphan ad-target reports with safe dismiss/repair actions.',
  blastRadius: 'high',
  run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
    const mongoUri = getMongoUri();
    const now = new Date();
    const resolutionNote = `orphan target cleanup (${now.toISOString()})`;

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Mongo connection established without database handle');
    }
    const reports = db.collection<ReportDoc>('reports');
    const ads = db.collection<AdDoc>('ads');

    try {
      const summary = {
        mode: context.flags.apply ? 'APPLY' : 'DRY_RUN',
        scanned: 0,
        classification: {
          caseA_softDeleted_kept: 0,
          caseB_missing_dismiss: 0,
          caseC_repaired_targetId: 0,
          caseD_escalate: 0,
        },
        apply: {
          dismissMatched: 0,
          dismissModified: 0,
          repairMatched: 0,
          repairModified: 0,
        },
        unresolvedAfter: 0,
      };

      const samples: CaseSamples = {
        caseA: [],
        caseB: [],
        caseC: [],
        caseD: [],
      };

      const dismissIds: mongoose.Types.ObjectId[] = [];
      const repairOps: mongoose.mongo.AnyBulkWriteOperation<ReportDoc>[] = [];

      const pushSample = (bucket: Array<Record<string, unknown>>, item: Record<string, unknown>): void => {
        if (bucket.length < 20) bucket.push(item);
      };

      const flush = async (): Promise<void> => {
        if (!context.flags.apply) return;

        if (dismissIds.length > 0) {
          const result = await reports.updateMany(
            { _id: { $in: dismissIds }, status: { $in: ACTIVE_STATUSES } },
            {
              $set: {
                status: 'dismissed',
                resolution: resolutionNote,
                resolvedAt: now,
              },
            }
          );
          summary.apply.dismissMatched += Number(result.matchedCount || 0);
          summary.apply.dismissModified += Number(result.modifiedCount || 0);
          dismissIds.length = 0;
        }

        if (repairOps.length > 0) {
          const result = await reports.bulkWrite(repairOps, { ordered: false });
          summary.apply.repairMatched += Number(result.matchedCount || 0);
          summary.apply.repairModified += Number(result.modifiedCount || 0);
          repairOps.length = 0;
        }
      };

      const cursor = reports.find(
        { targetType: 'ad' },
        { projection: { _id: 1, status: 1, targetType: 1, targetId: 1, adId: 1 } }
      );

      for await (const report of cursor) {
        summary.scanned += 1;

        const targetAd = report.targetId
          ? await ads.findOne({ _id: report.targetId }, { projection: { _id: 1, isDeleted: 1 } })
          : null;

        if (targetAd) {
          if (targetAd.isDeleted === true) {
            summary.classification.caseA_softDeleted_kept += 1;
            pushSample(samples.caseA, {
              _id: String(report._id),
              targetId: String(report.targetId),
              status: report.status,
            });
          }
          continue;
        }

        const legacyAd = report.adId
          ? await ads.findOne({ _id: report.adId }, { projection: { _id: 1 } })
          : null;

        if (legacyAd) {
          summary.classification.caseC_repaired_targetId += 1;
          pushSample(samples.caseC, {
            _id: String(report._id),
            fromTargetId: report.targetId ? String(report.targetId) : null,
            toTargetId: String(report.adId),
          });

          repairOps.push({
            updateOne: {
              filter: { _id: report._id },
              update: { $set: { targetId: report.adId, targetType: 'ad' } },
            },
          });
        } else if (report.targetId && report.adId) {
          summary.classification.caseB_missing_dismiss += 1;
          pushSample(samples.caseB, {
            _id: String(report._id),
            targetId: String(report.targetId),
            adId: String(report.adId),
            status: report.status,
          });
          dismissIds.push(report._id);
        } else {
          summary.classification.caseD_escalate += 1;
          pushSample(samples.caseD, {
            _id: String(report._id),
            targetId: report.targetId ? String(report.targetId) : null,
            adId: report.adId ? String(report.adId) : null,
            status: report.status ?? null,
          });
        }

        if (dismissIds.length >= BATCH_SIZE || repairOps.length >= BATCH_SIZE) {
          await flush();
        }
      }

      await flush();

      const unresolvedAfter = await reports
        .aggregate([
          { $match: { targetType: 'ad', status: { $in: ACTIVE_STATUSES } } },
          {
            $lookup: {
              from: 'ads',
              localField: 'targetId',
              foreignField: '_id',
              as: 'ad',
            },
          },
          { $match: { ad: { $size: 0 } } },
          { $count: 'count' },
        ])
        .toArray();

      summary.unresolvedAfter = Number(unresolvedAfter[0]?.count || 0);

      context.emit('ops.command.report-orphan-remediate.summary', {
        ...summary,
        caseASamples: samples.caseA.length,
        caseBSamples: samples.caseB.length,
        caseCSamples: samples.caseC.length,
        caseDSamples: samples.caseD.length,
      });

      return {
        summary: {
          ...summary,
          samples,
        },
        warnings: summary.classification.caseD_escalate > 0
          ? ['Case-D records require manual escalation.']
          : [],
        rollbackGuidance: [
          'Keep moderation history intact; do not hard-delete reports.',
          'If apply mode was incorrect, restore using point-in-time recovery and rerun dry-run classification.',
        ],
      };
    } finally {
      await mongoose.disconnect();
    }
  },
};
