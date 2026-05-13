import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendAdminError } from '../../../utils/adminBaseController';
import { TAXONOMY_GOVERNANCE_THRESHOLDS } from '../../../services/catalog/taxonomySsot';
import { getUserConnection } from '../../../config/db';

export const getGovernanceMetrics = async (req: Request, res: Response) => {
    try {
        const db = getUserConnection().db;
        if (!db) throw new Error('DB connection not ready');

        const collections = ['brands', 'models', 'categories', 'variants'];
        const metrics: any = {
            counts: {},
            agingPending: 0,
            orphans: 0,
            duplicates: 0,
            healthScore: 100
        };

        const agingDate = new Date();
        agingDate.setDate(agingDate.getDate() - TAXONOMY_GOVERNANCE_THRESHOLDS.PENDING_AGING_DAYS);

        for (const coll of collections) {
            const approved = await db.collection(coll).countDocuments({ approvalStatus: 'approved', isDeleted: false });
            const pending = await db.collection(coll).countDocuments({ approvalStatus: 'pending', isDeleted: false });
            const rejected = await db.collection(coll).countDocuments({ approvalStatus: 'rejected' });
            const archived = await db.collection(coll).countDocuments({ isDeleted: true });

            metrics.counts[coll] = { approved, pending, rejected, archived };

            // Aging Pending
            const agingCount = await db.collection(coll).countDocuments({
                approvalStatus: 'pending',
                createdAt: { $lt: agingDate }
            });
            metrics.agingPending += agingCount;

            // Orphans
            if (coll === 'brands') {
                const orphanCount = await db.collection(coll).countDocuments({
                    $or: [{ categoryIds: { $exists: false } }, { categoryIds: { $size: 0 } }, { categoryIds: null }],
                    isDeleted: false
                });
                metrics.orphans += orphanCount;
            }

            // Duplicates (Candidate detection)
            const duplicateGroups = await db.collection(coll).aggregate([
                { $group: { _id: '$name', count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } }
            ]).toArray();
            metrics.duplicates += duplicateGroups.length;
        }

        // Calculate health score (simple deduction model)
        metrics.healthScore -= (metrics.agingPending * 1);
        metrics.healthScore -= (metrics.orphans * 2);
        metrics.healthScore -= (metrics.duplicates * 5);
        metrics.healthScore = Math.max(0, metrics.healthScore);

        sendSuccessResponse(res, metrics);
    } catch (error) {
        sendAdminError(req, res, error);
    }
};

export const getGovernanceLogs = async (req: Request, res: Response) => {
    try {
        const db = getUserConnection().db;
        if (!db) throw new Error('DB connection not ready');

        const logs = await db.collection('systemLogs')
            .find({ type: 'TAXONOMY_GOVERNANCE_AUDIT' })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        sendSuccessResponse(res, logs);
    } catch (error) {
        sendAdminError(req, res, error);
    }
};
