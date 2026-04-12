import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  return uri;
};

interface CollectionPruneResult {
  collection: string;
  identifiedCount: number;
  deletedCount: number;
}

const COLLECTIONS = [
  'ads',
  'users',
  'brands',
  'models',
  'categories',
  'locations',
  'spareparts',
  'servicetypes',
  'screensizes',
  'businesses',
  'admins'
];

export const pruneSoftDeletedCommand: OpsCommand = {
  name: 'prune-soft-deleted',
  description: 'Permanently remove records soft-deleted for more than X days (default 90).',
  blastRadius: 'high',
  run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
    const mongoUri = getMongoUri();
    
    // Parse retention days from args or default to 90
    const daysArg = context.args.find(a => a.startsWith('--days='))?.split('=')[1];
    const retentionDays = daysArg ? parseInt(daysArg, 10) : 90;
    
    if (isNaN(retentionDays)) {
      throw new Error(`Invalid --days argument: ${daysArg}. Must be a number.`);
    }

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

    const isApply = context.flags.apply === true;

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Mongo connection established without database handle');
    }

    const results: CollectionPruneResult[] = [];
    let totalIdentified = 0;
    let totalDeleted = 0;

    try {
      context.emit('ops.command.prune-soft-deleted.start', {
        retentionDays,
        thresholdDate: thresholdDate.toISOString(),
        isApply
      });

      for (const collectionName of COLLECTIONS) {
        const collection = db.collection(collectionName);
        
        // Match documents marked as deleted and older than the threshold
        const filter = {
          isDeleted: true,
          deletedAt: { $lt: thresholdDate }
        };

        const identifiedCount = await collection.countDocuments(filter);
        let deletedCount = 0;

        if (isApply && identifiedCount > 0) {
          const result = await collection.deleteMany(filter);
          deletedCount = Number(result.deletedCount || 0);
        }

        results.push({
          collection: collectionName,
          identifiedCount,
          deletedCount
        });

        totalIdentified += identifiedCount;
        totalDeleted += deletedCount;

        context.emit('ops.command.prune-soft-deleted.collection_processed', {
          collection: collectionName,
          identified: identifiedCount,
          deleted: deletedCount
        });
      }

      return {
        summary: {
          mode: isApply ? 'APPLY' : 'DRY_RUN',
          retentionDays,
          thresholdDate: thresholdDate.toISOString(),
          totalCollectionsChecked: COLLECTIONS.length,
          totalIdentified,
          totalDeleted,
          results
        },
        warnings: !isApply && totalIdentified > 0
          ? [`Found ${totalIdentified} records eligible for pruning. Run with --apply to permanently delete them.`]
          : [],
        rollbackGuidance: [
          'This operation is irreversible. Ensure a database backup exists before running in apply mode.',
          'Review the dry-run summary carefully to ensure the scoped counts match your expectations.'
        ]
      };
    } finally {
      await mongoose.disconnect();
    }
  }
};
