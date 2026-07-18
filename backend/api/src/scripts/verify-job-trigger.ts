/**
 * verify-job-trigger.ts
 *
 * Manual Verification — Business Expiration Job Trigger
 *
 * Purpose: Manually invoke the runExpireBusinessesJob to verify automated 
 * status transitions, cascading listing expiry, notifications, and logs.
 */

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import { expireBusinesses } from "@esparex/core/services/business/BusinessLifecycleService";
import { cascadeExpireBusinessListings } from "@esparex/core/services/AdminBusinessService";
import Business from "@esparex/core/models/Business";
import Ad from "@esparex/core/models/Ad";
import { BUSINESS_STATUS } from "@esparex/contracts";
import { LIFECYCLE_STATUS } from "@esparex/contracts";
import { runExpiryWarningJob } from "@esparex/core/jobs/expiryWarning.job";

async function run(): Promise<void> {
    console.info("[job-verify] Connecting to MongoDB...");
    await connectDB();
    console.info("[job-verify] Connected.");

    // 1. Trigger Warnings (for data that hasn't expired yet)
    console.info("[job-verify] Triggering runExpiryWarningJob...");
    await runExpiryWarningJob();
    console.info("[job-verify] Warning job completed.");

    // 2. Identify "Expiring Business" from seed
    const expiringBiz = await Business.findOne({ name: "Expiring Business" });
    if (!expiringBiz) {
        console.error("[job-verify] 'Expiring Business' not found. Did you run the seed script?");
        process.exit(1);
    }

    console.info(`[job-verify] Found Expiring Business: ${expiringBiz._id} (Status: ${expiringBiz.status}, ExpiresAt: ${expiringBiz.expiresAt})`);

    // 3. Check its listings
    const listingsBefore = await Ad.find({ businessId: expiringBiz._id });
    console.info(`[job-verify] Listings before job: ${listingsBefore.length}`);
    listingsBefore.forEach(l => console.info(` - ${l.title}: ${l.status}`));

    // 4. Trigger Service directly (avoid Redis lock issues in local script)
    console.info("[job-verify] Triggering expireBusinesses service directly...");
    const expiredBusinesses = await expireBusinesses();
    console.info(`[job-verify] Service completed. Expired ${expiredBusinesses.length} businesses.`);

    if (expiredBusinesses.length > 0) {
        const actor = { type: "system" as const, id: 'cron_expireBusinesses' };
        for (const biz of expiredBusinesses) {
            console.info(`[job-verify] Processing secondary effects for business: ${biz._id}`);
            await cascadeExpireBusinessListings(
                biz._id,
                actor,
                'Automatic expiration: Business subscription ended'
            );
        }
    }

    // 4. Verify Business Status
    const expiringBizAfter = await Business.findById(expiringBiz._id);
    console.info(`[job-verify] Business after job: ${expiringBizAfter?.status}`);

    if (expiringBizAfter?.status === BUSINESS_STATUS.EXPIRED) {
        console.info("[job-verify] SUCCESS: Business status transitioned to EXPIRED.");
    } else {
        console.error("[job-verify] FAILURE: Business status did not transition to EXPIRED.");
    }

    // 5. Verify Cascading Listings
    const listingsAfter = await Ad.find({ businessId: expiringBiz._id });
    console.info(`[job-verify] Listings after job: ${listingsAfter.length}`);
    let allCascaded = true;
    listingsAfter.forEach(l => {
        console.info(` - ${l.title}: ${l.status}`);
        if (l.status !== LIFECYCLE_STATUS.EXPIRED) allCascaded = false;
    });

    if (allCascaded) {
        console.info("[job-verify] SUCCESS: All linked listings transitioned to EXPIRED.");
    } else {
        console.error("[job-verify] FAILURE: Some listings did not cascade to EXPIRED.");
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[job-verify] FATAL:", err);
    process.exit(1);
});
