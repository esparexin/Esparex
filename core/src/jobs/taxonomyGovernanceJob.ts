import mongoose from 'mongoose';
import { TAXONOMY_GOVERNANCE_THRESHOLDS } from '../services/catalog/taxonomySsot';
import logger from '../utils/logger';

export async function runTaxonomyGovernanceAudit() {
    const db = mongoose.connection.db;
    if (!db) {
        logger.error('[TAXONOMY_GOVERNANCE] Database connection not established');
        return;
    }

    logger.info('[TAXONOMY_GOVERNANCE] Starting periodic governance audit...');

    const collections = ['categories', 'brands', 'models', 'variants'];
    const report: any = {
        timestamp: new Date(),
        agingPending: [],
        orphans: [],
        slugCollisions: [],
        unusedApproved: []
    };

    const agingDate = new Date();
    agingDate.setDate(agingDate.getDate() - TAXONOMY_GOVERNANCE_THRESHOLDS.PENDING_AGING_DAYS);

    for (const coll of collections) {
        // 1. Pending Aging
        const aging = await db.collection(coll).find({
            approvalStatus: 'pending',
            createdAt: { $lt: agingDate }
        }).toArray();
        if (aging.length > 0) {
            report.agingPending.push({ collection: coll, count: aging.length, ids: aging.map(a => a._id) });
        }

        // 2. Orphan detection (Brands/Models)
        if (coll === 'brands') {
            const orphans = await db.collection(coll).find({
                $or: [{ categoryIds: { $exists: false } }, { categoryIds: { $size: 0 } }, { categoryIds: null }],
                isDeleted: false
            }).toArray();
            if (orphans.length > 0) {
                report.orphans.push({ collection: coll, count: orphans.length, ids: orphans.map(o => o._id) });
            }
        }

        if (coll === 'models') {
            const orphans = await db.collection(coll).find({
                brandId: { $exists: false },
                isDeleted: false
            }).toArray();
            if (orphans.length > 0) {
                report.orphans.push({ collection: coll, count: orphans.length, ids: orphans.map(o => o._id) });
            }
        }

        // 3. Slug collisions
        const collisions = await db.collection(coll).aggregate([
            { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        if (collisions.length > 0) {
            report.slugCollisions.push({ collection: coll, collisions });
        }
    }

    // Store report in a system log or notify admins
    await db.collection('systemLogs').insertOne({
        type: 'TAXONOMY_GOVERNANCE_AUDIT',
        severity: report.agingPending.length > 0 || report.orphans.length > 0 ? 'warning' : 'info',
        data: report,
        createdAt: new Date()
    });

    logger.info('[TAXONOMY_GOVERNANCE] Audit complete', {
        agingCount: report.agingPending.length,
        orphanCount: report.orphans.length
    });

    return report;
}
