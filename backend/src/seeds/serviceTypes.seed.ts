/**
 * Service Types Seed
 * Seeds default service types for each device category.
 * Idempotent — safe to re-run; uses upsert by (name, categoryId).
 */

import Category from "../models/Category";
import ServiceType from "../models/ServiceType";
import logger from "../utils/logger";

interface ServiceTypeEntry {
    name: string;
    categorySlugOrName: string; // matched against Category.slug OR Category.name (case-insensitive)
}

const SERVICE_TYPE_SEED_DATA: ServiceTypeEntry[] = [
    // ── Mobiles ──────────────────────────────────────────────────────────────
    { name: "Screen Replacement",    categorySlugOrName: "Mobiles" },
    { name: "Battery Replacement",   categorySlugOrName: "Mobiles" },
    { name: "Water Damage",          categorySlugOrName: "Mobiles" },
    { name: "Software Issue",        categorySlugOrName: "Mobiles" },
    { name: "Logic Board Repair",    categorySlugOrName: "Mobiles" },
    { name: "Camera Repair",         categorySlugOrName: "Mobiles" },
    { name: "Charging Port Repair",  categorySlugOrName: "Mobiles" },
    { name: "Speaker Repair",        categorySlugOrName: "Mobiles" },
    { name: "Microphone Repair",     categorySlugOrName: "Mobiles" },
    { name: "Other",                 categorySlugOrName: "Mobiles" },

    // ── Tablets ───────────────────────────────────────────────────────────────
    { name: "Screen Replacement",    categorySlugOrName: "Tablets" },
    { name: "Battery Replacement",   categorySlugOrName: "Tablets" },
    { name: "Charging Port Repair",  categorySlugOrName: "Tablets" },
    { name: "Logic Board Repair",    categorySlugOrName: "Tablets" },
    { name: "Speaker Repair",        categorySlugOrName: "Tablets" },
    { name: "Button Repair",         categorySlugOrName: "Tablets" },
    { name: "Water Damage",          categorySlugOrName: "Tablets" },
    { name: "Software Issue",        categorySlugOrName: "Tablets" },
    { name: "Other",                 categorySlugOrName: "Tablets" },

    // ── Laptops ───────────────────────────────────────────────────────────────
    { name: "Screen Replacement",    categorySlugOrName: "Laptops" },
    { name: "Battery Replacement",   categorySlugOrName: "Laptops" },
    { name: "Keyboard Repair",       categorySlugOrName: "Laptops" },
    { name: "Trackpad Repair",       categorySlugOrName: "Laptops" },
    { name: "Hinge Repair",          categorySlugOrName: "Laptops" },
    { name: "Charging Port Repair",  categorySlugOrName: "Laptops" },
    { name: "Logic Board Repair",    categorySlugOrName: "Laptops" },
    { name: "Water Damage",          categorySlugOrName: "Laptops" },
    { name: "Software Issue",        categorySlugOrName: "Laptops" },
    { name: "RAM Upgrade",           categorySlugOrName: "Laptops" },
    { name: "Storage Upgrade",       categorySlugOrName: "Laptops" },
    { name: "Fan Cleaning",          categorySlugOrName: "Laptops" },
    { name: "Other",                 categorySlugOrName: "Laptops" },

    // ── Led-TV ────────────────────────────────────────────────────────────────
    { name: "Screen Replacement",    categorySlugOrName: "LED TVs" },
    { name: "Power Board Repair",    categorySlugOrName: "LED TVs" },
    { name: "Backlight Repair",      categorySlugOrName: "LED TVs" },
    { name: "Panel Repair",          categorySlugOrName: "LED TVs" },
    { name: "HDMI Port Repair",      categorySlugOrName: "LED TVs" },
    { name: "Speaker Repair",        categorySlugOrName: "LED TVs" },
    { name: "Software Issue",        categorySlugOrName: "LED TVs" },
    { name: "Remote Control Issue",  categorySlugOrName: "LED TVs" },
    { name: "Other",                 categorySlugOrName: "LED TVs" },
];

export async function seedServiceTypes() {
    logger.info("🌱 Seeding service types...");

    // Build a map: slugOrName → Category document
    const uniqueNames = [...new Set(SERVICE_TYPE_SEED_DATA.map(e => e.categorySlugOrName))];
    const categoryMap = new Map<string, string>(); // slugOrName → categoryId

    for (const nameOrSlug of uniqueNames) {
        const cat = await Category.findOne({
            $or: [
                { slug: { $regex: new RegExp(`^${nameOrSlug}$`, "i") } },
                { name: { $regex: new RegExp(`^${nameOrSlug}$`, "i") } },
            ],
            isDeleted: { $ne: true },
        }).select("_id name").lean();

        if (cat) {
            categoryMap.set(nameOrSlug, String(cat._id));
            logger.info(`  ✓ Matched category "${nameOrSlug}" → ${cat._id}`);
        } else {
            logger.warn(`  ⚠ Category not found for "${nameOrSlug}" — skipping its service types`);
        }
    }

    let created = 0;
    let skipped = 0;

    for (const entry of SERVICE_TYPE_SEED_DATA) {
        const categoryId = categoryMap.get(entry.categorySlugOrName);
        if (!categoryId) { skipped++; continue; }

        const existing = await ServiceType.findOne({
            name: { $regex: new RegExp(`^${entry.name}$`, "i") },
            categoryIds: categoryId,
        });

        if (existing) {
            skipped++;
            continue;
        }

        await ServiceType.create({
            name: entry.name,
            categoryIds: [categoryId],
            isActive: true,
        });
        created++;
    }

    logger.info(`✅ Service types seeded: ${created} created, ${skipped} skipped (already existed or category not found).`);
}
