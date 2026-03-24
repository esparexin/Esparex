import ScreenSize from "../models/ScreenSize";
import Category from "../models/Category";
import logger from "../utils/logger";

const TV_SIZES = [
    { size: '32"', value: 32 },
    { size: '40"', value: 40 },
    { size: '43"', value: 43 },
    { size: '50"', value: 50 },
    { size: '55"', value: 55 },
    { size: '65"', value: 65 },
    { size: '75"', value: 75 },
    { size: '85"', value: 85 }
];

const MONITOR_SIZES = [
    { size: '19"', value: 19 },
    { size: '22"', value: 22 },
    { size: '24"', value: 24 },
    { size: '27"', value: 27 },
    { size: '32"', value: 32 },
    { size: '34"', value: 34 }
];

export async function seedScreenSizes() {
    logger.info("🌱 Seeding screen sizes (TVs & Monitors)...");

    try {
        // 1. Get Categories
        const [tvCat, monitorCat] = await Promise.all([
            Category.findOne({ slug: 'led-tvs' }),
            Category.findOne({ slug: 'monitors' })
        ]);

        if (!tvCat) {
            logger.warn("⚠️ LED TVs category not found. Skipping TV screen sizes.");
        } else {
            for (const item of TV_SIZES) {
                await ScreenSize.findOneAndUpdate(
                    { size: item.size, categoryId: tvCat._id },
                    { 
                        name: `${item.size} Screen Size`, 
                        value: item.value,
                        isActive: true,
                        isDeleted: false
                    },
                    { upsert: true }
                );
            }
        }

        if (!monitorCat) {
            logger.warn("⚠️ Monitors category not found. Skipping monitor screen sizes.");
        } else {
            for (const item of MONITOR_SIZES) {
                await ScreenSize.findOneAndUpdate(
                    { size: item.size, categoryId: monitorCat._id },
                    { 
                        name: `${item.size} Screen Size`, 
                        value: item.value,
                        isActive: true,
                        isDeleted: false
                    },
                    { upsert: true }
                );
            }
        }

        logger.info("✅ Screen sizes seeded successfully.");
    } catch (error) {
        logger.error("❌ Error seeding screen sizes:", error);
    }
}
