/**
 * Service Types Seed — thin caller (P1-8, DECISION-GATE §2/§5).
 * Seeds default service types for each device category.
 * Idempotent — safe to re-run; uses upsert by (name, categoryId).
 * Write logic lives in the catalog domain (`CatalogSeedService.seedServiceTypes`);
 * this module keeps the seed data and delegates. No direct model imports.
 */
import { CatalogSeedService } from "@esparex/core";

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
    return CatalogSeedService.seedServiceTypes(SERVICE_TYPE_SEED_DATA);
}
