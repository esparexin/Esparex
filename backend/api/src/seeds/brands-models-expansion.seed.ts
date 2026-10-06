/**
 * brands-models-expansion.seed.ts
 *
 * PURPOSE:
 *   Comprehensive 6-year catalog expansion (2020–2026).
 *   Adds missing models to existing brands across existing active categories:
 *     - Drones: all 16 DB brands (2020–2026)
 *     - Laptops: Apple (Intel 2020 + M1-M4), Dell, HP, ASUS, Lenovo, Acer, MSI, etc.
 *     - Mobiles: Apple (iPhone 12-16e), Samsung (S20-S25, Note 20, Z Fold/Flip, A/M/F series),
 *       OnePlus, Google Pixel, Xiaomi, Redmi, POCO, Realme, Vivo, iQOO, OPPO, Motorola,
 *       Nokia, Nothing, Infinix, Tecno, Lava, Honor, Huawei (2020–2026)
 *     - Tablets: Apple (iPad 8th-10th, Air 4-M2, mini 6-7, Pro M1-M4), Samsung (Tab S6 Lite-S10, Tab A7-A9),
 *       Lenovo, Xiaomi, Realme, OnePlus, Amazon, TCL, Microsoft, Honor, Huawei, Acer
 *     - LED TVs: strictly uses Screen Size architecture (0 models created);
 *       links 25 major TV brands and ensures 12 standard screen sizes.
 *
 * GOVERNANCE RULES ENFORCED:
 *   - Strictly existing categories only: Mobiles, Laptops, Tablets, Drones, LED TVs.
 *   - Each model -> exactly one brand + exactly one category.
 *   - Multi-category brands: merged idempotently via CatalogImportService.importBrands.
 *   - Zero models for LED TVs (hasScreenSizes: true).
 *   - All inserts run with upsert via CatalogImportService (idempotent, no duplicates).
 */

import { CatalogImportService } from '@esparex/core';
import { CatalogSeedService } from '@esparex/core';
import { logger } from '@esparex/core';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Multi-Category Brands to Link
// ─────────────────────────────────────────────────────────────────────────────

const MULTI_CATEGORY_BRANDS: { name: string; categories: string[] }[] = [
    // TV brands to link to LED TVs
    { name: 'Samsung', categories: ['LED TVs', 'Mobiles', 'Laptops', 'Tablets'] },
    { name: 'LG', categories: ['LED TVs', 'Laptops'] },
    { name: 'Sony', categories: ['LED TVs', 'Mobiles'] },
    { name: 'TCL', categories: ['LED TVs', 'Tablets'] },
    { name: 'Panasonic', categories: ['LED TVs', 'Laptops'] },
    { name: 'OnePlus', categories: ['LED TVs', 'Mobiles', 'Tablets'] },
    { name: 'Nokia', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Redmi', categories: ['LED TVs', 'Mobiles', 'Tablets'] },
    { name: 'Xiaomi', categories: ['LED TVs', 'Mobiles', 'Laptops', 'Tablets'] },
    { name: 'Realme', categories: ['LED TVs', 'Mobiles', 'Tablets'] },
    { name: 'Motorola', categories: ['LED TVs', 'Mobiles'] },
    { name: 'Toshiba', categories: ['LED TVs', 'Laptops'] },

    // Laptop brands
    { name: 'Lenovo', categories: ['Laptops', 'Tablets'] },
    { name: 'Asus', categories: ['Laptops', 'Mobiles'] },
    { name: 'Acer', categories: ['Laptops', 'Tablets'] },
    { name: 'Microsoft', categories: ['Laptops', 'Tablets'] },
    { name: 'Huawei', categories: ['Laptops', 'Mobiles', 'Tablets'] },
    { name: 'Honor', categories: ['Laptops', 'Mobiles', 'Tablets'] },

    // Mobile / Tablet brands
    { name: 'Google', categories: ['Mobiles', 'Tablets'] },
    { name: 'Apple', categories: ['Mobiles', 'Laptops', 'Tablets'] },
    { name: 'Dell', categories: ['Laptops'] },
    { name: 'HP', categories: ['Laptops'] },
    { name: 'MSI', categories: ['Laptops'] },
    { name: 'Razer', categories: ['Laptops'] },
    { name: 'Gigabyte', categories: ['Laptops'] },
];

/** Screen sizes missing from the DB (existing: 32, 40, 43, 50, 55, 65, 75, 85). */
const MISSING_TV_SIZES = [
    { size: '42"', value: 42 },
    { size: '48"', value: 48 },
    { size: '77"', value: 77 },
    { size: '86"', value: 86 },
];

const DRONE_MODELS: { name: string; brand: string }[] = [
    {
        "name": "DJI Mini 2",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini SE",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini 2 SE",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini 3",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini 3 Pro",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini 4 Pro",
        "brand": "DJI"
    },
    {
        "name": "DJI Mini 4K",
        "brand": "DJI"
    },
    {
        "name": "DJI Neo",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic Air 2",
        "brand": "DJI"
    },
    {
        "name": "DJI Air 2S",
        "brand": "DJI"
    },
    {
        "name": "DJI Air 3",
        "brand": "DJI"
    },
    {
        "name": "DJI Air 3S",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3 Cine",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3 Classic",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3 Pro",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3 Enterprise",
        "brand": "DJI"
    },
    {
        "name": "DJI Mavic 3 Thermal",
        "brand": "DJI"
    },
    {
        "name": "DJI FPV",
        "brand": "DJI"
    },
    {
        "name": "DJI Avata",
        "brand": "DJI"
    },
    {
        "name": "DJI Avata 2",
        "brand": "DJI"
    },
    {
        "name": "DJI Inspire 3",
        "brand": "DJI"
    },
    {
        "name": "DJI Matrice 30",
        "brand": "DJI"
    },
    {
        "name": "DJI Matrice 30T",
        "brand": "DJI"
    },
    {
        "name": "DJI Matrice 300 RTK",
        "brand": "DJI"
    },
    {
        "name": "DJI Matrice 350 RTK",
        "brand": "DJI"
    },
    {
        "name": "DJI Phantom 4 Pro V2.0",
        "brand": "DJI"
    },
    {
        "name": "Autel EVO II",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO II Pro",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO II Pro V2",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO II Pro V3",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO II Dual 640T",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO II Dual 640T V3",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Nano",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Nano+",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Lite",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Lite+",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Max 4T",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel EVO Max 4N",
        "brand": "Autel Robotics"
    },
    {
        "name": "Autel Alpha",
        "brand": "Autel Robotics"
    },
    {
        "name": "Parrot ANAFI Thermal",
        "brand": "Parrot"
    },
    {
        "name": "Parrot ANAFI USA",
        "brand": "Parrot"
    },
    {
        "name": "Parrot ANAFI Ai",
        "brand": "Parrot"
    },
    {
        "name": "Parrot ANAFI FPV",
        "brand": "Parrot"
    },
    {
        "name": "Skydio 2",
        "brand": "Skydio"
    },
    {
        "name": "Skydio 2+",
        "brand": "Skydio"
    },
    {
        "name": "Skydio X2",
        "brand": "Skydio"
    },
    {
        "name": "Skydio X10",
        "brand": "Skydio"
    },
    {
        "name": "Holy Stone HS720",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS720E",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS720G",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS175D",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS360",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS360S",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS440",
        "brand": "Holy Stone"
    },
    {
        "name": "Holy Stone HS600",
        "brand": "Holy Stone"
    },
    {
        "name": "Hubsan Zino 2+",
        "brand": "Hubsan"
    },
    {
        "name": "Hubsan Zino Pro+",
        "brand": "Hubsan"
    },
    {
        "name": "Hubsan Zino Mini Pro",
        "brand": "Hubsan"
    },
    {
        "name": "Hubsan Zino Mini SE",
        "brand": "Hubsan"
    },
    {
        "name": "Hubsan Ace Pro",
        "brand": "Hubsan"
    },
    {
        "name": "Hubsan Blackhawk 2",
        "brand": "Hubsan"
    },
    {
        "name": "Ryze Tello",
        "brand": "Ryze Tech"
    },
    {
        "name": "Ryze Tello EDU",
        "brand": "Ryze Tech"
    },
    {
        "name": "Ryze Tello Iron Man Edition",
        "brand": "Ryze Tech"
    },
    {
        "name": "Yuneec Typhoon H Plus",
        "brand": "Yuneec"
    },
    {
        "name": "Yuneec Typhoon H3",
        "brand": "Yuneec"
    },
    {
        "name": "Yuneec Mantis Q",
        "brand": "Yuneec"
    },
    {
        "name": "Yuneec Mantis G",
        "brand": "Yuneec"
    },
    {
        "name": "Yuneec H520E",
        "brand": "Yuneec"
    },
    {
        "name": "Walkera Vitus 320",
        "brand": "Walkera"
    },
    {
        "name": "Walkera F210",
        "brand": "Walkera"
    },
    {
        "name": "Walkera Rodeo 110",
        "brand": "Walkera"
    },
    {
        "name": "Walkera T210",
        "brand": "Walkera"
    },
    {
        "name": "Freefly Alta X",
        "brand": "Freefly Systems"
    },
    {
        "name": "Freefly Astro",
        "brand": "Freefly Systems"
    },
    {
        "name": "WingtraOne",
        "brand": "Wingtra"
    },
    {
        "name": "WingtraOne GEN II",
        "brand": "Wingtra"
    },
    {
        "name": "senseFly eBee X",
        "brand": "senseFly"
    },
    {
        "name": "senseFly eBee Geo",
        "brand": "senseFly"
    },
    {
        "name": "senseFly eBee Ag",
        "brand": "senseFly"
    },
    {
        "name": "ideaForge SWITCH UAV",
        "brand": "ideaForge"
    },
    {
        "name": "ideaForge NETRA V4+",
        "brand": "ideaForge"
    },
    {
        "name": "ideaForge Q6 Nano",
        "brand": "ideaForge"
    },
    {
        "name": "ideaForge RYNO UAV",
        "brand": "ideaForge"
    },
    {
        "name": "ideaForge NINJA UAV",
        "brand": "ideaForge"
    },
    {
        "name": "Garuda Droni",
        "brand": "Garuda Aerospace"
    },
    {
        "name": "Garuda Agri Drone",
        "brand": "Garuda Aerospace"
    },
    {
        "name": "Garuda Surya",
        "brand": "Garuda Aerospace"
    },
    {
        "name": "Garuda Trishul",
        "brand": "Garuda Aerospace"
    },
    {
        "name": "Asteria A200",
        "brand": "Asteria Aerospace"
    },
    {
        "name": "Asteria A400",
        "brand": "Asteria Aerospace"
    },
    {
        "name": "Asteria AT-15",
        "brand": "Asteria Aerospace"
    },
    {
        "name": "Aarav Scout",
        "brand": "Aarav Unmanned Systems"
    },
    {
        "name": "Aarav V-Series",
        "brand": "Aarav Unmanned Systems"
    },
    {
        "name": "Aarav Insight",
        "brand": "Aarav Unmanned Systems"
    }
];

const LAPTOP_MODELS: { name: string; brand: string }[] = [
    {
        "name": "MacBook Air 13 (M1, 2020)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 13 (M1, 2020)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M1 Pro, 2021)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M1 Max, 2021)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M1 Pro, 2021)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M1 Max, 2021)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Air 13 (M2, 2022)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 13 (M2, 2022)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Air 15 (M2, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M2 Pro, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M2 Max, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M2 Pro, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M2 Max, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M3, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M3 Pro, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M3 Max, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M3 Pro, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M3 Max, 2023)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Air 13 (M3, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Air 15 (M3, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M4, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M4 Pro, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 14 (M4 Max, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M4 Pro, 2024)",
        "brand": "Apple"
    },
    {
        "name": "MacBook Pro 16 (M4 Max, 2024)",
        "brand": "Apple"
    },
    {
        "name": "Dell XPS 13 9300",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 13 9310",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 13 9315",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 13 Plus 9320",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 13 9340 (2024)",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 14 9440 (2024)",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 15 9500",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 15 9510",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 15 9520",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 15 9530",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 16 9640 (2024)",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 17 9700",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 17 9710",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 17 9720",
        "brand": "Dell"
    },
    {
        "name": "Dell XPS 17 9730",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 5402",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 5410",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 5420",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 5430",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 Plus 7420",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 14 Plus 7440",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 15 3501",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 15 3511",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 15 3520",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 15 3530",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 16 5620",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 16 5630",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 16 Plus 7620",
        "brand": "Dell"
    },
    {
        "name": "Dell Inspiron 16 Plus 7630",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 3420",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 3520",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 5420",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 5430",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 5440",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 5540",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 7420",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 7430",
        "brand": "Dell"
    },
    {
        "name": "Dell Latitude 7440",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 3400",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 3500",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 3510",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 3520",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 3530",
        "brand": "Dell"
    },
    {
        "name": "Dell Vostro 5620",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m15 R3",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m15 R4",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m15 R5",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m15 R6",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m15 R7",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m16 R1",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m16 R2",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware m18 R1",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware x14 R1",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware x14 R2",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware x15 R1",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware x15 R2",
        "brand": "Dell"
    },
    {
        "name": "Dell Alienware x16 R1",
        "brand": "Dell"
    },
    {
        "name": "Dell G15 5510",
        "brand": "Dell"
    },
    {
        "name": "Dell G15 5511",
        "brand": "Dell"
    },
    {
        "name": "Dell G15 5520",
        "brand": "Dell"
    },
    {
        "name": "Dell G15 5530",
        "brand": "Dell"
    },
    {
        "name": "Dell G16 7630",
        "brand": "Dell"
    },
    {
        "name": "HP Pavilion 14",
        "brand": "HP"
    },
    {
        "name": "HP Pavilion 15",
        "brand": "HP"
    },
    {
        "name": "HP Pavilion Plus 14",
        "brand": "HP"
    },
    {
        "name": "HP Pavilion Aero 13",
        "brand": "HP"
    },
    {
        "name": "HP Pavilion Gaming 15",
        "brand": "HP"
    },
    {
        "name": "HP Victus 15",
        "brand": "HP"
    },
    {
        "name": "HP Victus 16",
        "brand": "HP"
    },
    {
        "name": "HP Omen 15",
        "brand": "HP"
    },
    {
        "name": "HP Omen 16",
        "brand": "HP"
    },
    {
        "name": "HP Omen 17",
        "brand": "HP"
    },
    {
        "name": "HP Omen Transcend 14",
        "brand": "HP"
    },
    {
        "name": "HP Omen Transcend 16",
        "brand": "HP"
    },
    {
        "name": "HP Envy 13",
        "brand": "HP"
    },
    {
        "name": "HP Envy 14",
        "brand": "HP"
    },
    {
        "name": "HP Envy 15",
        "brand": "HP"
    },
    {
        "name": "HP Envy 16",
        "brand": "HP"
    },
    {
        "name": "HP Envy x360 13",
        "brand": "HP"
    },
    {
        "name": "HP Envy x360 14",
        "brand": "HP"
    },
    {
        "name": "HP Envy x360 15",
        "brand": "HP"
    },
    {
        "name": "HP Spectre x360 13.5",
        "brand": "HP"
    },
    {
        "name": "HP Spectre x360 14",
        "brand": "HP"
    },
    {
        "name": "HP Spectre x360 15",
        "brand": "HP"
    },
    {
        "name": "HP Spectre x360 16",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 840 G7",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 840 G8",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 840 G9",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 840 G10",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 840 G11",
        "brand": "HP"
    },
    {
        "name": "HP EliteBook 640 G9",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 440 G7",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 440 G8",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 440 G9",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 440 G10",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 450 G8",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 450 G9",
        "brand": "HP"
    },
    {
        "name": "HP ProBook 450 G10",
        "brand": "HP"
    },
    {
        "name": "HP 14s",
        "brand": "HP"
    },
    {
        "name": "HP 15s",
        "brand": "HP"
    },
    {
        "name": "HP 240 G8",
        "brand": "HP"
    },
    {
        "name": "HP 250 G8",
        "brand": "HP"
    },
    {
        "name": "HP 255 G8",
        "brand": "HP"
    },
    {
        "name": "HP 255 G9",
        "brand": "HP"
    },
    {
        "name": "HP Dragonfly G4",
        "brand": "HP"
    },
    {
        "name": "Lenovo ThinkPad T14 Gen 1",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14 Gen 2",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14 Gen 3",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14 Gen 5",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14s Gen 3",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad T14s Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon Gen 8",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon Gen 9",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon Gen 10",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon Gen 11",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon Gen 12",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Yoga Gen 6",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad X1 Yoga Gen 7",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad E14 Gen 2",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad E14 Gen 3",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad E14 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad E14 Gen 5",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad E15 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad L14 Gen 3",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkPad L14 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad 3 14",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad 3 15",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad Slim 3 14",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad Slim 3 15",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad Slim 5 14",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad Slim 5 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo IdeaPad Gaming 3 15",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo LOQ 15",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo LOQ 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion 5 15",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion 5 Pro 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion 7 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion Slim 5 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion Slim 7 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Legion Pro 7i",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkBook 14 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkBook 15 Gen 4",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo ThinkBook 16 Gen 6",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga 6 13",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga 7 14",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga 7i 16",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga 9i 14",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga Slim 7 Pro",
        "brand": "Lenovo"
    },
    {
        "name": "Asus Zenbook 13 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook 14",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook 14 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook 14X OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook Pro 14 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook Duo 14",
        "brand": "Asus"
    },
    {
        "name": "Asus Zenbook S 13 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook 14",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook 15",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook 16",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook 16X",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook S 14 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook S 15 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus Vivobook Pro 15 OLED",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Gaming A15",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Gaming F15",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Gaming A16",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Gaming A17",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Gaming F17",
        "brand": "Asus"
    },
    {
        "name": "Asus TUF Dash F15",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Zephyrus G14",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Zephyrus G15",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Zephyrus G16",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Zephyrus M16",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Zephyrus Duo 16",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix G15",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix G16",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix G17",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix SCAR 15",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix SCAR 16",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix SCAR 17",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Strix SCAR 18",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Flow X13",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Flow Z13",
        "brand": "Asus"
    },
    {
        "name": "Asus ROG Flow X16",
        "brand": "Asus"
    },
    {
        "name": "Asus ProArt Studiobook 16 OLED",
        "brand": "Asus"
    },
    {
        "name": "Acer Aspire 3 15",
        "brand": "Acer"
    },
    {
        "name": "Acer Aspire 5 14",
        "brand": "Acer"
    },
    {
        "name": "Acer Aspire 5 15",
        "brand": "Acer"
    },
    {
        "name": "Acer Aspire 7 15",
        "brand": "Acer"
    },
    {
        "name": "Acer Aspire Lite 15",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift 3 14",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift 5 14",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift Go 14",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift Go 16",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift X 14",
        "brand": "Acer"
    },
    {
        "name": "Acer Swift Edge 16",
        "brand": "Acer"
    },
    {
        "name": "Acer Nitro 5 AN515",
        "brand": "Acer"
    },
    {
        "name": "Acer Nitro 16",
        "brand": "Acer"
    },
    {
        "name": "Acer Nitro 17",
        "brand": "Acer"
    },
    {
        "name": "Acer Nitro V 15",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Helios 300",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Helios 16",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Helios 18",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Triton 300 SE",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Triton 500 SE",
        "brand": "Acer"
    },
    {
        "name": "Acer Predator Triton 14",
        "brand": "Acer"
    },
    {
        "name": "MSI GF63 Thin",
        "brand": "MSI"
    },
    {
        "name": "MSI GF65 Thin",
        "brand": "MSI"
    },
    {
        "name": "MSI Katana 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Katana 17",
        "brand": "MSI"
    },
    {
        "name": "MSI Katana GF66",
        "brand": "MSI"
    },
    {
        "name": "MSI Katana GF76",
        "brand": "MSI"
    },
    {
        "name": "MSI Bravo 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Cyborg 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Sword 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Pulse GL66",
        "brand": "MSI"
    },
    {
        "name": "MSI Pulse 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Crosshair 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Stealth 14 Studio",
        "brand": "MSI"
    },
    {
        "name": "MSI Stealth 15M",
        "brand": "MSI"
    },
    {
        "name": "MSI Stealth 16 Studio",
        "brand": "MSI"
    },
    {
        "name": "MSI Stealth 17 Studio",
        "brand": "MSI"
    },
    {
        "name": "MSI GS66 Stealth",
        "brand": "MSI"
    },
    {
        "name": "MSI Raider GE66",
        "brand": "MSI"
    },
    {
        "name": "MSI Raider GE76",
        "brand": "MSI"
    },
    {
        "name": "MSI Raider GE78 HX",
        "brand": "MSI"
    },
    {
        "name": "MSI Titan GT77 HX",
        "brand": "MSI"
    },
    {
        "name": "MSI Vector GP66",
        "brand": "MSI"
    },
    {
        "name": "MSI Vector GP68 HX",
        "brand": "MSI"
    },
    {
        "name": "MSI Modern 14",
        "brand": "MSI"
    },
    {
        "name": "MSI Modern 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Prestige 14",
        "brand": "MSI"
    },
    {
        "name": "MSI Prestige 15",
        "brand": "MSI"
    },
    {
        "name": "MSI Prestige 16 Studio",
        "brand": "MSI"
    },
    {
        "name": "MSI Creator M16",
        "brand": "MSI"
    },
    {
        "name": "MSI Creator Z16",
        "brand": "MSI"
    },
    {
        "name": "Samsung Galaxy Book Pro",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book Pro 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book2",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book2 Pro",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book2 Pro 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book2 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book3",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book3 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book3 Pro",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book3 Pro 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book3 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4 Pro",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4 Pro 360",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Book4 Edge",
        "brand": "Samsung"
    },
    {
        "name": "LG Gram 14",
        "brand": "LG"
    },
    {
        "name": "LG Gram 15",
        "brand": "LG"
    },
    {
        "name": "LG Gram 16",
        "brand": "LG"
    },
    {
        "name": "LG Gram 17",
        "brand": "LG"
    },
    {
        "name": "LG Gram 2-in-1 14",
        "brand": "LG"
    },
    {
        "name": "LG Gram 2-in-1 16",
        "brand": "LG"
    },
    {
        "name": "LG Gram Style 14",
        "brand": "LG"
    },
    {
        "name": "LG Gram Style 16",
        "brand": "LG"
    },
    {
        "name": "LG UltraPC 16",
        "brand": "LG"
    },
    {
        "name": "Microsoft Surface Laptop 3",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop 4",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop 5",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop 6",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop 7",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop Go",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop Go 2",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop Go 3",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop Studio",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Laptop Studio 2",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 7",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 8",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 9",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 10",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 11",
        "brand": "Microsoft"
    },
    {
        "name": "Razer Blade 14",
        "brand": "Razer"
    },
    {
        "name": "Razer Blade 15",
        "brand": "Razer"
    },
    {
        "name": "Razer Blade 16",
        "brand": "Razer"
    },
    {
        "name": "Razer Blade 17",
        "brand": "Razer"
    },
    {
        "name": "Razer Blade 18",
        "brand": "Razer"
    },
    {
        "name": "Gigabyte Aorus 15",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aorus 15G",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aorus 15P",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aorus 17",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aorus 17G",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aorus 17X",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte G5",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte G6",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte A5",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aero 14",
        "brand": "Gigabyte"
    },
    {
        "name": "Gigabyte Aero 16",
        "brand": "Gigabyte"
    },
    {
        "name": "Xiaomi Mi Notebook 14",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi Notebook 14 Horizon Edition",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi Notebook Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi Notebook Ultra",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Book Pro 14",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Book Pro 16",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Book S 12.4",
        "brand": "Xiaomi"
    },
    {
        "name": "Honor MagicBook 14",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicBook 15",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicBook X14",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicBook X15",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicBook Pro 16",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicBook Art 14",
        "brand": "Honor"
    },
    {
        "name": "Huawei MateBook D 14",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook D 15",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook D 16",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook 14",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook 14s",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook 16s",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MateBook X Pro",
        "brand": "Huawei"
    }
];

const MOBILE_MODELS: { name: string; brand: string }[] = [
    {
        "name": "iPhone SE (2nd Gen)",
        "brand": "Apple"
    },
    {
        "name": "iPhone 12",
        "brand": "Apple"
    },
    {
        "name": "iPhone 12 mini",
        "brand": "Apple"
    },
    {
        "name": "iPhone 12 Pro",
        "brand": "Apple"
    },
    {
        "name": "iPhone 12 Pro Max",
        "brand": "Apple"
    },
    {
        "name": "iPhone 13",
        "brand": "Apple"
    },
    {
        "name": "iPhone 13 mini",
        "brand": "Apple"
    },
    {
        "name": "iPhone 13 Pro",
        "brand": "Apple"
    },
    {
        "name": "iPhone 13 Pro Max",
        "brand": "Apple"
    },
    {
        "name": "iPhone SE (3rd Gen)",
        "brand": "Apple"
    },
    {
        "name": "iPhone 14",
        "brand": "Apple"
    },
    {
        "name": "iPhone 14 Plus",
        "brand": "Apple"
    },
    {
        "name": "iPhone 14 Pro",
        "brand": "Apple"
    },
    {
        "name": "iPhone 14 Pro Max",
        "brand": "Apple"
    },
    {
        "name": "iPhone 15",
        "brand": "Apple"
    },
    {
        "name": "iPhone 15 Plus",
        "brand": "Apple"
    },
    {
        "name": "iPhone 15 Pro",
        "brand": "Apple"
    },
    {
        "name": "iPhone 15 Pro Max",
        "brand": "Apple"
    },
    {
        "name": "iPhone 16",
        "brand": "Apple"
    },
    {
        "name": "iPhone 16 Plus",
        "brand": "Apple"
    },
    {
        "name": "iPhone 16 Pro",
        "brand": "Apple"
    },
    {
        "name": "iPhone 16 Pro Max",
        "brand": "Apple"
    },
    {
        "name": "iPhone 16e",
        "brand": "Apple"
    },
    {
        "name": "Samsung Galaxy S20",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S20+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S20 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S20 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S21",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S21+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S21 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S21 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S22",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S22+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S22 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S23",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S23+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S23 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S23 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S24",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S24+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S24 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S24 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S25",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S25+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S25 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy S25 Slim",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Note 20",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Note 20 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Fold2",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Fold3",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Fold4",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Fold5",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Fold6",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip3",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip4",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip5",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Z Flip6",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A12",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A13",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A14",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A14 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A15",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A15 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A16 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A21s",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A22",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A22 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A23",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A23 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A24",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A25 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A31",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A32",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A33 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A34 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A35 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A51",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A52",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A52s 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A53 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A54 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A55 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A71",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A72",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy A73 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M12",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M13",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M14 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M21",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M31",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M32",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M33 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M34 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M35 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M51",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M52 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M53 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M54 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy M55 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy F13",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy F14 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy F23 5G",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy F54 5G",
        "brand": "Samsung"
    },
    {
        "name": "OnePlus 8",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 8 Pro",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 8T",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 9",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 9 Pro",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 9R",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 9RT",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 10 Pro",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 10R",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 10T",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 11",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 11R",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 12",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 12R",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 13",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus 13R",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Open",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord 2",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord 2T",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord 3",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord 4",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 2",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 2 Lite",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 3",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 3 Lite",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 4",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord CE 4 Lite",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord N10",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord N100",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord N20",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Nord N30",
        "brand": "OnePlus"
    },
    {
        "name": "Pixel 4a",
        "brand": "Google"
    },
    {
        "name": "Pixel 4a 5G",
        "brand": "Google"
    },
    {
        "name": "Pixel 5",
        "brand": "Google"
    },
    {
        "name": "Pixel 5a 5G",
        "brand": "Google"
    },
    {
        "name": "Pixel 6",
        "brand": "Google"
    },
    {
        "name": "Pixel 6 Pro",
        "brand": "Google"
    },
    {
        "name": "Pixel 6a",
        "brand": "Google"
    },
    {
        "name": "Pixel 7",
        "brand": "Google"
    },
    {
        "name": "Pixel 7 Pro",
        "brand": "Google"
    },
    {
        "name": "Pixel 7a",
        "brand": "Google"
    },
    {
        "name": "Pixel 8",
        "brand": "Google"
    },
    {
        "name": "Pixel 8 Pro",
        "brand": "Google"
    },
    {
        "name": "Pixel 8a",
        "brand": "Google"
    },
    {
        "name": "Pixel 9",
        "brand": "Google"
    },
    {
        "name": "Pixel 9 Pro",
        "brand": "Google"
    },
    {
        "name": "Pixel 9 Pro XL",
        "brand": "Google"
    },
    {
        "name": "Pixel 9 Pro Fold",
        "brand": "Google"
    },
    {
        "name": "Pixel Fold",
        "brand": "Google"
    },
    {
        "name": "Xiaomi Mi 10",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 10T",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 10T Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 11",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 11X",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 11X Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Mi 11 Ultra",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 11T Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 11 Lite NE 5G",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 12 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 12",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 13 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 13",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 13 Ultra",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 13T",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 13T Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14 Ultra",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14 CIVI",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14T",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 14T Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 15",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 15 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi 15 Ultra",
        "brand": "Xiaomi"
    },
    {
        "name": "Redmi Note 9",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 9 Pro",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 9 Pro Max",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 10",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 10 Pro",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 10 Pro Max",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 10S",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 10T 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 11",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 11 Pro",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 11 Pro+ 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 11S",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 11T 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 12",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 12 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 12 Pro 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 12 Pro+ 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 13",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 13 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 13 Pro 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 13 Pro+ 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 14",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 14 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 14 Pro 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Note 14 Pro+ 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 9",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 9A",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 10",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 10A",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 10 Prime",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 11 Prime 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 12",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 12 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 12C",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 13 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 13C",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 13C 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi 14C",
        "brand": "Redmi"
    },
    {
        "name": "Redmi A1",
        "brand": "Redmi"
    },
    {
        "name": "Redmi A2",
        "brand": "Redmi"
    },
    {
        "name": "Redmi A3",
        "brand": "Redmi"
    },
    {
        "name": "Redmi A4 5G",
        "brand": "Redmi"
    },
    {
        "name": "Redmi K50i",
        "brand": "Redmi"
    },
    {
        "name": "Poco X3",
        "brand": "Poco"
    },
    {
        "name": "Poco X3 Pro",
        "brand": "Poco"
    },
    {
        "name": "Poco X4 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco X5 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco X5 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco X6 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco X6 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco X6 Neo",
        "brand": "Poco"
    },
    {
        "name": "Poco X7",
        "brand": "Poco"
    },
    {
        "name": "Poco X7 Pro",
        "brand": "Poco"
    },
    {
        "name": "Poco F3 GT",
        "brand": "Poco"
    },
    {
        "name": "Poco F4 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco F5 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco F6 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco F6 Pro",
        "brand": "Poco"
    },
    {
        "name": "Poco M3",
        "brand": "Poco"
    },
    {
        "name": "Poco M3 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco M4 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco M4 Pro",
        "brand": "Poco"
    },
    {
        "name": "Poco M4 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco M5",
        "brand": "Poco"
    },
    {
        "name": "Poco M6 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco M6 Pro 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco M6 Plus 5G",
        "brand": "Poco"
    },
    {
        "name": "Poco C31",
        "brand": "Poco"
    },
    {
        "name": "Poco C50",
        "brand": "Poco"
    },
    {
        "name": "Poco C51",
        "brand": "Poco"
    },
    {
        "name": "Poco C55",
        "brand": "Poco"
    },
    {
        "name": "Poco C61",
        "brand": "Poco"
    },
    {
        "name": "Poco C65",
        "brand": "Poco"
    },
    {
        "name": "Poco C75",
        "brand": "Poco"
    },
    {
        "name": "Realme 7",
        "brand": "Realme"
    },
    {
        "name": "Realme 7 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 8",
        "brand": "Realme"
    },
    {
        "name": "Realme 8 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 8s 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 8i",
        "brand": "Realme"
    },
    {
        "name": "Realme 9",
        "brand": "Realme"
    },
    {
        "name": "Realme 9 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 9 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme 9 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 9i",
        "brand": "Realme"
    },
    {
        "name": "Realme 10",
        "brand": "Realme"
    },
    {
        "name": "Realme 10 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 10 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme 11",
        "brand": "Realme"
    },
    {
        "name": "Realme 11 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 11 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme 11x 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 12",
        "brand": "Realme"
    },
    {
        "name": "Realme 12 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 12 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme 12+ 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 12x 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 13",
        "brand": "Realme"
    },
    {
        "name": "Realme 13 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 13 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme 13+ 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme 14 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme 14 Pro+",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme GT Master Edition",
        "brand": "Realme"
    },
    {
        "name": "Realme GT Neo 2",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 2",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 2 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme GT Neo 3",
        "brand": "Realme"
    },
    {
        "name": "Realme GT Neo 3T",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 6",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 6T",
        "brand": "Realme"
    },
    {
        "name": "Realme GT 7 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 30",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 50",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 50 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 60",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 60 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 60x 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 70 Pro",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 70x 5G",
        "brand": "Realme"
    },
    {
        "name": "Realme Narzo 70 Turbo",
        "brand": "Realme"
    },
    {
        "name": "Realme C11",
        "brand": "Realme"
    },
    {
        "name": "Realme C12",
        "brand": "Realme"
    },
    {
        "name": "Realme C15",
        "brand": "Realme"
    },
    {
        "name": "Realme C21",
        "brand": "Realme"
    },
    {
        "name": "Realme C25",
        "brand": "Realme"
    },
    {
        "name": "Realme C31",
        "brand": "Realme"
    },
    {
        "name": "Realme C33",
        "brand": "Realme"
    },
    {
        "name": "Realme C35",
        "brand": "Realme"
    },
    {
        "name": "Realme C51",
        "brand": "Realme"
    },
    {
        "name": "Realme C53",
        "brand": "Realme"
    },
    {
        "name": "Realme C55",
        "brand": "Realme"
    },
    {
        "name": "Realme C61",
        "brand": "Realme"
    },
    {
        "name": "Realme C63",
        "brand": "Realme"
    },
    {
        "name": "Realme C65",
        "brand": "Realme"
    },
    {
        "name": "Realme C67",
        "brand": "Realme"
    },
    {
        "name": "Vivo V20",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V20 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V21 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V23 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V23 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V25 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V25 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V27 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V27 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V29 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V29 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V29e",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V30 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V30 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V30e",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V40 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V40 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo V40e",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X60",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X60 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X70 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X70 Pro+",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X80",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X80 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X90",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X90 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X100",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X100 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X200",
        "brand": "Vivo"
    },
    {
        "name": "Vivo X200 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T1 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T1 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T2 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T2 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T3 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T3 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T3x 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo T3 Ultra",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y20",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y21",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y22",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y27",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y28 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y56 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y58 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y100 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y200 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y200 Pro",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y200e 5G",
        "brand": "Vivo"
    },
    {
        "name": "Vivo Y300 5G",
        "brand": "Vivo"
    },
    {
        "name": "iQOO 7",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 7 Legend",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 9",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 9 Pro",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 9 SE",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 9T",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 11",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 12",
        "brand": "iQOO"
    },
    {
        "name": "iQOO 13",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Neo 6",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Neo 7",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Neo 7 Pro",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Neo 9 Pro",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Neo 10",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z3",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z5",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z6 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z6 Pro",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z6 Lite 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z7 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z7 Pro",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z9 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z9x 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z9s 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z9s Pro 5G",
        "brand": "iQOO"
    },
    {
        "name": "iQOO Z9 Turbo",
        "brand": "iQOO"
    },
    {
        "name": "Oppo Reno 5 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 6",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 6 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 7",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 7 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 8",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 8 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 8T",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 10",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 10 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 10 Pro+",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 11",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 11 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 11F",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 12",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 12 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Reno 12F",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X2",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X2 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X3 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X5 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X6 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X7 Ultra",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X8",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find X8 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find N2 Flip",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find N3 Flip",
        "brand": "Oppo"
    },
    {
        "name": "Oppo Find N3",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F17",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F17 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F19",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F19 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F19 Pro+",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F21 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F21 Pro 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F21s Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F23 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F25 Pro 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F27 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo F27 Pro+ 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A15",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A16",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A17",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A18",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A38",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A53",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A54",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A55",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A57",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A58",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A59 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A74 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A76",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A77 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A78 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A79 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A3 Pro",
        "brand": "Oppo"
    },
    {
        "name": "Oppo A60",
        "brand": "Oppo"
    },
    {
        "name": "Oppo K10",
        "brand": "Oppo"
    },
    {
        "name": "Oppo K10 5G",
        "brand": "Oppo"
    },
    {
        "name": "Oppo K12x 5G",
        "brand": "Oppo"
    },
    {
        "name": "Motorola Edge 20",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 20 Fusion",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 20 Pro",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 30",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 30 Fusion",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 30 Pro",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 30 Ultra",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 40",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 40 Neo",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 40 Pro",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 50 Fusion",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 50 Pro",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 50 Ultra",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Edge 50 Neo",
        "brand": "Motorola"
    },
    {
        "name": "Moto G31",
        "brand": "Motorola"
    },
    {
        "name": "Moto G42",
        "brand": "Motorola"
    },
    {
        "name": "Moto G51 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G52",
        "brand": "Motorola"
    },
    {
        "name": "Moto G60",
        "brand": "Motorola"
    },
    {
        "name": "Moto G71 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G72",
        "brand": "Motorola"
    },
    {
        "name": "Moto G82 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G84 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G85 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G13",
        "brand": "Motorola"
    },
    {
        "name": "Moto G14",
        "brand": "Motorola"
    },
    {
        "name": "Moto G23",
        "brand": "Motorola"
    },
    {
        "name": "Moto G24",
        "brand": "Motorola"
    },
    {
        "name": "Moto G32",
        "brand": "Motorola"
    },
    {
        "name": "Moto G34 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G54 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G64 5G",
        "brand": "Motorola"
    },
    {
        "name": "Moto G04",
        "brand": "Motorola"
    },
    {
        "name": "Moto G04s",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Razr 5G",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Razr 40",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Razr 40 Ultra",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Razr 50",
        "brand": "Motorola"
    },
    {
        "name": "Motorola Razr 50 Ultra",
        "brand": "Motorola"
    },
    {
        "name": "Nokia G10",
        "brand": "Nokia"
    },
    {
        "name": "Nokia G20",
        "brand": "Nokia"
    },
    {
        "name": "Nokia G21",
        "brand": "Nokia"
    },
    {
        "name": "Nokia G42 5G",
        "brand": "Nokia"
    },
    {
        "name": "Nokia G60 5G",
        "brand": "Nokia"
    },
    {
        "name": "Nokia G310",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C01 Plus",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C12",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C20",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C21 Plus",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C22",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C31",
        "brand": "Nokia"
    },
    {
        "name": "Nokia C32",
        "brand": "Nokia"
    },
    {
        "name": "Nokia X10",
        "brand": "Nokia"
    },
    {
        "name": "Nokia X20",
        "brand": "Nokia"
    },
    {
        "name": "Nokia X30 5G",
        "brand": "Nokia"
    },
    {
        "name": "Nokia XR20",
        "brand": "Nokia"
    },
    {
        "name": "Nokia XR21",
        "brand": "Nokia"
    },
    {
        "name": "Nokia 3210 (2024)",
        "brand": "Nokia"
    },
    {
        "name": "Nokia 3310 (2020)",
        "brand": "Nokia"
    },
    {
        "name": "Nokia 5310 (2020)",
        "brand": "Nokia"
    },
    {
        "name": "Nokia 6300 4G",
        "brand": "Nokia"
    },
    {
        "name": "Nothing Phone (1)",
        "brand": "Nothing"
    },
    {
        "name": "Nothing Phone (2)",
        "brand": "Nothing"
    },
    {
        "name": "Nothing Phone (2a)",
        "brand": "Nothing"
    },
    {
        "name": "Nothing Phone (2a) Plus",
        "brand": "Nothing"
    },
    {
        "name": "CMF Phone 1",
        "brand": "Nothing"
    },
    {
        "name": "Infinix Note 10",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 10 Pro",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 11",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 11 Pro",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 12",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 12 Pro 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 30 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 30 Pro",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 40 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 40 Pro 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Note 40 Pro+ 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 8i",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 5G 2023",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 20",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 30 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero 40 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Zero Flip",
        "brand": "Infinix"
    },
    {
        "name": "Infinix GT 10 Pro",
        "brand": "Infinix"
    },
    {
        "name": "Infinix GT 20 Pro",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 10",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 11",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 11S",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 12",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 20 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 30 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 40i",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 50 5G",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Hot 50 Pro+",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Smart 5",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Smart 6",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Smart 7",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Smart 8",
        "brand": "Infinix"
    },
    {
        "name": "Infinix Smart 8 HD",
        "brand": "Infinix"
    },
    {
        "name": "Tecno Camon 17",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 18",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 19",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 19 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 20",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 20 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 20 Premier 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 30 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 30 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Camon 30 Premier 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova 2",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova 3",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova 4",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova 5 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Pova 6 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 7",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 8",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 8 Pro",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 9",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 10",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 10 Pro",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 20",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 20 Pro",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Spark 20 Pro+",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom X",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom X2 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom X2 Pro 5G",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom V Fold",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom V Flip",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom V Fold2",
        "brand": "Tecno"
    },
    {
        "name": "Tecno Phantom V Flip2",
        "brand": "Tecno"
    },
    {
        "name": "Lava Agni 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Agni 2 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Agni 3 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Blaze 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Blaze Pro 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Blaze 2 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Blaze Curve 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Blaze 3 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Yuva 2 Pro",
        "brand": "Lava"
    },
    {
        "name": "Lava Yuva 3 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava Yuva 3 Pro",
        "brand": "Lava"
    },
    {
        "name": "Lava Storm 5G",
        "brand": "Lava"
    },
    {
        "name": "Lava O2",
        "brand": "Lava"
    },
    {
        "name": "Honor 50",
        "brand": "Honor"
    },
    {
        "name": "Honor 50 Lite",
        "brand": "Honor"
    },
    {
        "name": "Honor 70",
        "brand": "Honor"
    },
    {
        "name": "Honor 90 5G",
        "brand": "Honor"
    },
    {
        "name": "Honor 200",
        "brand": "Honor"
    },
    {
        "name": "Honor 200 Pro",
        "brand": "Honor"
    },
    {
        "name": "Honor 200 Lite",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic 3",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic 4 Pro",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic 5 Pro",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic 6 Pro",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic V2",
        "brand": "Honor"
    },
    {
        "name": "Honor Magic V3",
        "brand": "Honor"
    },
    {
        "name": "Honor X9b",
        "brand": "Honor"
    },
    {
        "name": "Huawei P40",
        "brand": "Huawei"
    },
    {
        "name": "Huawei P40 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei P50",
        "brand": "Huawei"
    },
    {
        "name": "Huawei P50 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei P60 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Pura 70",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Pura 70 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Pura 70 Ultra",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate 40 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate 50 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate 60 Pro",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate XT Ultimate",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate X3",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Mate X5",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 7",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 8",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 9",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 10",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 11",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 12",
        "brand": "Huawei"
    },
    {
        "name": "Huawei Nova 12s",
        "brand": "Huawei"
    }
];

const TABLET_MODELS: { name: string; brand: string }[] = [
    {
        "name": "iPad 8th Gen (2020)",
        "brand": "Apple"
    },
    {
        "name": "iPad 9th Gen (2021)",
        "brand": "Apple"
    },
    {
        "name": "iPad 10th Gen (2022)",
        "brand": "Apple"
    },
    {
        "name": "iPad Air 4th Gen (2020)",
        "brand": "Apple"
    },
    {
        "name": "iPad Air 5th Gen (M1, 2022)",
        "brand": "Apple"
    },
    {
        "name": "iPad Air 11-inch (M2, 2024)",
        "brand": "Apple"
    },
    {
        "name": "iPad Air 13-inch (M2, 2024)",
        "brand": "Apple"
    },
    {
        "name": "iPad mini 6th Gen (2021)",
        "brand": "Apple"
    },
    {
        "name": "iPad mini 7th Gen (2024)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 11-inch 2nd Gen (2020)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 11-inch 3rd Gen (M1, 2021)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 11-inch 4th Gen (M2, 2022)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 11-inch (M4, 2024)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 12.9-inch 4th Gen (2020)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 12.9-inch 5th Gen (M1, 2021)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 12.9-inch 6th Gen (M2, 2022)",
        "brand": "Apple"
    },
    {
        "name": "iPad Pro 13-inch (M4, 2024)",
        "brand": "Apple"
    },
    {
        "name": "Samsung Galaxy Tab S6 Lite (2020)",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S6 Lite (2022)",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S6 Lite (2024)",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S7",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S7+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S7 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S8",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S8+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S8 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S9",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S9+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S9 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S9 FE",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S9 FE+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S10",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S10+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab S10 Ultra",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab A7 (2020)",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab A7 Lite",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab A8 10.5",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab A9",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab A9+",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab Active3",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab Active4 Pro",
        "brand": "Samsung"
    },
    {
        "name": "Samsung Galaxy Tab Active5",
        "brand": "Samsung"
    },
    {
        "name": "Lenovo Tab M8 (2nd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M8 (3rd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M8 (4th Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M10 (2nd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M10 (3rd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M10 Plus (3rd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab M11",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P11",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P11 Plus",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P11 Pro",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P11 Pro (2nd Gen)",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P12",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab P12 Pro",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Tab Extreme",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga Tab 11",
        "brand": "Lenovo"
    },
    {
        "name": "Lenovo Yoga Tab 13",
        "brand": "Lenovo"
    },
    {
        "name": "Xiaomi Pad 5",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 5 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 6",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 6 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 6S Pro 12.4",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 7",
        "brand": "Xiaomi"
    },
    {
        "name": "Xiaomi Pad 7 Pro",
        "brand": "Xiaomi"
    },
    {
        "name": "Redmi Pad",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Pad SE",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Pad SE 8.7",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Pad Pro",
        "brand": "Redmi"
    },
    {
        "name": "Redmi Pad Pro 5G",
        "brand": "Redmi"
    },
    {
        "name": "Realme Pad",
        "brand": "Realme"
    },
    {
        "name": "Realme Pad Mini",
        "brand": "Realme"
    },
    {
        "name": "Realme Pad X",
        "brand": "Realme"
    },
    {
        "name": "Realme Pad 2",
        "brand": "Realme"
    },
    {
        "name": "Realme Pad 2 Lite",
        "brand": "Realme"
    },
    {
        "name": "OnePlus Pad",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Pad Go",
        "brand": "OnePlus"
    },
    {
        "name": "OnePlus Pad 2",
        "brand": "OnePlus"
    },
    {
        "name": "Amazon Fire 7 (2022)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 8 (2020)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 8 (2022)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 8 Plus (2020)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 8 Plus (2022)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 10 (2021)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 10 (2023)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire HD 10 Plus (2021)",
        "brand": "Amazon"
    },
    {
        "name": "Amazon Fire Max 11 (2023)",
        "brand": "Amazon"
    },
    {
        "name": "TCL 10 TABMAX",
        "brand": "TCL"
    },
    {
        "name": "TCL TAB 10s",
        "brand": "TCL"
    },
    {
        "name": "TCL TAB 10L",
        "brand": "TCL"
    },
    {
        "name": "TCL NXTPAPER 10s",
        "brand": "TCL"
    },
    {
        "name": "TCL NXTPAPER 11",
        "brand": "TCL"
    },
    {
        "name": "TCL NXTPAPER 12 Pro",
        "brand": "TCL"
    },
    {
        "name": "TCL TAB 11",
        "brand": "TCL"
    },
    {
        "name": "Microsoft Surface Go 2",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Go 3",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Go 4",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 7",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 7+",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 8",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 9",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 10",
        "brand": "Microsoft"
    },
    {
        "name": "Microsoft Surface Pro 11",
        "brand": "Microsoft"
    },
    {
        "name": "Honor Pad 6",
        "brand": "Honor"
    },
    {
        "name": "Honor Pad 8",
        "brand": "Honor"
    },
    {
        "name": "Honor Pad 9",
        "brand": "Honor"
    },
    {
        "name": "Honor Pad X8",
        "brand": "Honor"
    },
    {
        "name": "Honor Pad X8a",
        "brand": "Honor"
    },
    {
        "name": "Honor Pad X9",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicPad 13",
        "brand": "Honor"
    },
    {
        "name": "Honor MagicPad 2",
        "brand": "Honor"
    },
    {
        "name": "Huawei MatePad 10.4",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad 11",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad 11.5",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad 11.5 S",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad Pro 10.8",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad Pro 11",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad Pro 12.6",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad Pro 13.2",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad 12 X",
        "brand": "Huawei"
    },
    {
        "name": "Huawei MatePad Air 12",
        "brand": "Huawei"
    },
    {
        "name": "Acer One 8",
        "brand": "Acer"
    },
    {
        "name": "Acer One 10",
        "brand": "Acer"
    },
    {
        "name": "Acer Iconia Tab P10",
        "brand": "Acer"
    },
    {
        "name": "Acer Iconia Tab M10",
        "brand": "Acer"
    }
];


// ─────────────────────────────────────────────────────────────────────────────
// Main Seed Function
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBrandsModelsExpansion(): Promise<void> {
    logger.info('🌱 Starting comprehensive 2020–2026 brands-models-expansion seed...');

    // ── Step 1: Link multi-category brands ────────────────────────────────────
    logger.info('🔗 Step 1: Linking multi-category brands to their respective categories...');
    const brandData = MULTI_CATEGORY_BRANDS.map(b => ({
        name: b.name,
        categories: b.categories,
    }));
    const brandResult = await CatalogImportService.importBrands(brandData);
    logger.info(`   Brands updated/linked: ${brandResult.success}, failed: ${brandResult.failed}`);
    if (brandResult.errors.length) logger.warn('   Errors:', brandResult.errors);

    // ── Step 2: LED TVs — ensure standard screen sizes ────────────────────────
    // P1-8: screen-size write path relocated behind the catalog domain.
    logger.info('📺 Step 2: Ensuring LED TV screen sizes (42", 48", 77", 86")...');
    await CatalogSeedService.ensureScreenSizes('led-tvs', MISSING_TV_SIZES);
    logger.info(`   Screen sizes ensured: ${MISSING_TV_SIZES.map(s => s.size).join(', ')}`);

    // ── Step 3: Drones — add 2020–2026 models ─────────────────────────────────
    logger.info('🚁 Step 3: Adding Drone models (2020–2026 across 16 brands)...');
    const droneData = DRONE_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Drones',
    }));
    const droneResult = await CatalogImportService.importModels(droneData);
    logger.info(`   Drone models processed: ${droneResult.success}, failed: ${droneResult.failed}`);
    if (droneResult.errors.length) logger.warn('   Errors:', droneResult.errors);

    // ── Step 4: Laptops — add 2020–2026 models ────────────────────────────────
    logger.info('💻 Step 4: Adding Laptop models (2020–2026)...');
    const laptopData = LAPTOP_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Laptops',
    }));
    const laptopResult = await CatalogImportService.importModels(laptopData);
    logger.info(`   Laptop models processed: ${laptopResult.success}, failed: ${laptopResult.failed}`);
    if (laptopResult.errors.length) logger.warn('   Errors:', laptopResult.errors);

    // ── Step 5: Mobiles — add 2020–2026 models ────────────────────────────────
    logger.info('📱 Step 5: Adding Mobile models (2020–2026)...');
    const mobileData = MOBILE_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Mobiles',
    }));
    const mobileResult = await CatalogImportService.importModels(mobileData);
    logger.info(`   Mobile models processed: ${mobileResult.success}, failed: ${mobileResult.failed}`);
    if (mobileResult.errors.length) logger.warn('   Errors:', mobileResult.errors);

    // ── Step 6: Tablets — add 2020–2026 models ────────────────────────────────
    logger.info('📟 Step 6: Adding Tablet models (2020–2026)...');
    const tabletData = TABLET_MODELS.map(m => ({
        name: m.name,
        brand: m.brand,
        category: 'Tablets',
    }));
    const tabletResult = await CatalogImportService.importModels(tabletData);
    logger.info(`   Tablet models processed: ${tabletResult.success}, failed: ${tabletResult.failed}`);
    if (tabletResult.errors.length) logger.warn('   Errors:', tabletResult.errors);

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalModels =
        droneResult.success +
        laptopResult.success +
        mobileResult.success +
        tabletResult.success;

    logger.info('');
    logger.info('✅ 2020–2026 brands-models-expansion seed complete.');
    logger.info(`   Multi-category brands processed: ${brandResult.success}`);
    logger.info(`   Screen sizes verified:           ${MISSING_TV_SIZES.length}`);
    logger.info(`   Drone models:                    ${droneResult.success}`);
    logger.info(`   Laptop models:                   ${laptopResult.success}`);
    logger.info(`   Mobile models:                   ${mobileResult.success}`);
    logger.info(`   Tablet models:                   ${tabletResult.success}`);
    logger.info(`   Total models processed:          ${totalModels}`);
}
