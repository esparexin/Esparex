/**
 * verify-smart-alert-expiry.ts
 *
 * Manual Verification — Smart Alert Expiry QA
 *
 * Purpose: Manually trigger the Smart Alert expiration logic and verify results.
 */

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import SmartAlert from "@esparex/core/models/SmartAlert";
import { expireSmartAlerts } from "@esparex/core/services/SmartAlertService";

async function run(): Promise<void> {
    console.info("[verify] Connecting to MongoDB...");
    await connectDB();
    console.info("[verify] Connected.");

    console.info("[verify] Running expireSmartAlerts service method...");
    const processed = await expireSmartAlerts();
    console.info(`[verify] Processed ${processed.length} expired alerts.`);

    // Check specific alerts
    const alerts = await SmartAlert.find({ 
        name: { $regex: /Smart Alert/ } 
    }).sort({ name: 1 });

    console.info("\n--- Verification Results ---");
    for (const a of alerts) {
        const name = a.name || 'Unnamed Alert';
        const statusIcon = a.isActive ? "✅ ACTIVE" : "🛑 DEACTIVATED";
        const expiredStatus = a.status === "expired" ? " (Status: expired)" : "";
        const hasTimeline = a.timeline && a.timeline.some(t => t.status === "expired") ? " (Timeline: Yes)" : " (Timeline: No)";
        
        console.info(`${name.padEnd(35)}: ${statusIcon}${expiredStatus}${hasTimeline}`);
        
        if (name.includes("Expired") || name.includes("Pending Expiry")) {
            if (a.isActive) {
                console.error(`  ❌ ERROR: ${name} should have been deactivated!`);
            } else {
                console.info(`  ✨ SUCCESS: ${name} correctly deactivated.`);
            }
        }
        
        if (name.includes("Active") && !a.isActive) {
             console.error(`  ❌ ERROR: ${name} should still be active!`);
        }
    }
    console.info("--- End Verification ---\n");

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[verify] FATAL:", err);
    process.exit(1);
});
