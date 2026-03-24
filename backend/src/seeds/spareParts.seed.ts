import mongoose from "mongoose";
import { SparePartModel } from "../models/SparePart";
import Category from "../models/Category";
import slugify from "slugify";
import logger from '../utils/logger';
import { escapeRegExp } from '../utils/stringUtils';
import { CATALOG_STATUS } from "../../../shared/enums/catalogStatus";

type SparePartSeed = {
    name: string;
    type: "PRIMARY" | "SECONDARY";
    categories: string[];
};

const SPARE_PARTS_SEED: SparePartSeed[] = [
    // MOBILES
    { name: "Battery", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Screen / Display", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Motherboard", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Charging Port", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Rear Camera", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Front Camera", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Speaker", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Microphone", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Power Button", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Volume Buttons", type: "PRIMARY", categories: ["smartphones", "tablets"] },

    // TABLETS – SECONDARY
    { name: "SIM Tray", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Fingerprint Sensor", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Face ID / IR Sensor", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Wi-Fi / Network Module", type: "SECONDARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Back Glass", type: "SECONDARY", categories: ["smartphones"] },

    // LAPTOPS
    { name: "Keyboard", type: "PRIMARY", categories: ["laptops"] },
    { name: "RAM", type: "PRIMARY", categories: ["laptops"] },
    { name: "Storage (SSD / HDD)", type: "PRIMARY", categories: ["laptops"] },
    { name: "Trackpad", type: "SECONDARY", categories: ["laptops"] },
    { name: "Cooling Fan", type: "SECONDARY", categories: ["laptops"] },
    { name: "Webcam", type: "SECONDARY", categories: ["laptops"] },

    // MONITORS / TV
    { name: "Display Panel", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Power Board", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Main Board (Motherboard)", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Backlight", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "T-Con Board", type: "SECONDARY", categories: ["led-tvs"] }
];

export async function seedSpareParts() {
    logger.info("🌱 Seeding spare parts...");

    for (const part of SPARE_PARTS_SEED) {
        const slug = slugify(part.name, { lower: true });

        const exists = await SparePartModel.findOne({ slug });
        if (exists) {
            logger.warn(`⚠️  Skipped (exists): ${part.name}`);
            continue;
        }

        // Resolve category IDs from slugs
        const categoryIds = [];
        for (const catSlug of part.categories) {
            const cat = await Category.findOne({ slug: new RegExp(`^${escapeRegExp(catSlug)}$`, 'i') });
            if (cat) {
                categoryIds.push(cat._id);
            }
        }

        if (categoryIds.length === 0) {
            logger.warn(`❌ Skipping ${part.name}: No valid categories found`);
            continue;
        }

        try {
            await SparePartModel.create({
                name: part.name,
                categoryIds,
                slug,
                usageCount: 0,
                sortOrder: 0,
                createdBy: new mongoose.Types.ObjectId() // system seed
            });
            logger.info(`✅ Inserted: ${part.name}`);
        } catch (error: unknown) {
            const duplicateKey = typeof error === 'object'
                && error !== null
                && 'code' in error
                && (error as { code?: unknown }).code === 11000;
            if (duplicateKey) {
                logger.warn(`⚠️  Skipped (duplicate key): ${part.name}`);
            } else {
                logger.error(`❌ Error inserting ${part.name}:`, error);
            }
        }
    }

    logger.info("✅ Spare parts seeding completed");
}
