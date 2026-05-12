/**
 * verify-lifecycle-seed.ts
 *
 * Manual Verification Seed — Lifecycle & Bulk Moderation QA
 *
 * Purpose: Seed a variety of businesses and listings in different lifecycle states
 * to verify bulk actions, automated expiry, and audit logging.
 */

import mongoose from "mongoose";
import { LIFECYCLE_STATUS } from "@esparex/shared";
import { connectDB } from "@esparex/core/config/db";
import User from "@esparex/core/models/User";
import Business from "@esparex/core/models/Business";
import Ad from "@esparex/core/models/Ad";
import Category from "@esparex/core/models/Category";
import { USER_STATUS } from "@esparex/core/constants/enums/userStatus";
import { CATALOG_STATUS } from "@esparex/core/constants/enums/catalogStatus";

async function run(): Promise<void> {
    console.info("[seed] Connecting to MongoDB...");
    await connectDB();
    console.info("[seed] Connected.");

    // 1. Cleanup old verification data
    console.info("[seed] Cleaning up old verification data...");
    
    // Delete businesses by name patterns
    await Business.deleteMany({ name: { $regex: /^(Pending|Active|Expiring|Deactivated|Expired) Business/ } });
    
    // Delete ads by title patterns
    await Ad.deleteMany({ title: { $regex: /^(Pending|Live|Expiring|Expired|Deactivated) Ad/ } });
    await Ad.deleteMany({ title: { $regex: /^Ad for / } });

    const sellersToDelete = await User.find({ mobile: { $regex: /^99999/ } });
    const sellerIdsToDelete = sellersToDelete.map(s => s._id);
    console.info(`[seed] Found ${sellerIdsToDelete.length} sellers to delete.`);
    
    await User.deleteMany({ _id: { $in: sellerIdsToDelete } });

    // 2. Ensure Category
    let category = await Category.findOne({ slug: "verification-category" });
    if (!category) {
        category = new Category({
            name: "Verification Category",
            slug: "verification-category",
            type: "ad",
            isActive: true,
            status: CATALOG_STATUS.ACTIVE
        });
        await category.save();
    }

    // 3. Create Verification Sellers
    const createSeller = async (mobile: string, name: string) => {
        let user = await User.findOne({ mobile });
        if (!user) {
            user = new User({ mobile, name, status: USER_STATUS.LIVE });
            await user.save();
        }
        return user;
    };

    await createSeller("9999900001", "Business Lifecycle Tester");
    const regularSeller = await createSeller("9999900002", "Regular Listing Tester");

    console.info("[seed] Sellers ready.");

    // 4. Seed Businesses
    const businessData = [
        { name: "Pending Business", status: LIFECYCLE_STATUS.PENDING, mobile: "9999900011" },
        { name: "Active Business", status: LIFECYCLE_STATUS.LIVE, approvedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), mobile: "9999900012" },
        { name: "Expiring Business", status: LIFECYCLE_STATUS.LIVE, approvedAt: new Date(), expiresAt: new Date(Date.now() - 3600000), mobile: "9999900013" }, // 1 hour ago
        { name: "Deactivated Business", status: LIFECYCLE_STATUS.DEACTIVATED, mobile: "9999900014" },
        { name: "Expired Business", status: LIFECYCLE_STATUS.EXPIRED, expiresAt: new Date(Date.now() - 86400000), mobile: "9999900015" },
    ];

    for (const b of businessData) {
        const uniqueUser = await createSeller(b.mobile, b.name + " Owner");
        const bus = new Business({
            userId: uniqueUser._id,
            name: b.name,
            description: `Verification seed for ${b.name}`,
            email: `${b.name.toLowerCase().replace(/ /g, ".")}@example.com`,
            mobile: uniqueUser.mobile,
            status: b.status,
            location: {
                address: "Verification St",
                city: "Mumbai",
                state: "Maharashtra",
                country: "India",
                coordinates: { type: "Point", coordinates: [72.8777, 19.0760] }
            },
            approvedAt: b.approvedAt,
            expiresAt: b.expiresAt
        });
        await bus.save();
        console.info(`[seed] Business created: ${b.name} (${b.status})`);

        // Create a live listing for each business to test cascading
        const ad = new Ad({
            sellerId: uniqueUser._id,
            businessId: bus._id,
            title: `Ad for ${b.name}`,
            description: "Cascading lifecycle test ad",
            price: 1000,
            currency: "INR",
            status: LIFECYCLE_STATUS.LIVE,
            listingType: "ad",
            categoryId: category._id,
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            location: {
                city: "Mumbai",
                state: "Maharashtra",
                country: "India",
                coordinates: { type: "Point", coordinates: [72.8777, 19.0760] }
            }
        });
        await ad.save();
    }

    // 5. Seed Independent Listings
    const listingData = [
        { title: "Pending Ad", status: LIFECYCLE_STATUS.PENDING },
        { title: "Live Ad", status: LIFECYCLE_STATUS.LIVE, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { title: "Expiring Ad", status: LIFECYCLE_STATUS.LIVE, expiresAt: new Date(Date.now() - 3600000) },
        { title: "Expired Ad", status: LIFECYCLE_STATUS.EXPIRED, expiresAt: new Date(Date.now() - 86400000) },
        { title: "Deactivated Ad", status: LIFECYCLE_STATUS.DEACTIVATED },
    ];

    for (const l of listingData) {
        const ad = new Ad({
            sellerId: regularSeller._id,
            title: l.title,
            description: `Verification seed for ${l.title}`,
            price: 500,
            currency: "INR",
            status: l.status,
            listingType: "ad",
            categoryId: category._id,
            expiresAt: l.expiresAt,
            location: {
                city: "Mumbai",
                state: "Maharashtra",
                country: "India",
                coordinates: { type: "Point", coordinates: [72.8777, 19.0760] }
            }
        });
        await ad.save();
        console.info(`[seed] Listing created: ${l.title} (${l.status})`);
    }

    console.info("[seed] Verification data seeded successfully.");
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("[seed] FATAL:", err);
    process.exit(1);
});
