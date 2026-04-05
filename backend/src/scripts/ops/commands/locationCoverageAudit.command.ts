import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';
import { connectOpsDb } from './commandUtils';

interface LocationDoc {
  _id: mongoose.Types.ObjectId;
  name?: string;
  level?: string;
  isActive?: boolean;
  verificationStatus?: string | null;
  coordinates?: {
    type?: string;
    coordinates?: [number, number];
  } | null;
}

interface BusinessDoc {
  _id: mongoose.Types.ObjectId;
  name?: string;
  locationId?: mongoose.Types.ObjectId | null;
  location?: {
    display?: string | null;
    coordinates?: {
      type?: string;
      coordinates?: [number, number];
    } | null;
  } | null;
}

type CountRow = {
  _id: {
    level?: string | null;
    verificationStatus?: string | null;
    isActive?: boolean | null;
  };
  count: number;
};

type LevelCountRow = {
  _id: string | null;
  count: number;
};

export const locationCoverageAuditCommand: OpsCommand = {
  name: 'location-coverage-audit',
  description: 'Audit public canonical coverage, legacy verification gaps, and admin boundary availability.',
  blastRadius: 'low',
  run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
    const db = await connectOpsDb();
    const locations = db.collection<LocationDoc>('locations');
    const adminBoundaries = db.collection('adminboundaries');
    const businesses = db.collection<BusinessDoc>('businesses');

    try {
      const [
        boundariesTotal,
        businessesTotal,
        businessesWithCoordsNoLocationId,
        statusBreakdown,
        publicEligibleByLevel,
        missingVerificationByLevel,
        missingVerificationSamples,
        businessesWithoutLocationIdSamples,
      ] = await Promise.all([
        adminBoundaries.countDocuments({}),
        businesses.countDocuments({}),
        businesses.countDocuments({
          'location.coordinates': { $exists: true },
          $or: [{ locationId: { $exists: false } }, { locationId: null }],
        }),
        locations
          .aggregate<CountRow>([
            {
              $group: {
                _id: {
                  level: '$level',
                  verificationStatus: '$verificationStatus',
                  isActive: '$isActive',
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                '_id.level': 1,
                '_id.verificationStatus': 1,
                '_id.isActive': -1,
              },
            },
          ])
          .toArray(),
        locations
          .aggregate<LevelCountRow>([
            {
              $match: {
                isActive: true,
                verificationStatus: { $in: ['verified', null] },
              },
            },
            {
              $group: {
                _id: '$level',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray(),
        locations
          .aggregate<LevelCountRow>([
            {
              $match: {
                isActive: true,
                $or: [{ verificationStatus: { $exists: false } }, { verificationStatus: null }],
              },
            },
            {
              $group: {
                _id: '$level',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray(),
        locations
          .find(
            {
              isActive: true,
              $or: [{ verificationStatus: { $exists: false } }, { verificationStatus: null }],
            },
            {
              projection: {
                _id: 1,
                name: 1,
                level: 1,
                isActive: 1,
                verificationStatus: 1,
                coordinates: 1,
              },
            }
          )
          .limit(20)
          .toArray(),
        businesses
          .find(
            {
              'location.coordinates': { $exists: true },
              $or: [{ locationId: { $exists: false } }, { locationId: null }],
            },
            {
              projection: {
                _id: 1,
                name: 1,
                locationId: 1,
                'location.display': 1,
                'location.coordinates': 1,
              },
            }
          )
          .limit(20)
          .toArray(),
      ]);

      const missingVerificationTotal = missingVerificationByLevel.reduce(
        (sum, row) => sum + Number(row.count || 0),
        0
      );

      const summary = {
        mode: context.flags.apply ? 'APPLY' : 'DRY_RUN',
        boundariesTotal,
        businessesTotal,
        businessesWithCoordsNoLocationId,
        missingVerificationTotal,
        publicEligibleByLevel,
        missingVerificationByLevel,
        statusBreakdown,
        missingVerificationSamples: missingVerificationSamples.map((doc) => ({
          _id: String(doc._id),
          name: doc.name ?? null,
          level: doc.level ?? null,
          verificationStatus: doc.verificationStatus ?? null,
          coordinates: doc.coordinates ?? null,
        })),
        businessesWithoutLocationIdSamples: businessesWithoutLocationIdSamples.map((doc) => ({
          _id: String(doc._id),
          name: doc.name ?? null,
          locationId: doc.locationId ? String(doc.locationId) : null,
          locationDisplay: doc.location?.display ?? null,
          coordinates: doc.location?.coordinates ?? null,
        })),
      };

      const warnings: string[] = [];
      if (boundariesTotal === 0) {
        warnings.push('No admin boundaries are present. Reverse geocode will use nearest-point fallback only.');
      }
      if (missingVerificationTotal > 0) {
        warnings.push('Active legacy locations are missing verificationStatus. Run location-status-backfill to normalize them.');
      }
      if (businessesWithCoordsNoLocationId > 0) {
        warnings.push('Some businesses have coordinates without canonical locationId. Review samples and backfill if needed.');
      }

      context.emit('ops.command.location-coverage-audit.summary', {
        boundariesTotal,
        businessesTotal,
        businessesWithCoordsNoLocationId,
        missingVerificationTotal,
        publicEligibleLevelCount: publicEligibleByLevel.length,
      });

      return {
        summary,
        warnings,
        rollbackGuidance: [
          'Audit command is read-only; no rollback required.',
        ],
      };
    } finally {
      await mongoose.disconnect();
    }
  },
};
