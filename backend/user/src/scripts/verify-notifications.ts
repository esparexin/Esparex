/**
 * verify-notifications.ts
 *
 * Manual Verification — Notification Validation
 *
 * Purpose: Verify that lifecycle-triggered notifications are 
 * correctly dispatched to the Notification collection.
 */

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import Notification from "@esparex/core/models/Notification";
import Business from "@esparex/core/models/Business";

async function run(): Promise<void> {
    console.info("[notif-verify] Connecting to MongoDB...");
    await connectDB();
    console.info("[notif-verify] Connected.");

    // 1. Find the Expired Business
    const expiredBiz = await Business.findOne({ name: "Expiring Business" });
    if (!expiredBiz) {
        console.error("[notif-verify] 'Expiring Business' not found.");
        process.exit(1);
    }

    console.info(`[notif-verify] Checking notifications for User: ${expiredBiz.userId}`);

    // 2. Fetch Notifications for this userId
    const notifs = await Notification.find({ userId: expiredBiz.userId }).sort({ createdAt: -1 });
    console.info(`[notif-verify] Found ${notifs.length} notifications.`);

    notifs.forEach(n => {
        console.info(` - Title: ${n.title}, Type: ${n.type}, CreatedAt: ${n.createdAt}`);
        console.info(`   Message: ${n.message}`);
    });

    if (notifs.some(n => n.type === 'BUSINESS_STATUS' && n.message.includes('expired'))) {
        console.info("[notif-verify] SUCCESS: Business expiry notification was found.");
    } else {
        console.error("[notif-verify] FAILURE: Business expiry notification was NOT found.");
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[notif-verify] FATAL:", err);
    process.exit(1);
});
