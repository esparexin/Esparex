/**
 * brands-models-expansion.seed.ts
 *
 * PURPOSE:
 *   Add missing models to existing brands across existing categories.
 *   Link multi-category brands (e.g. TV, Laptop, Mobile) and add missing TV screen sizes.
 *
 * RULES ENFORCED:
 *   - No new categories created.
 *   - Each model → exactly one brand + exactly one category.
 *   - Each brand → may belong to multiple categories (merged, not overwritten).
 *   - All operations are idempotent (upsert / $addToSet).
 *   - Uses existing CatalogImportService and ScreenSize model.
 *
 * SKIPPED (intentionally):
 *   - LED TV models: category uses hasScreenSizes=true, not models.
 *   - Blackberry (in Laptops): does not manufacture laptops.
 *   - Megaphone (in Mobiles): unrecognised consumer brand.
 *   - Gaming Consoles, Cameras, Smartwatches: not in DB, not to be created.
 */

import ScreenSize from '@esparex/core/models/ScreenSize';
import Category from '@esparex/core/models/Category';
import { CatalogImportService } from '@esparex/core/domains/catalog/application/services/CatalogImportService';
import logger from '@esparex/core/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Multi-Category Brands to Link
//    Brands that operate in multiple existing categories (e.g., Samsung in TVs,
//    Mobiles, Tablets, Laptops). Category IDs are merged idempotently.
// ─────────────────────────────────────────────────────────────────────────────

const MULTI_CATEGORY_BRANDS: { name: string; categories: string[] }[] = [
    // LED TV brand associations
    { name: 'Samsung', categories: ['LED TVs', 'Mobiles', 'Laptops', 'Tablets'] },
    { name: 'LG', categories: ['LED TVs', 'Laptops'] },
    { name: 'Sony', categories: ['LED TVs', 'Mobiles'] },
    { name: 'TCL', categories: ['LED TVs', 'Tablets'] },
    { name: 'Panasonic', categories: ['LED TVs', 'Laptops'] },
    { name: 'OnePlus', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Nokia', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Redmi', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Xiaomi', categories: ['LED TVs', 'Mobiles', 'Laptops', 'Tablets'] },
    { name: 'Realme', categories: ['LED TVs', 'Mobiles', 'Tablets'] },
    { name: 'Motorola', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Toshiba', categories: ['LED TVs', 'Laptops'] },

    // Laptop brand associations
    { name: 'Lenovo', categories: ['Laptops', 'Tablets'] },
    { name: 'Asus', categories: ['Laptops', 'Mobiles'] },
    { name: 'Acer', categories: ['Laptops', 'Tablets'] },
    { name: 'Microsoft', categories: ['Laptops', 'Tablets'] },
    { name: 'Huawei', categories: ['Laptops', 'Mobiles', 'Tablets'] },
    { name: 'Honor', categories: ['Laptops', 'Mobiles', 'Tablets'] },

    // Mobile / Tablet brand associations
    { name: 'Google', categories: ['Mobiles', 'Tablets'] },
];

/** Screen sizes missing from the DB (existing: 32, 40, 43, 50, 55, 65, 75, 85). */
const MISSING_TV_SIZES = [
    { size: '42"', value: 42 },
    { size: '48"', value: 48 },
    { size: '77"', value: 77 },
    { size: '86"', value: 86 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Drones — 16 existing brands in DB, 0 models → add models
//    One model → one brand → category: Drones
// ─────────────────────────────────────────────────────────────────────────────

const DRONE_MODELS: { name: string; brand: string }[] = [
    // DJI
    { name: 'DJI Mini 4 Pro', brand: 'DJI' },
    { name: 'DJI Mini 3 Pro', brand: 'DJI' },
    { name: 'DJI Mini 3', brand: 'DJI' },
    { name: 'DJI Air 3', brand: 'DJI' },
    { name: 'DJI Air 2S', brand: 'DJI' },
    { name: 'DJI Avata 2', brand: 'DJI' },
    { name: 'DJI Mavic 3 Classic', brand: 'DJI' },
    { name: 'DJI Mavic 3 Pro', brand: 'DJI' },
    { name: 'DJI FPV', brand: 'DJI' },
    { name: 'DJI Neo', brand: 'DJI' },
    { name: 'DJI Phantom 4 Pro V2', brand: 'DJI' },

    // Autel Robotics
    { name: 'Autel EVO Lite+', brand: 'Autel Robotics' },
    { name: 'Autel EVO Nano+', brand: 'Autel Robotics' },
    { name: 'Autel EVO Max 4T', brand: 'Autel Robotics' },
    { name: 'Autel EVO II Pro', brand: 'Autel Robotics' },

    // Parrot
    { name: 'Parrot ANAFI USA', brand: 'Parrot' },
    { name: 'Parrot ANAFI Ai', brand: 'Parrot' },
    { name: 'Parrot ANAFI FPV', brand: 'Parrot' },

    // Skydio
    { name: 'Skydio 2+', brand: 'Skydio' },
    { name: 'Skydio X10', brand: 'Skydio' },

    // Holy Stone
    { name: 'Holy Stone HS720E', brand: 'Holy Stone' },
    { name: 'Holy Stone HS175D', brand: 'Holy Stone' },
    { name: 'Holy Stone HS360S', brand: 'Holy Stone' },

    // Hubsan
    { name: 'Hubsan Zino Mini Pro', brand: 'Hubsan' },
    { name: 'Hubsan Zino Pro+', brand: 'Hubsan' },

    // Ryze Tech
    { name: 'Ryze Tello', brand: 'Ryze Tech' },
    { name: 'Ryze Tello EDU', brand: 'Ryze Tech' },

    // Yuneec
    { name: 'Yuneec Mantis Q', brand: 'Yuneec' },
    { name: 'Yuneec Typhoon H3', brand: 'Yuneec' },

    // Walkera
    { name: 'Walkera Vitus 320', brand: 'Walkera' },
    { name: 'Walkera F210', brand: 'Walkera' },

    // Freefly Systems
    { name: 'Freefly Alta X', brand: 'Freefly Systems' },
    { name: 'Freefly Astro', brand: 'Freefly Systems' },

    // Wingtra
    { name: 'WingtraOne GEN II', brand: 'Wingtra' },

    // senseFly
    { name: 'senseFly eBee X', brand: 'senseFly' },

    // Garuda Aerospace
    { name: 'Garuda Droni', brand: 'Garuda Aerospace' },
    { name: 'Garuda Agri Drone', brand: 'Garuda Aerospace' },

    // ideaForge
    { name: 'ideaForge SWITCH UAV', brand: 'ideaForge' },
    { name: 'ideaForge NETRA V4+', brand: 'ideaForge' },
    { name: 'ideaForge Q6 Nano', brand: 'ideaForge' },

    // Aarav Unmanned Systems
    { name: 'Aarav Scout', brand: 'Aarav Unmanned Systems' },

    // Asteria Aerospace
    { name: 'Asteria A200', brand: 'Asteria Aerospace' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Laptops — add missing models
//    One model → one brand → category: Laptops
// ─────────────────────────────────────────────────────────────────────────────

const LAPTOP_MODELS: { name: string; brand: string }[] = [
    // Apple
    { name: 'MacBook Air 13 (M3)', brand: 'Apple' },
    { name: 'MacBook Pro 14 (M3 Pro)', brand: 'Apple' },
    { name: 'MacBook Pro 16 (M3 Max)', brand: 'Apple' },

    // Dell
    { name: 'Dell XPS 14', brand: 'Dell' },
    { name: 'Dell XPS 16', brand: 'Dell' },
    { name: 'Dell Vostro 15 3530', brand: 'Dell' },
    { name: 'Dell Inspiron 14 2-in-1', brand: 'Dell' },
    { name: 'Dell Alienware m16', brand: 'Dell' },
    { name: 'Dell Latitude 5540', brand: 'Dell' },

    // HP
    { name: 'HP Victus 16', brand: 'HP' },
    { name: 'HP Omen 16', brand: 'HP' },
    { name: 'HP EliteBook 840 G10', brand: 'HP' },
    { name: 'HP 255 G9', brand: 'HP' },
    { name: 'HP Dragonfly G4', brand: 'HP' },

    // Asus
    { name: 'Asus ROG Zephyrus G16', brand: 'Asus' },
    { name: 'Asus ProArt Studiobook 16', brand: 'Asus' },
    { name: 'Asus Vivobook 16X', brand: 'Asus' },
    { name: 'Asus TUF Gaming A15', brand: 'Asus' },
    { name: 'Asus Zenbook 14 OLED', brand: 'Asus' },

    // Lenovo
    { name: 'Lenovo IdeaPad Gaming 3', brand: 'Lenovo' },
    { name: 'Lenovo LOQ 15', brand: 'Lenovo' },
    { name: 'Lenovo ThinkBook 16', brand: 'Lenovo' },
    { name: 'Lenovo Legion 5 Pro', brand: 'Lenovo' },
    { name: 'Lenovo IdeaPad Slim 3', brand: 'Lenovo' },

    // Microsoft
    { name: 'Microsoft Surface Pro 11', brand: 'Microsoft' },
    { name: 'Microsoft Surface Laptop 7', brand: 'Microsoft' },

    // Acer
    { name: 'Acer Nitro 5', brand: 'Acer' },
    { name: 'Acer Aspire Lite 15', brand: 'Acer' },
    { name: 'Acer Swift Go 14', brand: 'Acer' },

    // MSI
    { name: 'MSI Thin GF63', brand: 'MSI' },
    { name: 'MSI Katana 15', brand: 'MSI' },
    { name: 'MSI Creator M16', brand: 'MSI' },

    // Razer
    { name: 'Razer Blade 16', brand: 'Razer' },

    // Samsung
    { name: 'Samsung Galaxy Book4 360', brand: 'Samsung' },
    { name: 'Samsung Galaxy Book4 Edge', brand: 'Samsung' },

    // LG
    { name: 'LG Gram 17', brand: 'LG' },
    { name: 'LG Gram Style 14', brand: 'LG' },

    // Huawei
    { name: 'Huawei MateBook 14s', brand: 'Huawei' },

    // Honor
    { name: 'Honor MagicBook Art 14', brand: 'Honor' },

    // Gigabyte
    { name: 'Gigabyte Aorus 17X', brand: 'Gigabyte' },

    // Xiaomi
    { name: 'Xiaomi Book S 12', brand: 'Xiaomi' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mobiles — add missing / recent models
//    One model → one brand → category: Mobiles
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_MODELS: { name: string; brand: string }[] = [
    // Apple
    { name: 'iPhone 14', brand: 'Apple' },
    { name: 'iPhone 14 Plus', brand: 'Apple' },
    { name: 'iPhone 15 Plus', brand: 'Apple' },
    { name: 'iPhone 16', brand: 'Apple' },
    { name: 'iPhone 16 Plus', brand: 'Apple' },
    { name: 'iPhone 16 Pro', brand: 'Apple' },
    { name: 'iPhone 16 Pro Max', brand: 'Apple' },

    // Samsung
    { name: 'Samsung Galaxy S24+', brand: 'Samsung' },
    { name: 'Samsung Galaxy S24 FE', brand: 'Samsung' },
    { name: 'Samsung Galaxy S25', brand: 'Samsung' },
    { name: 'Samsung Galaxy S25+', brand: 'Samsung' },
    { name: 'Samsung Galaxy S25 Ultra', brand: 'Samsung' },
    { name: 'Samsung Galaxy A35', brand: 'Samsung' },
    { name: 'Samsung Galaxy A15 5G', brand: 'Samsung' },
    { name: 'Samsung Galaxy M35', brand: 'Samsung' },
    { name: 'Samsung Galaxy Z Fold6', brand: 'Samsung' },
    { name: 'Samsung Galaxy Z Flip6', brand: 'Samsung' },

    // OnePlus
    { name: 'OnePlus 13', brand: 'OnePlus' },
    { name: 'OnePlus 13R', brand: 'OnePlus' },
    { name: 'OnePlus Nord 4', brand: 'OnePlus' },
    { name: 'OnePlus Nord CE 4', brand: 'OnePlus' },
    { name: 'OnePlus Nord CE 4 Lite', brand: 'OnePlus' },

    // Xiaomi
    { name: 'Xiaomi 14T', brand: 'Xiaomi' },
    { name: 'Xiaomi 14T Pro', brand: 'Xiaomi' },
    { name: 'Xiaomi 15', brand: 'Xiaomi' },
    { name: 'Xiaomi 15 Ultra', brand: 'Xiaomi' },

    // Redmi
    { name: 'Redmi Note 14', brand: 'Redmi' },
    { name: 'Redmi Note 14 Pro', brand: 'Redmi' },
    { name: 'Redmi Note 14 Pro+', brand: 'Redmi' },
    { name: 'Redmi 14C', brand: 'Redmi' },
    { name: 'Redmi A3', brand: 'Redmi' },

    // Poco
    { name: 'Poco F6', brand: 'Poco' },
    { name: 'Poco M6 Pro', brand: 'Poco' },
    { name: 'Poco X7 Pro', brand: 'Poco' },
    { name: 'Poco X7', brand: 'Poco' },
    { name: 'Poco C75', brand: 'Poco' },

    // Realme
    { name: 'Realme GT 6', brand: 'Realme' },
    { name: 'Realme 13 Pro+', brand: 'Realme' },
    { name: 'Realme 13 Pro', brand: 'Realme' },
    { name: 'Realme Narzo 70 Pro', brand: 'Realme' },
    { name: 'Realme C65', brand: 'Realme' },

    // Vivo
    { name: 'Vivo V40', brand: 'Vivo' },
    { name: 'Vivo V40 Pro', brand: 'Vivo' },
    { name: 'Vivo X200 Pro', brand: 'Vivo' },
    { name: 'Vivo Y200', brand: 'Vivo' },
    { name: 'Vivo T3 Pro', brand: 'Vivo' },

    // Oppo
    { name: 'Oppo Find X8 Pro', brand: 'Oppo' },
    { name: 'Oppo Reno 12 Pro', brand: 'Oppo' },
    { name: 'Oppo A3 Pro', brand: 'Oppo' },
    { name: 'Oppo A60', brand: 'Oppo' },

    // Motorola
    { name: 'Motorola Edge 50 Fusion', brand: 'Motorola' },
    { name: 'Motorola Edge 50 Ultra', brand: 'Motorola' },
    { name: 'Moto G85', brand: 'Motorola' },
    { name: 'Moto G64', brand: 'Motorola' },

    // Nokia
    { name: 'Nokia G310', brand: 'Nokia' },
    { name: 'Nokia C12', brand: 'Nokia' },
    { name: 'Nokia 3210 (2024)', brand: 'Nokia' },

    // iQOO
    { name: 'iQOO 13', brand: 'iQOO' },
    { name: 'iQOO Neo 9 Pro', brand: 'iQOO' },
    { name: 'iQOO Z9 Turbo', brand: 'iQOO' },
    { name: 'iQOO Z9x', brand: 'iQOO' },

    // Google
    { name: 'Pixel 8a', brand: 'Google' },
    { name: 'Pixel 9', brand: 'Google' },
    { name: 'Pixel 9 Pro', brand: 'Google' },
    { name: 'Pixel 9 Pro Fold', brand: 'Google' },

    // Nothing
    { name: 'Nothing Phone (2a)', brand: 'Nothing' },
    { name: 'Nothing Phone (2a) Plus', brand: 'Nothing' },
    { name: 'CMF Phone 1', brand: 'Nothing' },

    // Infinix
    { name: 'Infinix Note 40 Pro 5G', brand: 'Infinix' },
    { name: 'Infinix GT 20 Pro', brand: 'Infinix' },
    { name: 'Infinix Zero 40 5G', brand: 'Infinix' },
    { name: 'Infinix Hot 50 5G', brand: 'Infinix' },

    // Tecno
    { name: 'Tecno Camon 30 Premier', brand: 'Tecno' },
    { name: 'Tecno Pova 6 Pro 5G', brand: 'Tecno' },
    { name: 'Tecno Spark 20 Pro+', brand: 'Tecno' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. Tablets — add missing models
//    One model → one brand → category: Tablets
// ─────────────────────────────────────────────────────────────────────────────

const TABLET_MODELS: { name: string; brand: string }[] = [
    // Apple
    { name: 'iPad mini (7th Gen)', brand: 'Apple' },
    { name: 'iPad Air 11 (M3)', brand: 'Apple' },
    { name: 'iPad Air 13 (M3)', brand: 'Apple' },

    // Samsung
    { name: 'Samsung Galaxy Tab S10', brand: 'Samsung' },
    { name: 'Samsung Galaxy Tab S10+', brand: 'Samsung' },
    { name: 'Samsung Galaxy Tab S10 FE', brand: 'Samsung' },
    { name: 'Samsung Galaxy Tab A9', brand: 'Samsung' },

    // Microsoft
    { name: 'Microsoft Surface Pro 11', brand: 'Microsoft' },
    { name: 'Microsoft Surface Laptop 7', brand: 'Microsoft' },

    // Google
    { name: 'Google Pixel Tablet 2', brand: 'Google' },

    // Lenovo
    { name: 'Lenovo Tab M11', brand: 'Lenovo' },
    { name: 'Lenovo Tab P12', brand: 'Lenovo' },
    { name: 'Lenovo Tab Extreme', brand: 'Lenovo' },

    // Amazon
    { name: 'Amazon Fire Max 11', brand: 'Amazon' },
    { name: 'Amazon Fire HD 10 Plus', brand: 'Amazon' },

    // TCL
    { name: 'TCL NXTPAPER 12 Pro', brand: 'TCL' },

    // Xiaomi
    { name: 'Xiaomi Pad 6S Pro', brand: 'Xiaomi' },
    { name: 'Xiaomi Pad 7', brand: 'Xiaomi' },

    // Honor
    { name: 'Honor Pad X9', brand: 'Honor' },

    // Huawei
    { name: 'Huawei MatePad 12 X', brand: 'Huawei' },
    { name: 'Huawei MatePad Air 12', brand: 'Huawei' },

    // Realme
    { name: 'Realme Pad 2 Pro', brand: 'Realme' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBrandsModelsExpansion(): Promise<void> {
    logger.info('🌱 Starting brands-models-expansion seed...');

    // ── Step 1: Link multi-category brands ────────────────────────────────────
    logger.info('🔗 Step 1: Linking multi-category brands to their respective categories...');
    const brandData = MULTI_CATEGORY_BRANDS.map(b => ({
        name: b.name,
        categories: b.categories,
    }));
    const brandResult = await CatalogImportService.importBrands(brandData);
    logger.info(`   Brands updated/linked: ${brandResult.success}, failed: ${brandResult.failed}`);
    if (brandResult.errors.length) logger.warn('   Errors:', brandResult.errors);

    // ── Step 2: LED TVs — add missing screen sizes ────────────────────────────
    logger.info('📺 Step 2: Adding missing LED TV screen sizes...');
    const tvCat = await Category.findOne({ slug: 'led-tvs' }).lean();
    if (!tvCat) {
        logger.warn('   ⚠️ LED TVs category not found — skipping screen sizes.');
    } else {
        for (const item of MISSING_TV_SIZES) {
            await ScreenSize.findOneAndUpdate(
                { size: item.size, categoryId: tvCat._id },
                {
                    size: item.size,
                    name: `${item.size} Screen Size`,
                    displayName: `${item.size} Screen Size`,
                    value: item.value,
                    categoryId: tvCat._id,
                    isActive: true,
                    isDeleted: false,
                },
                { upsert: true }
            );
        }
        logger.info(`   Screen sizes ensured: ${MISSING_TV_SIZES.map(s => s.size).join(', ')}`);
    }

    // ── Step 3: Drones — add models ───────────────────────────────────────────
    logger.info('🚁 Step 3: Adding Drone models...');
    const droneData = DRONE_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Drones',
    }));
    const droneResult = await CatalogImportService.importModels(droneData);
    logger.info(`   Drone models added/updated: ${droneResult.success}, failed: ${droneResult.failed}`);
    if (droneResult.errors.length) logger.warn('   Errors:', droneResult.errors);

    // ── Step 4: Laptops — add missing models ──────────────────────────────────
    logger.info('💻 Step 4: Adding missing Laptop models...');
    const laptopData = LAPTOP_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Laptops',
    }));
    const laptopResult = await CatalogImportService.importModels(laptopData);
    logger.info(`   Laptop models added/updated: ${laptopResult.success}, failed: ${laptopResult.failed}`);
    if (laptopResult.errors.length) logger.warn('   Errors:', laptopResult.errors);

    // ── Step 5: Mobiles — add missing / recent models ─────────────────────────
    logger.info('📱 Step 5: Adding missing Mobile models...');
    const mobileData = MOBILE_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Mobiles',
    }));
    const mobileResult = await CatalogImportService.importModels(mobileData);
    logger.info(`   Mobile models added/updated: ${mobileResult.success}, failed: ${mobileResult.failed}`);
    if (mobileResult.errors.length) logger.warn('   Errors:', mobileResult.errors);

    // ── Step 6: Tablets — add missing models ─────────────────────────────────
    logger.info('📟 Step 6: Adding missing Tablet models...');
    const tabletData = TABLET_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Tablets',
    }));
    const tabletResult = await CatalogImportService.importModels(tabletData);
    logger.info(`   Tablet models added/updated: ${tabletResult.success}, failed: ${tabletResult.failed}`);
    if (tabletResult.errors.length) logger.warn('   Errors:', tabletResult.errors);

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalModels =
        droneResult.success +
        laptopResult.success +
        mobileResult.success +
        tabletResult.success;

    logger.info('');
    logger.info('✅ brands-models-expansion seed complete.');
    logger.info(`   Multi-category brands processed: ${brandResult.success}`);
    logger.info(`   Screen sizes verified:           ${MISSING_TV_SIZES.length}`);
    logger.info(`   Drone models:                    ${droneResult.success}`);
    logger.info(`   Laptop models:                   ${laptopResult.success}`);
    logger.info(`   Mobile models:                   ${mobileResult.success}`);
    logger.info(`   Tablet models:                   ${tabletResult.success}`);
    logger.info(`   Total models processed:          ${totalModels}`);
}
