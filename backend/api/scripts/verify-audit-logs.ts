/**
 * verify-audit-logs.ts
 *
 * Manual Verification — Audit & Status History Validation
 *
 * Purpose: Verify that lifecycle transitions (manual and automated) are 
 * correctly recorded in both StatusHistory and AdminLog collections.
 */

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import AdminLog from "@esparex/core/models/AdminLog";
import StatusHistory from "@esparex/core/models/StatusHistory";
import Business from "@esparex/core/models/Business";
import Ad from "@esparex/core/models/Ad";

async function run(): Promise<void> {
    console.info("[log-verify] Connecting to MongoDB...");
    await connectDB();
    console.info("[log-verify] Connected.");

    // 1. Find the Expired Business
    const expiredBiz = await Business.findOne({ name: "Expiring Business" });
    if (!expiredBiz) {
        console.error("[log-verify] 'Expiring Business' not found.");
        process.exit(1);
    }

    console.info(`[log-verify] Checking records for Business: ${expiredBiz._id}`);

    // 2. Check StatusHistory (Automated MutateStatus should record here)
    const history = await StatusHistory.find({ entityId: expiredBiz._id }).sort({ createdAt: -1 });
    console.info(`[log-verify] Found ${history.length} StatusHistory entries.`);
    history.forEach(h => {
        console.info(` - ${h.fromStatus} -> ${h.toStatus} (Actor: ${h.actorType}, Reason: ${h.reason})`);
    });

    if (history.some(h => h.toStatus === 'expired' && h.actorType === 'system')) {
        console.info("[log-verify] SUCCESS: Automated status transition to EXPIRED was found in StatusHistory.");
    } else {
        console.error("[log-verify] FAILURE: Automated status transition to EXPIRED was NOT found in StatusHistory.");
    }

    // 3. Check AdminLog (Manual/Bulk actions should record here via logFn)
    const adminLogs = await AdminLog.find({ targetId: expiredBiz._id.toString() }).sort({ createdAt: -1 });
    console.info(`[log-verify] Found ${adminLogs.length} AdminLog entries.`);
    // Since the expiry was automated, we don't necessarily expect an AdminLog unless specifically implemented.
    // However, if we do a manual bulk action later, it will show up here.

    // 4. Check cascading listing logs
    const cascadingAd = await Ad.findOne({ businessId: expiredBiz._id });
    if (cascadingAd) {
        console.info(`[log-verify] Checking records for cascaded Ad: ${cascadingAd._id}`);
        const adHistory = await StatusHistory.find({ entityId: cascadingAd._id }).sort({ createdAt: -1 });
        console.info(`[log-verify] Found ${adHistory.length} StatusHistory entries for ad.`);
        adHistory.forEach(h => {
            console.info(` - ${h.fromStatus} -> ${h.toStatus} (Actor: ${h.actorType}, Reason: ${h.reason})`);
        });

        if (adHistory.some(h => h.toStatus === 'expired' && h.actorType === 'system')) {
            console.info("[log-verify] SUCCESS: Ad cascading status transition to EXPIRED was found in StatusHistory.");
        } else {
            console.error("[log-verify] FAILURE: Ad cascading status transition to EXPIRED was NOT found in StatusHistory.");
        }
    }

    // 4. Check 'Pending Business' (Manually approved from UI)
    const pendingBiz = await Business.findOne({ name: "Pending Business" });
    if (pendingBiz) {
        console.info(`[log-verify] Checking records for manually approved Business: ${pendingBiz._id}`);
        const pHistory = await StatusHistory.find({ entityId: pendingBiz._id }).sort({ createdAt: -1 });
        console.info(`[log-verify] Found ${pHistory.length} StatusHistory entries.`);
        pHistory.forEach(h => {
            console.info(` - ${h.fromStatus} -> ${h.toStatus} (Actor: ${h.actorType}, Reason: ${h.reason})`);
        });

        if (pHistory.some(h => h.toStatus === 'live' && h.actorType === 'admin')) {
            console.info("[log-verify] SUCCESS: Manual status transition to LIVE (admin) was found in StatusHistory.");
        } else {
            console.error("[log-verify] FAILURE: Manual status transition to LIVE (admin) was NOT found in StatusHistory.");
        }

        // Also check AdminLog for this one (since it was manual)
        const pAdminLogs = await AdminLog.find({ targetId: pendingBiz._id.toString() }).sort({ createdAt: -1 });
        console.info(`[log-verify] Found ${pAdminLogs.length} AdminLog entries.`);
        pAdminLogs.forEach(l => {
            console.info(` - Action: ${l.action}, Actor: ${l.adminId || 'SYSTEM'}, Metadata: ${JSON.stringify(l.metadata)}`);
        });

        if (pAdminLogs.some(l => l.action === 'APPROVE_BUSINESS')) {
            console.info("[log-verify] SUCCESS: AdminLog entry for APPROVE_BUSINESS was found.");
        } else {
            console.error("[log-verify] FAILURE: AdminLog entry for APPROVE_BUSINESS was NOT found.");
        }
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[log-verify] FATAL:", err);
    process.exit(1);
});
