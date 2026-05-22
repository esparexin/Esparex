/**
 * seed-smart-alert-expiry.ts
 *
 * Manual Verification Seed — Smart Alert Expiry QA
 *
 * Purpose: Seed active and expired Smart Alerts to verify the automated cleanup job.
 */

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import User from "@esparex/core/models/User";
import SmartAlert from "@esparex/core/models/SmartAlert";
import { USER_STATUS } from '@esparex/shared';

async function run(): Promise<void> {
    console.info("[seed] Connecting to MongoDB...");
    await connectDB();
    console.info("[seed] Connected.");

    // 1. Cleanup old verification data
    console.info("[seed] Cleaning up old verification smart alerts...");
    await SmartAlert.deleteMany({ name: { $regex: /^(Active|Expired|Pending Expiry) Smart Alert/ } });

    const createUser = async (mobile: string, name: string) => {
        let user = await User.findOne({ mobile });
        if (!user) {
            user = new User({ mobile, name, status: USER_STATUS.LIVE });
            await user.save();
        }
        return user;
    };

    const tester = await createUser("9999900099", "Smart Alert Tester");

    // 2. Seed Smart Alerts
    const alertData = [
        { 
            name: "Active Smart Alert", 
            isActive: true, 
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        },
        { 
            name: "Expired Smart Alert", 
            isActive: true, 
            expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        { 
            name: "Pending Expiry Smart Alert", 
            isActive: true, 
            expiresAt: new Date(Date.now() - 86400000) // 24 hours ago
        },
        {
            name: "Already Deactivated Smart Alert",
            isActive: false,
            expiresAt: new Date(Date.now() - 3600000)
        }
    ];

    for (const a of alertData) {
        const alert = new SmartAlert({
            userId: tester._id,
            name: a.name,
            isActive: a.isActive,
            expiresAt: a.expiresAt,
            criteria: {
                keywords: "test"
            },
            coordinates: {
                type: "Point",
                coordinates: [72.8777, 19.0760]
            },
            radiusKm: 10
        });
        await alert.save();
        console.info(`[seed] Smart Alert created: ${a.name} (Active: ${a.isActive}, Expires: ${a.expiresAt})`);
    }

    console.info("[seed] Smart Alert verification data seeded successfully.");
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[seed] FATAL:", err);
    process.exit(1);
});
