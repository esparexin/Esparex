
import { bulkImportService } from "../services/bulkImportService";
import logger from "../utils/logger";

const DEVICE_SEED_DATA = [
    // Smartphones
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15 Pro Max', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15 Pro', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15 Plus', specs: { storage: '128GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 15', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 14 Pro', specs: { storage: '128GB', display: '6.1-inch' } },
    { type: 'smartphone', brand: 'Apple', name: 'iPhone 13', specs: { storage: '128GB', display: '6.1-inch' } },

    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S24 Ultra', specs: { storage: '256GB', display: '6.8-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S24+', specs: { storage: '256GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S24', specs: { storage: '128GB', display: '6.2-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy S23 Ultra', specs: { storage: '256GB', display: '6.8-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy Z Fold5', specs: { storage: '256GB', display: '7.6-inch' } },
    { type: 'smartphone', brand: 'Samsung', name: 'Galaxy Z Flip5', specs: { storage: '256GB', display: '6.7-inch' } },

    { type: 'smartphone', brand: 'Google', name: 'Pixel 8 Pro', specs: { storage: '128GB', display: '6.7-inch' } },
    { type: 'smartphone', brand: 'Google', name: 'Pixel 8', specs: { storage: '128GB', display: '6.2-inch' } },
    { type: 'smartphone', brand: 'Google', name: 'Pixel 7a', specs: { storage: '128GB', display: '6.1-inch' } },

    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus 12', specs: { storage: '256GB', display: '6.82-inch' } },
    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus 12R', specs: { storage: '128GB', display: '6.78-inch' } },
    { type: 'smartphone', brand: 'OnePlus', name: 'OnePlus Open', specs: { storage: '512GB', display: '7.82-inch' } },

    { type: 'smartphone', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra', specs: { storage: '512GB', display: '6.73-inch' } },
    { type: 'smartphone', brand: 'Xiaomi', name: 'Xiaomi 14', specs: { storage: '256GB', display: '6.36-inch' } },
    { type: 'smartphone', brand: 'Xiaomi', name: 'Redmi Note 13 Pro', specs: { storage: '256GB', display: '6.67-inch' } },

    // Tablets
    { type: 'tablet', brand: 'Apple', name: 'iPad Pro 12.9 (M2)', specs: { storage: '128GB', display: '12.9-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad Pro 11 (M2)', specs: { storage: '128GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad Air (5th Gen)', specs: { storage: '64GB', display: '10.9-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad (10th Gen)', specs: { storage: '64GB', display: '10.9-inch' } },
    { type: 'tablet', brand: 'Apple', name: 'iPad mini (6th Gen)', specs: { storage: '64GB', display: '8.3-inch' } },

    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9 Ultra', specs: { storage: '256GB', display: '14.6-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9+', specs: { storage: '256GB', display: '12.4-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9', specs: { storage: '128GB', display: '11-inch' } },
    { type: 'tablet', brand: 'Samsung', name: 'Galaxy Tab S9 FE', specs: { storage: '128GB', display: '10.9-inch' } },

    { type: 'tablet', brand: 'Microsoft', name: 'Surface Pro 9', specs: { storage: '128GB', display: '13-inch' } },
    { type: 'tablet', brand: 'Microsoft', name: 'Surface Go 3', specs: { storage: '64GB', display: '10.5-inch' } },

    { type: 'tablet', brand: 'Lenovo', name: 'Tab P12 Pro', specs: { storage: '128GB', display: '12.6-inch' } },
    { type: 'tablet', brand: 'Lenovo', name: 'Tab M10 Plus', specs: { storage: '32GB', display: '10.6-inch' } },

    { type: 'tablet', brand: 'Google', name: 'Pixel Tablet', specs: { storage: '128GB', display: '10.95-inch' } },

    // Laptops
    { type: 'laptop', brand: 'Apple', name: 'MacBook Pro 14 (M3)', specs: { storage: '512GB', display: '14.2-inch' } },
    { type: 'laptop', brand: 'Apple', name: 'MacBook Air 13 (M2)', specs: { storage: '256GB', display: '13.6-inch' } },
    { type: 'laptop', brand: 'Dell', name: 'XPS 13', specs: { storage: '512GB', display: '13.4-inch' } },
    { type: 'laptop', brand: 'HP', name: 'Spectre x360', specs: { storage: '512GB', display: '14-inch' } },
    { type: 'laptop', brand: 'Lenovo', name: 'ThinkPad X1 Carbon', specs: { storage: '512GB', display: '14-inch' } },

    // TVs
    { type: 'tv', brand: 'Samsung', name: 'Neo QLED 4K', specs: { display: '65-inch' } },
    { type: 'tv', brand: 'Sony', name: 'Bravia XR A80L', specs: { display: '55-inch' } },
    { type: 'tv', brand: 'LG', name: 'OLED C3', specs: { display: '48-inch' } }
];

export async function seedDevices() {
    logger.info("🌱 Seeding devices (Smartphones, Tablets, Laptops & TVs)...");
    const result = await bulkImportService.seedDevices(DEVICE_SEED_DATA);
    logger.info(`✅ Seeding completed: ${result.success} succeeded, ${result.failed} failed.`);
    if (result.errors.length > 0) {
        logger.warn("⚠️ Errors during seeding:", result.errors.slice(0, 5));
    }
}
